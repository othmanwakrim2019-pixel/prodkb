/**
 * Webhook Delivery Queue — BullMQ queue definition
 * Used by the server (to enqueue deliveries) and the worker (to process them).
 * @module modules/webhooks/webhook.queue
 */

import { Queue } from 'bullmq';
import { parseRedisUrl } from '../../common/utils/redis-url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const WEBHOOK_QUEUE_NAME = 'webhook-delivery';

export const webhookQueue = new Queue(WEBHOOK_QUEUE_NAME, {
    connection: parseRedisUrl(REDIS_URL),
    defaultJobOptions: {
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000, // 1s initial, then 2s, then 4s, etc
        },
    },
});
