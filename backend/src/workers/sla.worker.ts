
/**
 * SLA Enforcement Worker — SEPARATE PROCESS
 * Run this in its own process: `npx tsx src/workers/sla.worker.ts`
 *
 * Processes the repeatable "sla-check" job from BullMQ every 60 seconds.
 * If the job throws, BullMQ retries with exponential backoff (3 attempts).
 *
 * @module workers/sla.worker
 */

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { SLA_QUEUE_NAME } from '../modules/sla/sla.queue';
import { slaEnforcementService } from '../modules/sla/sla-enforcement.service';
import { logger } from '../common/utils/logger';
import { prisma } from '../common/utils/prisma';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined,
    };
}

const worker = new Worker(
    SLA_QUEUE_NAME,
    async (job: Job) => {
        logger.info('SLA enforcement job started', {
            jobId: job.id,
            attemptsMade: job.attemptsMade,
        });

        await slaEnforcementService.check();

        logger.info('SLA enforcement job completed', { jobId: job.id });
    },
    {
        connection: parseRedisUrl(REDIS_URL),
        concurrency: 1, // Only one SLA check at a time
        limiter: {
            max: 1,
            duration: 30_000, // At most 1 job per 30 seconds (safety net)
        },
    },
);

worker.on('completed', (job) => {
    logger.debug('SLA job completed', { jobId: job?.id });
});

worker.on('failed', (job, err) => {
    logger.error('SLA job failed', {
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        error: err.message,
    });
});

worker.on('error', (err) => {
    logger.error('SLA worker error', { error: err.message });
});

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
    logger.info(`SLA worker received ${signal}. Shutting down...`);
    await worker.close();
    await prisma.$disconnect();
    logger.info('SLA worker stopped');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('SLA Enforcement Worker started — listening for jobs');
