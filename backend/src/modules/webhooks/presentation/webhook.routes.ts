import { Router } from 'express';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';
import { WebhookController } from '../presentation/webhook.controller';

const router = Router();

router.get('/', authenticate, requirePermission('WEBHOOK_MANAGE'), WebhookController.getAll);
router.post('/', authenticate, requirePermission('WEBHOOK_MANAGE'), WebhookController.create);
router.put('/:id', authenticate, requirePermission('WEBHOOK_MANAGE'), WebhookController.update);
router.delete('/:id', authenticate, requirePermission('WEBHOOK_MANAGE'), WebhookController.delete);
router.get('/:id/deliveries', authenticate, requirePermission('WEBHOOK_MANAGE'), WebhookController.getDeliveries);

export const webhookRoutes = router;
