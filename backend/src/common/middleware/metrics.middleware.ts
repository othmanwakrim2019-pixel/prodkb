
/**
 * Prometheus Metrics Middleware
 * Tracks HTTP request duration, count, and error rates.
 * Exposes /metrics endpoint for Prometheus scraping.
 *
 * @module common/middleware/metrics.middleware
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';

// ── Default metrics (Node.js process metrics: CPU, memory, GC, event loop) ──
client.collectDefaultMetrics({ prefix: 'prodkb_' });

// ── Custom metrics ──

export const httpRequestDuration = new client.Histogram({
    name: 'prodkb_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestsTotal = new client.Counter({
    name: 'prodkb_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

export const httpErrorsTotal = new client.Counter({
    name: 'prodkb_http_errors_total',
    help: 'Total number of HTTP errors (4xx and 5xx)',
    labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new client.Gauge({
    name: 'prodkb_active_connections',
    help: 'Number of active HTTP connections',
});

export const dbQueryDuration = new client.Histogram({
    name: 'prodkb_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['model', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const dbQueryTotal = new client.Counter({
    name: 'prodkb_db_query_total',
    help: 'Total number of database queries',
    labelNames: ['model', 'operation'],
});

export const requestSizeBytes = new client.Histogram({
    name: 'prodkb_request_size_bytes',
    help: 'Size of HTTP request bodies in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000],
});

export const activeUsers = new client.Gauge({
    name: 'prodkb_active_users',
    help: 'Number of active users based on recent API activity',
});

let metricsInterval: NodeJS.Timeout | null = null;

export const startMetricsInterval = () => {
    if (metricsInterval) return;
    metricsInterval = setInterval(async () => {
        try {
            let cursor = '0';
            let count = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'auth:*', 'COUNT', 1000);
                cursor = nextCursor;
                count += keys.length;
            } while (cursor !== '0');
            activeUsers.set(count);
        } catch (error) {
            logger.error('Failed to update active users metric', { error: (error as Error).message });
        }
    }, 15000); // every 15 seconds
};

export const stopMetricsInterval = () => {
    if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
    }
};

// ── Middleware ──
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip metrics endpoint itself to avoid recursion
    if (req.path === '/metrics') return next();

    activeConnections.inc();
    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
        activeConnections.dec();
        const route = req.route?.path || req.path || 'unknown';
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
        };

        end(labels);
        httpRequestsTotal.inc(labels);

        // Track request body size for non-GET requests
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        if (contentLength > 0) {
            requestSizeBytes.observe({ method: req.method, route }, contentLength);
        }

        if (res.statusCode >= 400) {
            httpErrorsTotal.inc(labels);
        }
    });

    next();
};

/**
 * Returns the Prometheus metrics registry for use in the /metrics endpoint.
 * In a clustered environment, this simple handler is insufficient.
 * See server.ts for the cluster AggregatorRegistry implementation.
 */
export const getMetricsHandler = async (_req: Request, res: Response) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        res.status(500).end('Error collecting metrics');
    }
};

export { client };
