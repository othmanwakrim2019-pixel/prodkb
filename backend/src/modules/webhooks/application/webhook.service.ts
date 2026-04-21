/**
 * Webhook Integration Service
 * Outbound webhooks with HMAC-SHA256 signing, retry, and delivery logging.
 * @module modules/webhooks/webhook.service
 */

import { logger } from '../../../common/utils/logger';
import { NotFoundError } from '../../../common/errors/app.error';
import { z } from 'zod';
import { createWebhookSchema, updateWebhookSchema } from '../presentation/webhook.schema';
import { webhookQueue } from '../application/webhook.queue';
import { webhookRepository } from '../infrastructure/prisma-webhook.repository';

export class WebhookService {
    async findAll() {
        return webhookRepository.findWebhooks();
    }

    async findById(id: string) {
        const webhook = await webhookRepository.findWebhookById(id);
        if (!webhook) throw new NotFoundError('Webhook not found');
        return webhook;
    }

    async create(data: z.infer<typeof createWebhookSchema>) {
        return webhookRepository.createWebhook(data);
    }

    async update(id: string, data: z.infer<typeof updateWebhookSchema>) {
        await this.findById(id);
        return webhookRepository.updateWebhook(id, data);
    }

    async delete(id: string) {
        await this.findById(id);
        return webhookRepository.deleteWebhook(id);
    }

    async getDeliveries(webhookId: string, limit = 50) {
        await this.findById(webhookId);
        return webhookRepository.findWebhookDeliveries(webhookId, limit);
    }

    async dispatch(event: string, payload: Record<string, unknown>): Promise<void> {
        const webhooks = await webhookRepository.findActiveWebhooks();
        const matching = webhooks.filter((webhook) => {
            const events = webhook.events.split(',').map((entry) => entry.trim());
            return events.includes(event) || events.includes('*');
        });

        if (matching.length === 0) return;

        logger.info(`Enqueueing webhook event "${event}" for ${matching.length} webhook(s)`);

        for (const webhook of matching) {
            webhookQueue.add('deliver', { webhook, event, payload }).catch((err) => {
                logger.error('Failed to enqueue webhook delivery', { webhookId: webhook.id, error: err.message });
            });
        }
    }
}

export const webhookService = new WebhookService();
