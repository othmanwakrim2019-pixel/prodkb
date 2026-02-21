import './config/zod-setup';
import express from 'express';
import { authenticate, authorize } from './common/middleware/auth.middleware';
import { logger } from './common/utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import v1Routes from './modules/v1.routes';
import { registerSLARepeatable, slaQueue } from './modules/sla/sla.queue';
import swaggerUi from 'swagger-ui-express';
import { generateSwaggerDocs } from './config/swagger';
import { apiLimiter, authLimiter } from './common/middleware/rate-limiter.middleware';
import { errorHandler } from './common/middleware/error.middleware';
import { notFoundHandler } from './common/middleware/not-found.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestTimeout } from './common/middleware/timeout.middleware';
import { prisma } from './common/utils/prisma';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './common/middleware/csrf.middleware';
import { metricsMiddleware, getMetricsHandler } from './common/middleware/metrics.middleware';
import { redis } from './common/utils/redis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const app = express();

if (env.SENTRY_DSN) {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        integrations: [
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
    logger.info(`Sentry initialized in ${env.SENTRY_ENVIRONMENT} mode`);
}

// CORS configuration - MUST be first
// Production: use CORS_ORIGINS env var (comma-separated)
// Development: fallback to localhost origins
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : isProduction
        ? [env.FRONTEND_URL || '']
        : [
            env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];

logger.info(`CORS Allowed Origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        logger.info(`Checking origin: ${origin}`);

        if (allowedOrigins.indexOf(origin) === -1) {
            logger.warn(`Blocked by CORS: ${origin}`);
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));

// Security headers with Helmet.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Request ID for log correlation (must be early in the chain)
app.use(requestIdMiddleware);

// Request timeout — 30s default, prevents stalled connections
app.use(requestTimeout(30000));

// Prometheus metrics — tracks request duration, count, error rates
app.use(metricsMiddleware);

// ── Health check — deep check verifies DB + Redis + BullMQ ──
app.get('/health', async (req, res) => {
    const uptime = process.uptime();
    const components: Record<string, string> = {};
    let overallStatus = 'ok';

    // Check database
    try {
        await prisma.$queryRaw`SELECT 1`;
        components.database = 'connected';
    } catch {
        components.database = 'disconnected';
        overallStatus = 'degraded';
    }

    // Check Redis
    try {
        await redis.ping();
        components.redis = 'connected';
    } catch {
        components.redis = 'disconnected';
        overallStatus = 'degraded';
    }

    // Check BullMQ SLA queue
    try {
        const jobs = await slaQueue.getRepeatableJobs();
        components.slaWorker = jobs.length > 0 ? 'healthy' : 'no_repeatable_jobs';
    } catch {
        components.slaWorker = 'unknown';
    }

    const statusCode = overallStatus === 'ok' ? 200 : 503;
    res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        components,
    });
});

// Prometheus metrics endpoint — no auth (scraped only by Prometheus inside Docker network)
app.get('/metrics', getMetricsHandler);

// ── Bull Board — queue dashboard (admin-only in production) ──
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');
createBullBoard({
    queues: [new BullMQAdapter(slaQueue)],
    serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', authenticate, authorize(['ADMIN']), bullBoardAdapter.getRouter());

// Auth routes with strict rate limiting — versioned
app.use('/auth/v1', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes); // backward compat

// API v1 routes with general rate limiting + CSRF protection
app.use('/api/v1', apiLimiter, csrfProtection, v1Routes);

// Backward compatibility: /api/* (not /api/v1/*) → 308 redirect to /api/v1/*
app.use('/api', (req, res, next) => {
    // Skip if already targeting /api/v1
    if (req.originalUrl.startsWith('/api/v1')) {
        return next();
    }
    const newUrl = req.originalUrl.replace(/^\/api/, '/api/v1');
    res.redirect(308, newUrl);
});

// Swagger Documentation
try {
    const swaggerDocument = generateSwaggerDocs();
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    logger.error('Failed to generate Swagger docs', { error: e });
}

// 404 handler
app.use(notFoundHandler);

// Sentry Error Handler (must be before our custom one)
if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

// Error handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

export { app };

if (require.main === module) {
    const server = app.listen(PORT, () => {
        logger.info(` ProdKB server running on port ${PORT}`);
        logger.info(` Email notifications: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
        logger.info(' Rate limiting: Enabled');
        logger.info(' API version: v1 (with backward compat)');

        // Register SLA enforcement repeatable job (processed by separate worker)
        registerSLARepeatable().catch(err =>
            logger.error('Failed to register SLA repeatable job', { error: err.message })
        );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            logger.info('HTTP server closed');
            await slaQueue.close();
            logger.info('SLA queue closed');
            await prisma.$disconnect();
            logger.info('Prisma disconnected');
            await redis.quit();
            logger.info('Redis disconnected');
            process.exit(0);
        });

        // Force exit after 10 seconds if graceful shutdown fails
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
