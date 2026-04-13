import { prisma } from '../../../common/utils/prisma';
import type { z } from 'zod';
import { createWebhookSchema, updateWebhookSchema } from '../webhook.schema';

export class WebhookRepository {
    async findWebhooks() {
        return prisma.webhook.findMany({
            include: { _count: { select: { deliveries: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findWebhookById(id: string) {
        return prisma.webhook.findUnique({ where: { id } });
    }

    async createWebhook(data: z.infer<typeof createWebhookSchema>) {
        return prisma.webhook.create({
            data: { ...data, isActive: data.isActive ?? true },
        });
    }

    async updateWebhook(id: string, data: z.infer<typeof updateWebhookSchema>) {
        return prisma.webhook.update({
            where: { id },
            data,
        });
    }

    async deleteWebhook(id: string) {
        return prisma.webhook.delete({ where: { id } });
    }

    async findWebhookDeliveries(webhookId: string, limit: number) {
        return prisma.webhookDelivery.findMany({
            where: { webhookId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findActiveWebhooks() {
        return prisma.webhook.findMany({
            where: { isActive: true },
        });
    }
}

export const webhookRepository = new WebhookRepository();
