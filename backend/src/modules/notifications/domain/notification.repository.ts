export interface INotificationRepository {
    findTeamMemberIds(teamId: string): Promise<any[]>;
    createNotifications(data: Array<{
        userId: string;
        type: string;
        title: string;
        message: string;
        incidentId: string | null;
    }>): Promise<any>;
    findUserNotifications(userId: string, unreadOnly: boolean, limit: number): Promise<any[]>;
    countUnreadNotifications(userId: string): Promise<number>;
    markNotificationRead(id: string, userId: string): Promise<any>;
    markAllNotificationsRead(userId: string): Promise<any>;
}
