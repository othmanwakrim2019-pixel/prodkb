import api from '../../../utils/axios';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    incidentId: string | null;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getUnreadCount: (): Promise<number> =>
        api.get('/api/v1/notifications/unread-count').then((response) => response.data.count),

    getAll: (): Promise<NotificationItem[]> =>
        api.get('/api/v1/notifications').then((response) => response.data),

    markAsRead: (id: string): Promise<void> =>
        api.patch(`/api/v1/notifications/${id}/read`).then(() => undefined),

    markAllRead: (): Promise<void> =>
        api.patch('/api/v1/notifications/read-all').then(() => undefined),
};
