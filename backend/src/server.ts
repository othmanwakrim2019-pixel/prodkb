/**
 * Server Entry Point
 *
 * Handles:
 * - Cluster mode (primary forks workers, workers listen)
 * - HTTP listen
 * - Socket.io with Redis adapter (for cluster-safe WebSocket)
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Prometheus metrics aggregation in cluster mode
 *
 * The Express app itself is set up in `./app.ts`.
 *
 * @module server
 */

import cluster from 'cluster';
import os from 'os';
import { app } from './app';
import { env } from './config/env';
import { allowedOrigins } from './config/cors';
import { logger } from './common/utils/logger';
import { prisma } from './common/utils/prisma';
import { redis } from './common/utils/redis';
import { registerSLARepeatable, slaQueue } from './modules/sla/application/sla.queue';
import { webhookQueue } from './modules/webhooks/application/webhook.queue';
import { registerWarRoomGateway } from './modules/warroom/presentation/warroom.gateway';
import { startMetricsInterval, stopMetricsInterval } from './common/middleware/metrics.middleware';

const PORT = env.PORT || 3000;

if (require.main === module) {
    if (cluster.isPrimary) {
        // ── Primary Process ──
        // Railway servers can have 48+ virtual CPUs → OOM. Cap at WEB_CONCURRENCY or 2.
        const defaultWorkers = Math.min(os.cpus().length, 2);
        const numCPUs = process.env.WEB_CONCURRENCY
            ? parseInt(process.env.WEB_CONCURRENCY, 10)
            : defaultWorkers;

        logger.info(`Primary process ${process.pid} is running`);
        logger.info(`Starting cluster with ${numCPUs} workers (Total CPUs: ${os.cpus().length})`);

        // Prometheus Aggregator Registry — combines metrics from all workers
        const { client } = require('./common/middleware/metrics.middleware');
        const aggregatorRegistry = new client.AggregatorRegistry();

        const metricsApp = require('express')();
        metricsApp.get('/metrics', async (_req: unknown, res: { set: (k: string, v: string) => void; send: (d: string) => void; status: (c: number) => { send: (m: string) => void } }) => {
            try {
                const metrics = await aggregatorRegistry.clusterMetrics();
                res.set('Content-Type', aggregatorRegistry.contentType);
                res.send(metrics);
            } catch (ex: unknown) {
                const msg = ex instanceof Error ? ex.message : 'Unknown error';
                logger.error(`Error generating cluster metrics: ${msg}`);
                res.status(500).send('Internal Server Error');
            }
        });

        const METRICS_PORT = 3002;
        metricsApp.listen(METRICS_PORT, () => {
            logger.info(`Primary metrics aggregator listening on port ${METRICS_PORT}`);
        });

        // Register SLA enforcement repeatable job (once via primary)
        registerSLARepeatable().catch((err: Error) =>
            logger.error('Failed to register SLA repeatable job', { error: err.message })
        );

        // Fork workers
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            logger.warn(`Worker ${worker.process.pid} died (code=${code}, signal=${signal})`);
            logger.info('Starting a new worker...');
            cluster.fork();
        });

        // Graceful shutdown — primary
        const shutdownPrimary = async (signal: string) => {
            logger.info(`Primary received ${signal}. Shutting down all workers...`);
            for (const id in cluster.workers) {
                cluster.workers[id]?.kill(signal);
            }
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
        // ── Worker Process ──
        const { client } = require('./common/middleware/metrics.middleware');
        // prom-client requires AggregatorRegistry instantiation in workers for IPC
        new client.AggregatorRegistry();

        const server = app.listen(PORT, () => {
            logger.info(`Worker ${process.pid} started ProdKB on port ${PORT}`);
            if (cluster.worker?.id === 1) {
                logger.info(` Email notifications: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
                logger.info(' Rate limiting: Enabled');
                logger.info(' API version: v1 (with backward compat)');
                startMetricsInterval();
            }
        });

        // ── Socket.io with Redis adapter for cluster-safe WebSocket ──
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

        // Graceful shutdown — worker
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

            // Force exit after 10 seconds
            setTimeout(() => {
                logger.error(`Worker ${process.pid} forced shutdown after timeout`);
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
        process.on('SIGINT', () => shutdownWorker('SIGINT'));
    }
}
