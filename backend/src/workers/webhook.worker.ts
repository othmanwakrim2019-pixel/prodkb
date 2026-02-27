/**
 * Webhook Delivery Worker — SEPARATE PROCESS
 * Run this in its own process: `npx tsx src/workers/webhook.worker.ts`
 *
 * Processes webhook delivery jobs from BullMQ.
 * Handles HTTPS fetches, cryptographic signing, retry logic, and logging to the database.
 *
 * @module workers/webhook.worker
 */

import 'dotenv/config';
import crypto from 'crypto';
import { Worker, Job } from 'bullmq';
import { WEBHOOK_QUEUE_NAME } from '../modules/webhooks/webhook.queue';
import { logger } from '../common/utils/logger';
import { prisma } from '../common/utils/prisma';
import { parseRedisUrl } from '../common/utils/redis-url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export interface WebhookDeliveryJobData {
    webhook: { id: string; url: string; secret: string };
    event: string;
    payload: Record<string, unknown>;
}

const worker = new Worker<WebhookDeliveryJobData>(
    WEBHOOK_QUEUE_NAME,
    async (job: Job<WebhookDeliveryJobData>) => {
        const { webhook, event, payload } = job.data;

        logger.info('Processing webhook delivery', {
            jobId: job.id,
            webhookId: webhook.id,
            event,
            attemptsMade: job.attemptsMade,
        });

        const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
        const signature = sign(body, webhook.secret);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

        let response: Response;
        try {
            response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event,
                },
                body,
                signal: controller.signal,
            });
        } catch (err: unknown) {
            clearTimeout(timeout);
            // On failure, BullMQ handles the retries automatically based on attempts configured
            // If it's the last attempt (job.attemptsMade >= job.opts.attempts! - 1), we can log the ultimate failure
            const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 3);
            const errMsg = err instanceof Error ? err.message : String(err);
            if (isLastAttempt) {
                await logDelivery(webhook.id, event, body, null, null, job.attemptsMade, false, errMsg);
            }
            throw err; // throw to trigger BullMQ retry
        }

        clearTimeout(timeout);
        const statusCode = response.status;
        const responseBody = await response.text().catch(() => '');

        if (response.ok) {
            await logDelivery(webhook.id, event, body, statusCode, responseBody, job.attemptsMade, true);
        } else {
            const errorReason = `HTTP ${statusCode}: ${responseBody?.substring(0, 200)}`;
            const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 3);
            if (isLastAttempt) {
                await logDelivery(webhook.id, event, body, statusCode, responseBody, job.attemptsMade, false, errorReason);
            }
            throw new Error(`Webhook fetch failed: ${errorReason}`);
        }
    },
    {
        connection: parseRedisUrl(REDIS_URL),
        concurrency: 5, // Process up to 5 deliveries concurrently
    },
);

function sign(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
}

async function logDelivery(
    webhookId: string, event: string, payload: string,
    statusCode: number | null, response: string | null,
    attemptCount: number, success: boolean, error?: string | null
): Promise<void> {
    try {
        await prisma.webhookDelivery.create({
            data: {
                webhookId,
                event,
                payload,
                statusCode,
                response,
                attemptCount,
                success,
                error,
                deliveredAt: success ? new Date() : null,
            },
        });
    } catch (err) {
        logger.error('Failed to log webhook delivery to database', { webhookId, error: (err as Error).message });
    }
}

worker.on('failed', (job, err) => {
    logger.warn('Webhook job failed', {
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        error: err.message,
    });
});

worker.on('error', (err) => {
    logger.error('Webhook worker error', { error: err.message });
});

// ── Minimal HTTP Server for Prometheus Scrape checks ──
import * as http from 'http';
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('up{job="prodkb-webhook-worker"} 1\n');
});
server.listen(3000, '0.0.0.0', () => {
    logger.info('Webhook Worker health endpoint listening on port 3000');
});

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
    logger.info(`Webhook worker received ${signal}. Shutting down...`);
    server.close();
    await worker.close();
    await prisma.$disconnect();
    logger.info('Webhook worker stopped');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Webhook Delivery Worker started — listening for jobs');
