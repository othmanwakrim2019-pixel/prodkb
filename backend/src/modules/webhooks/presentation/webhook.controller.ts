import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../common/types/api.response';
import { webhookService } from '../application/webhook.service';
import { createWebhookSchema, updateWebhookSchema } from '../presentation/webhook.schema';

const parseLimit = (value: unknown) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
};

export class WebhookController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const webhooks = await webhookService.findAll();
            res.json(createResponse(true, webhooks));
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createWebhookSchema.parse(req.body);
            const webhook = await webhookService.create(data);
            res.status(201).json(createResponse(true, webhook, 'Webhook created'));
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateWebhookSchema.parse(req.body);
            const webhook = await webhookService.update(req.params.id, data);
            res.json(createResponse(true, webhook, 'Webhook updated'));
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await webhookService.delete(req.params.id);
            res.json(createResponse(true, null, 'Webhook deleted'));
        } catch (error) {
            next(error);
        }
    }

    static async getDeliveries(req: Request, res: Response, next: NextFunction) {
        try {
            const deliveries = await webhookService.getDeliveries(req.params.id, parseLimit(req.query.limit));
            res.json(createResponse(true, deliveries));
        } catch (error) {
            next(error);
        }
    }
}
