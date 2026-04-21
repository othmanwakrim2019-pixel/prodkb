
/**
 * SLA Enforcement Queue — BullMQ queue definition
 * Used by both the server (to add repeatable jobs) and the worker (to process them).
 * @module modules/sla/sla.queue
 */

import { Queue } from 'bullmq';
import { logger } from '../../../common/utils/logger';
import { parseRedisUrl } from '../../../common/utils/redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const SLA_QUEUE_NAME = 'sla-enforcement';

export const slaQueue = new Queue(SLA_QUEUE_NAME, {
    connection: parseRedisUrl(REDIS_URL),
    defaultJobOptions: {
        removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
        removeOnFail: { count: 500 },       // Keep last 500 failed jobs for debugging
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000, // 5s initial, then 10s, then 20s
        },
    },
});

/**
 * Register the repeatable SLA check job.
 * Idempotent — BullMQ deduplicates repeatable jobs by their key.
 */
export async function registerSLARepeatable(): Promise<void> {
    await slaQueue.add(
        'sla-check',               // job name
        {},                         // no payload needed
        {
            repeat: {
                every: 60_000,     // every 60 seconds
            },
        },
    );
    logger.info('SLA Enforcement repeatable job registered (every 60s via BullMQ)');
}

/**
 * Remove all repeatable jobs (for clean shutdown or re-registration)
 */
export async function removeSLARepeatables(): Promise<void> {
    const repeatables = await slaQueue.getRepeatableJobs();
    for (const job of repeatables) {
        await slaQueue.removeRepeatableByKey(job.key);
    }
    logger.info(`Removed ${repeatables.length} repeatable SLA job(s)`);
}
