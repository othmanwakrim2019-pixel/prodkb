
import { Router, Request, Response, NextFunction } from 'express';
import { webhookService } from './webhook.service';
import { createWebhookSchema, updateWebhookSchema } from './webhook.schema';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';

const router = Router();

router.get('/', authenticate, requirePermission('WEBHOOK_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const webhooks = await webhookService.findAll();
        res.json(createResponse(true, webhooks));
    } catch (error) { next(error); }
});

router.post('/', authenticate, requirePermission('WEBHOOK_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createWebhookSchema.parse(req.body);
        const webhook = await webhookService.create(data);
        res.status(201).json(createResponse(true, webhook, 'Webhook created'));
    } catch (error) { next(error); }
});

router.put('/:id', authenticate, requirePermission('WEBHOOK_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateWebhookSchema.parse(req.body);
        const webhook = await webhookService.update(req.params.id, data);
        res.json(createResponse(true, webhook, 'Webhook updated'));
    } catch (error) { next(error); }
});

router.delete('/:id', authenticate, requirePermission('WEBHOOK_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await webhookService.delete(req.params.id);
        res.json(createResponse(true, null, 'Webhook deleted'));
    } catch (error) { next(error); }
});

router.get('/:id/deliveries', authenticate, requirePermission('WEBHOOK_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const deliveries = await webhookService.getDeliveries(req.params.id, limit);
        res.json(createResponse(true, deliveries));
    } catch (error) { next(error); }
});

export const webhookRoutes = router;
