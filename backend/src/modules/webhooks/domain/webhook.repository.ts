export interface IWebhookRepository {
    findWebhooks(): Promise<any[]>;
    findWebhookById(id: string): Promise<any | null>;
    createWebhook(data: any): Promise<any>;
    updateWebhook(id: string, data: any): Promise<any>;
    deleteWebhook(id: string): Promise<any>;
    findWebhookDeliveries(webhookId: string, limit: number): Promise<any[]>;
    findActiveWebhooks(): Promise<any[]>;
}
