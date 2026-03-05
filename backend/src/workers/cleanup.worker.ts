
/**
 * Cleanup Worker — periodic maintenance tasks
 *
 * Runs as a separate BullMQ worker (like the SLA worker) to handle:
 * 1. Expired refresh token cleanup
 * 2. Old webhook delivery log pruning (>30 days)
 * 3. Audit log rotation
 *
 * @module workers/cleanup.worker
 */

import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { parseRedisUrl } from '../common/utils/redis';
import { logger } from '../common/utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = parseRedisUrl(REDIS_URL);

const prisma = new PrismaClient();
const QUEUE_NAME = 'cleanup';

// ── Queue (for registering repeatable jobs) ──
export const cleanupQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
});

// ── Worker ──
const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        logger.info(`[Cleanup] Running job: ${job.name} at ${new Date().toISOString()}`);

        switch (job.name) {
            case 'cleanup-tokens': {
                // Delete expired refresh tokens
                const result = await prisma.refreshToken.deleteMany({
                    where: { expiresAt: { lt: new Date() } },
                });
                logger.info(`[Cleanup] Deleted ${result.count} expired refresh tokens`);

                // Also delete revoked tokens older than 7 days
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const revokedResult = await prisma.refreshToken.deleteMany({
                    where: { revokedAt: { not: null, lt: sevenDaysAgo } },
                });
                logger.info(`[Cleanup] Deleted ${revokedResult.count} old revoked tokens`);
                break;
            }

            case 'cleanup-webhook-logs': {
                // Delete webhook delivery logs older than 30 days
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const result = await prisma.webhookDelivery.deleteMany({
                    where: { createdAt: { lt: thirtyDaysAgo } },
                });
                logger.info(`[Cleanup] Deleted ${result.count} old webhook delivery logs`);
                break;
            }

            default:
                logger.warn(`[Cleanup] Unknown job name: ${job.name}`);
        }
    },
    {
        connection,
        concurrency: 1,
    },
);

worker.on('completed', (job) => {
    logger.info(`[Cleanup] Job ${job?.name} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`[Cleanup] Job ${job?.name} failed:`, err.message);
});

// ── Register repeatable jobs ──
async function registerCleanupJobs() {
    // Token cleanup: every 6 hours
    await cleanupQueue.add('cleanup-tokens', {}, {
        repeat: { every: 6 * 60 * 60 * 1000 },
    });

    // Webhook log cleanup: daily
    await cleanupQueue.add('cleanup-webhook-logs', {}, {
        repeat: { every: 24 * 60 * 60 * 1000 },
    });

    logger.info('[Cleanup] Repeatable cleanup jobs registered');
}

registerCleanupJobs().catch(err => {
    logger.error('[Cleanup] Failed to register jobs:', err.message);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
    logger.info(`[Cleanup] Received ${signal}, shutting down...`);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
