import { logger } from '../../common/utils/logger';
import { notificationRepository } from './repositories/notification.repository';

export class NotificationService {
    async createForTeam(
        teamId: string,
        type: string,
        title: string,
        message: string,
        incidentId?: string
    ): Promise<void> {
        try {
            const members = await notificationRepository.findTeamMemberIds(teamId);

            if (members.length === 0) {
                logger.warn('No team members found for notification', { teamId });
                return;
            }

            await notificationRepository.createNotifications(
                members.map((member) => ({
                    userId: member.userId,
                    type,
                    title,
                    message,
                    incidentId: incidentId || null,
                }))
            );

            logger.info('Notifications created', { teamId, type, count: members.length });
        } catch (error) {
            logger.error('Failed to create notifications', { error, teamId, type });
        }
    }

    async createForTeamLeads(
        teamId: string,
        type: string,
        title: string,
        message: string,
        incidentId?: string
    ): Promise<void> {
        try {
            const leads = await notificationRepository.findTeamLeadIds(teamId);
            const recipients = leads.length > 0 ? leads : await notificationRepository.findTeamMemberIds(teamId);

            if (recipients.length === 0) {
                logger.warn('No team leads or members found for notification', { teamId });
                return;
            }

            await notificationRepository.createNotifications(
                recipients.map((member) => ({
                    userId: member.userId,
                    type,
                    title,
                    message,
                    incidentId: incidentId || null,
                }))
            );

            logger.info('Lead notifications created', { teamId, type, count: recipients.length });
        } catch (error) {
            logger.error('Failed to create lead notifications', { error, teamId, type });
        }
    }

    async getForUser(userId: string, unreadOnly = false, limit = 50) {
        return notificationRepository.findUserNotifications(userId, unreadOnly, limit);
    }

    async getUnreadCount(userId: string): Promise<number> {
        return notificationRepository.countUnreadNotifications(userId);
    }

    async markAsRead(id: string, userId: string) {
        return notificationRepository.markNotificationRead(id, userId);
    }

    async markAllRead(userId: string) {
        return notificationRepository.markAllNotificationsRead(userId);
    }
}

export const notificationService = new NotificationService();
