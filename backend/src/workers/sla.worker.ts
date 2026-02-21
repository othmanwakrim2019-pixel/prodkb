
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
import { parseRedisUrl } from '../common/utils/redis-url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = parseRedisUrl(REDIS_URL);

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

// ── Minimal HTTP Server for Prometheus Scrape checks ──
import * as http from 'http';
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('up{job="prodkb-sla-worker"} 1\n');
});
server.listen(3000, '0.0.0.0', () => {
    logger.info('SLA Worker health endpoint listening on port 3000');
});

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
    logger.info(`SLA worker received ${signal}. Shutting down...`);
    server.close();
    await worker.close();
    await prisma.$disconnect();
    logger.info('SLA worker stopped');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('SLA Enforcement Worker started — listening for jobs');
