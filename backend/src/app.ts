/**
 * Express Application Setup
 *
 * Configures all middleware, routes, health checks, and error handlers.
 * This file sets up the Express app — it does NOT listen or manage cluster.
 * The `server.ts` file imports this and handles listen/cluster/shutdown.
 *
 * @module app
 */

import './config/zod-setup';
import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Config
import { env } from './config/env';
import { corsMiddleware } from './config/cors';
import { helmetMiddleware, securityHeaders } from './config/helmet';
import { generateSwaggerDocs } from './config/swagger';

// Middleware
import { authenticate, authorize } from './common/middleware/auth.middleware';
import { apiLimiter } from './common/middleware/rate-limiter.middleware';
import { errorHandler } from './common/middleware/error.middleware';
import { notFoundHandler } from './common/middleware/not-found.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestTimeout } from './common/middleware/timeout.middleware';
import { csrfProtection } from './common/middleware/csrf.middleware';
import { metricsMiddleware, getMetricsHandler } from './common/middleware/metrics.middleware';

// Utils
import { logger } from './common/utils/logger';
import { prisma } from './common/utils/prisma';
import { redis } from './common/utils/redis';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import v1Routes from './modules/v1.routes';
import { eventRoutes } from './modules/events/events.routes';
import { statusRoutes } from './modules/status/status.routes';

// Queues
import { slaQueue } from './modules/sla/sla.queue';
import { webhookQueue } from './modules/webhooks/webhook.queue';

// ── Express app ──
const app = express();

// Trust reverse proxy (Nginx / Docker) for accurate client IP in rate limiting
app.set('trust proxy', true);

// ── Sentry ──
if (env.SENTRY_DSN) {
    const isProduction = env.NODE_ENV === 'production';
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        integrations: [nodeProfilingIntegration()],
        tracesSampleRate: isProduction ? 0.2 : 1.0,
        profilesSampleRate: isProduction ? 0.2 : 1.0,
    });
    logger.info(`Sentry initialized in ${env.SENTRY_ENVIRONMENT} mode`);
}

// ── Global Middleware (order matters) ──
app.use(corsMiddleware);                    // 1. CORS — must be first
app.use(helmetMiddleware);                  // 2. Security headers (helmet)
app.use(securityHeaders);                   // 3. Additional security headers
app.use(express.json({ limit: '10mb' }));   // 4. Body parser
app.use(cookieParser());                    // 5. Cookie parser
app.use(requestIdMiddleware);               // 6. Request ID for log correlation
app.use(requestTimeout(30000));             // 7. 30s request timeout
app.use(metricsMiddleware);                 // 8. Prometheus metrics

// ── Health Check — deep check verifies DB + Redis + BullMQ ──
app.get('/health', async (_req, res) => {
    const uptime = process.uptime();
    const components: Record<string, string> = {};
    let overallStatus = 'ok';

    try {
        await prisma.$queryRaw`SELECT 1`;
        components.database = 'connected';
    } catch {
        components.database = 'disconnected';
        overallStatus = 'degraded';
    }

    try {
        await redis.ping();
        components.redis = 'connected';
    } catch {
        components.redis = 'disconnected';
        overallStatus = 'degraded';
    }

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

// ── Prometheus metrics endpoint (no auth — scraped by Prometheus inside Docker) ──
app.get('/metrics', getMetricsHandler);

// ── Bull Board — queue dashboard (admin-only) ──
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');
createBullBoard({
    queues: [new BullMQAdapter(slaQueue), new BullMQAdapter(webhookQueue)],
    serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', authenticate, authorize(['ADMIN']), bullBoardAdapter.getRouter());

// ── Routes ──
app.use('/api/status-data', statusRoutes);                          // Public status page
app.use('/auth/v1', apiLimiter, authRoutes);                    // Auth (versioned)
app.use('/auth', apiLimiter, authRoutes);                       // Auth (backward compat)
app.use('/api/v1/events', apiLimiter, eventRoutes);             // SSE events (no CSRF)
app.use('/api/v1', apiLimiter, csrfProtection, v1Routes);       // API v1

// Backward compat redirect: /api/* → /api/v1/*
app.use('/api', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/v1')) return next();
    const newUrl = req.originalUrl.replace(/^\/api/, '/api/v1');
    res.redirect(308, newUrl);
});

// ── Swagger Documentation ──
try {
    const swaggerDocument = generateSwaggerDocs();
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    logger.error('Failed to generate Swagger docs', { error: e });
}

// ── Error Handling ──
app.use(notFoundHandler);
if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export { app };
