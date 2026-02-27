import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';

export class NotificationService {
    /**
     * Create notifications for all members of a team
     */
    async createForTeam(
        teamId: string,
        type: string,
        title: string,
        message: string,
        incidentId?: string
    ): Promise<void> {
        try {
            const members = await prisma.teamMember.findMany({
                where: { teamId },
                select: { userId: true },
            });

            if (members.length === 0) {
                logger.warn('No team members found for notification', { teamId });
                return;
            }

            await prisma.notification.createMany({
                data: members.map(m => ({
                    userId: m.userId,
                    type,
                    title,
                    message,
                    incidentId: incidentId || null,
                })),
            });

            logger.info('Notifications created', { teamId, type, count: members.length });
        } catch (error) {
            logger.error('Failed to create notifications', { error, teamId, type });
        }
    }

    /**
     * Get notifications for the current user
     */
    async getForUser(userId: string, unreadOnly = false, limit = 50) {
        const where: Record<string, unknown> = { userId };
        if (unreadOnly) where.isRead = false;

        return prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
}

export const notificationService = new NotificationService();
