
/**
 * Webhook Integration Service
 * Outbound webhooks with HMAC-SHA256 signing, retry, and delivery logging.
 * @module modules/webhooks/webhook.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError } from '../../common/errors/app.error';
import { z } from 'zod';
import { WEBHOOK_EVENTS, createWebhookSchema, updateWebhookSchema } from './webhook.schema';
import { webhookQueue } from './webhook.queue';


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
     * Dispatch event to all matching active webhooks via BullMQ
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

        logger.info(`Enqueueing webhook event "${event}" for ${matching.length} webhook(s)`);

        for (const webhook of matching) {
            webhookQueue.add('deliver', { webhook, event, payload }).catch(err => {
                logger.error('Failed to enqueue webhook delivery', { webhookId: webhook.id, error: err.message });
            });
        }
    }
}

export const webhookService = new WebhookService();
