import './config/zod-setup';
import cluster from 'cluster';
import os from 'os';
import express from 'express';
import { authenticate, authorize } from './common/middleware/auth.middleware';
import { logger } from './common/utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import v1Routes from './modules/v1.routes';
import { eventRoutes } from './modules/events/events.routes';
import { statusRoutes } from './modules/status/status.routes';
import { registerWarRoomGateway } from './modules/warroom/warroom.gateway';
import { registerSLARepeatable, slaQueue } from './modules/sla/sla.queue';
import { webhookQueue } from './modules/webhooks/webhook.queue';
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
import { metricsMiddleware, getMetricsHandler, startMetricsInterval, stopMetricsInterval } from './common/middleware/metrics.middleware';
import { redis } from './common/utils/redis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const app = express();

// Trust the reverse proxy (Nginx / Docker) to accurately provide the client's real IP
// Without this, express-rate-limit will apply globals limits to the Docker bridge IP!
app.set('trust proxy', true);

if (env.SENTRY_DSN) {
    const isProduction = env.NODE_ENV === 'production';
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        integrations: [
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: isProduction ? 0.2 : 1.0,
        profilesSampleRate: isProduction ? 0.2 : 1.0,
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
    queues: [new BullMQAdapter(slaQueue), new BullMQAdapter(webhookQueue)],
    serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', authenticate, authorize(['ADMIN']), bullBoardAdapter.getRouter());

// Public status page (no auth) — safe non-sensitive data only
app.use('/status-data', statusRoutes);

// Auth routes with strict rate limiting — versioned
app.use('/auth/v1', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes); // backward compat

// SSE events — no CSRF needed (GET-only, read-only stream)
app.use('/api/v1/events', apiLimiter, eventRoutes);

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
    if (cluster.isPrimary) {
        // Railway servers can have 48+ virtual CPUs, which causes OOM (Out Of Memory)
        // limits if we spawn a node process for each one. 
        // We limit it to WEB_CONCURRENCY env var, or max 2 workers by default for safety.
        const defaultWorkers = Math.min(os.cpus().length, 2);
        const numCPUs = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : defaultWorkers;

        logger.info(`Primary process ${process.pid} is running`);
        logger.info(`Starting cluster with ${numCPUs} workers (Total CPUs available: ${os.cpus().length})...`);

        // Start Prometheus Aggregator Registry on the primary process
        // This combines metrics from all clustered workers into a single /metrics endpoint
        const { client } = require('./common/middleware/metrics.middleware');
        const aggregatorRegistry = new client.AggregatorRegistry();

        const metricsApp = require('express')();
        metricsApp.get('/metrics', async (_req: any, res: any) => {
            try {
                const metrics = await aggregatorRegistry.clusterMetrics();
                res.set('Content-Type', aggregatorRegistry.contentType);
                res.send(metrics);
            } catch (ex: any) {
                logger.error(`Error generating cluster metrics: ${ex.message}`, { stack: ex.stack });
                res.status(500).send('Internal Server Error');
            }
        });

        const METRICS_PORT = 3002;
        metricsApp.listen(METRICS_PORT, () => {
            logger.info(`Primary metrics aggregator listening on port ${METRICS_PORT}`);
        });

        // Register SLA enforcement repeatable job (runs only once via primary)
        registerSLARepeatable().catch(err =>
            logger.error('Failed to register SLA repeatable job', { error: err.message })
        );

        // Fork workers
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
            logger.info('Starting a new worker...');
            cluster.fork();
        });

        // Graceful shutdown array for primary
        const shutdownPrimary = async (signal: string) => {
            logger.info(`Primary received ${signal}. Shutting down all workers...`);
            for (const id in cluster.workers) {
                cluster.workers[id]?.kill(signal);
            }
            // Primary awaits workers dying then closes queues
            await slaQueue.close();
            await webhookQueue.close();
            await prisma.$disconnect();
            await redis.quit();
            logger.info('Primary shutdown complete');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
        process.on('SIGINT', () => shutdownPrimary('SIGINT'));

    } else {
        // Worker Process needs to import metrics so it hooks into cluster events
        const { client } = require('./common/middleware/metrics.middleware');
        // HUGE GOTCHA: prom-client only registers the worker IPC listener INSIDE the AggregatorRegistry constructor.
        // Therefore, we MUST instantiate it once in the worker process too, even if we don't use it here.
        new client.AggregatorRegistry();

        const server = app.listen(PORT, () => {
            logger.info(`Worker ${process.pid} started ProdKB server on port ${PORT}`);
            if (cluster.worker?.id === 1) { // Log these only once
                logger.info(` Email notifications: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
                logger.info(' Rate limiting: Enabled');
                logger.info(' API version: v1 (with backward compat)');
            }

            // Start active users metric collection (worker 1 only to prevent duplicates)
            if (cluster.worker?.id === 1) {
                startMetricsInterval();
            }
        });

        // Socket.io for Discussion Room — attach to HTTP server
        // IMPORTANT: In cluster mode every worker gets its own Socket.io server.
        // Without a shared adapter, messages sent from worker-A never reach clients
        // connected to worker-B. The Redis adapter fixes this via pub/sub.
        const { Server: SocketIOServer } = require('socket.io');
        const { createAdapter } = require('@socket.io/redis-adapter');
        const { createClient } = require('ioredis');

        const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
        const pubClient = createClient(REDIS_URL);
        const subClient = pubClient.duplicate();

        pubClient.on('error', (err: Error) => logger.error('Socket.io Redis pub error', { error: err.message }));
        subClient.on('error', (err: Error) => logger.error('Socket.io Redis sub error', { error: err.message }));

        const io = new SocketIOServer(server, {
            cors: { origin: allowedOrigins, credentials: true },
            path: '/socket.io',
        });
        io.adapter(createAdapter(pubClient, subClient));
        registerWarRoomGateway(io);



        // Graceful shutdown array for worker
        const shutdownWorker = async (signal: string) => {
            logger.info(`Worker ${process.pid} received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                logger.info(`Worker ${process.pid} HTTP server closed`);
                await prisma.$disconnect();

                if (cluster.worker?.id === 1) {
                    stopMetricsInterval();
                }

                await redis.quit();
                logger.info(`Worker ${process.pid} disconnected`);
                process.exit(0);
            });

            // Force exit after 10 seconds if graceful shutdown fails
            setTimeout(() => {
                logger.error(`Worker ${process.pid} forced shutdown after timeout`);
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
        process.on('SIGINT', () => shutdownWorker('SIGINT'));
    }
}
