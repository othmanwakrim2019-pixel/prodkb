
/**
 * Webhook Integration Service
 * Outbound webhooks with HMAC-SHA256 signing, retry, and delivery logging.
 * @module modules/webhooks/webhook.service
 */

import crypto from 'crypto';
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError } from '../../common/errors/app.error';
import { z } from 'zod';

export const WEBHOOK_EVENTS = [
    'incident.created',
    'incident.updated',
    'incident.resolved',
    'incident.escalated',
    'incident.sla_breached',
] as const;

export const createWebhookSchema = z.object({
    name: z.string().min(2).max(100),
    url: z.string().url(),
    secret: z.string().min(16).max(256),
    events: z.string().min(1), // comma-separated event types
    isActive: z.boolean().optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export class WebhookService {
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms

    async findAll() {
        return prisma.webhook.findMany({
            include: { _count: { select: { deliveries: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const webhook = await prisma.webhook.findUnique({ where: { id } });
        if (!webhook) throw new NotFoundError('Webhook not found');
        return webhook;
    }

    async create(data: z.infer<typeof createWebhookSchema>) {
        return prisma.webhook.create({ data: { ...data, isActive: data.isActive ?? true } });
    }

    async update(id: string, data: z.infer<typeof updateWebhookSchema>) {
        await this.findById(id);
        return prisma.webhook.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.webhook.delete({ where: { id } });
    }

    async getDeliveries(webhookId: string, limit = 50) {
        await this.findById(webhookId);
        return prisma.webhookDelivery.findMany({
            where: { webhookId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Dispatch event to all matching active webhooks
     */
    async dispatch(event: string, payload: Record<string, unknown>): Promise<void> {
        const webhooks = await prisma.webhook.findMany({
            where: { isActive: true },
        });

        const matching = webhooks.filter(w => {
            const events = w.events.split(',').map(e => e.trim());
            return events.includes(event) || events.includes('*');
        });

        if (matching.length === 0) return;

        logger.info(`Dispatching webhook event "${event}" to ${matching.length} webhook(s)`);

        // Fire-and-forget — don't block the request
        for (const webhook of matching) {
            this.deliver(webhook, event, payload).catch(err => {
                logger.error('Webhook delivery failed', { webhookId: webhook.id, error: err.message });
            });
        }
    }

    /**
     * Deliver payload to a single webhook with retry
     */
    private async deliver(
        webhook: { id: string; url: string; secret: string },
        event: string,
        payload: Record<string, unknown>
    ): Promise<void> {
        const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
        const signature = this.sign(body, webhook.secret);

        let lastError: string | null = null;
        let statusCode: number | null = null;
        let responseBody: string | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Event': event,
                    },
                    body,
                    signal: controller.signal,
                });

                clearTimeout(timeout);
                statusCode = response.status;
                responseBody = await response.text().catch(() => '');

                if (response.ok) {
                    await this.logDelivery(webhook.id, event, body, statusCode, responseBody, attempt + 1, true);
                    return;
                }

                lastError = `HTTP ${statusCode}: ${responseBody?.substring(0, 200)}`;
            } catch (err: any) {
                lastError = err.message;
            }

            // Wait before retry
            if (attempt < this.MAX_RETRIES - 1) {
                await new Promise(res => setTimeout(res, this.RETRY_DELAYS[attempt]));
            }
        }

        // All retries exhausted
        await this.logDelivery(webhook.id, event, body, statusCode, responseBody, this.MAX_RETRIES, false, lastError);
    }

    private sign(payload: string, secret: string): string {
        return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
    }

    private async logDelivery(
        webhookId: string, event: string, payload: string,
        statusCode: number | null, response: string | null,
        attemptCount: number, success: boolean, error?: string | null
    ): Promise<void> {
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
    }
}

export const webhookService = new WebhookService();
