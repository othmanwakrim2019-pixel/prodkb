import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => notificationController.getNotifications(req as any, res, next));
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req as any, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req as any, res, next));
router.patch('/read-all', (req, res, next) => notificationController.markAllRead(req as any, res, next));

export const notificationRoutes = router;
