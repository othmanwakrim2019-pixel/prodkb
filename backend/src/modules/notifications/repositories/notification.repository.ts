import { prisma } from '../../../common/utils/prisma';

export class NotificationRepository {
    async findTeamMemberIds(teamId: string) {
        return prisma.teamMember.findMany({
            where: { teamId },
            select: { userId: true },
        });
    }

    async createNotifications(data: Array<{
        userId: string;
        type: string;
        title: string;
        message: string;
        incidentId: string | null;
    }>) {
        return prisma.notification.createMany({ data });
    }

    async findUserNotifications(userId: string, unreadOnly: boolean, limit: number) {
        const where: Record<string, unknown> = { userId };
        if (unreadOnly) where.isRead = false;

        return prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async countUnreadNotifications(userId: string) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    async markNotificationRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    async markAllNotificationsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
}

export const notificationRepository = new NotificationRepository();
