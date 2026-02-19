import express from 'express';
import { logger } from './common/utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import v1Routes from './modules/v1.routes';
import apiRoutes from './modules/api.routes';
import { slaEnforcementService } from './modules/sla/sla-enforcement.service';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { apiLimiter, authLimiter } from './common/middleware/rate-limiter.middleware';
import { errorHandler } from './common/middleware/error.middleware';
import { notFoundHandler } from './common/middleware/not-found.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestTimeout } from './common/middleware/timeout.middleware';
import { prisma } from './common/utils/prisma';

const app = express();

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// Request ID for log correlation (must be early in the chain)
app.use(requestIdMiddleware);

// Request timeout — 30s default, prevents stalled connections
app.use(requestTimeout(30000));

// Health check (no rate limiting) — deep check verifies DB connectivity
app.get('/health', async (req, res) => {
    const uptime = process.uptime();
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime),
            database: 'connected',
        });
    } catch {
        res.status(503).json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime),
            database: 'disconnected',
        });
    }
});

// Auth routes with strict rate limiting — versioned
app.use('/auth/v1', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes); // backward compat

// API v1 routes with general rate limiting
app.use('/api/v1', apiLimiter, v1Routes);

// Backward compatibility: /api/* → same as /api/v1/*
app.use('/api', apiLimiter, apiRoutes);

// Swagger Documentation
const swaggerDocument = yaml.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 handler
app.use(notFoundHandler);

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

        // Start SLA enforcement cron
        slaEnforcementService.start();
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            logger.info('HTTP server closed');
            await prisma.$disconnect();
            logger.info('Prisma disconnected');
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
