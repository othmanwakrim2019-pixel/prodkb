import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { notificationService } from './notification.service';

export class NotificationController {
    async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const unreadOnly = req.query.unreadOnly === 'true';
            const notifications = await notificationService.getForUser(userId, unreadOnly);
            res.json(notifications);
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const count = await notificationService.getUnreadCount(userId);
            res.json({ count });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { id } = req.params;
            await notificationService.markAsRead(id, userId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            await notificationService.markAllRead(userId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
}

export const notificationController = new NotificationController();
