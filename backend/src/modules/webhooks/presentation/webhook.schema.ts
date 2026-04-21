import { z } from 'zod';

export const WEBHOOK_EVENTS = [
    'incident.created',
    'incident.updated',
    'incident.resolved',
    'incident.escalated',
    'incident.sla_breached',
] as const;

export const createWebhookSchema = z.object({
    name: z.string().min(2).max(100),
    url: z.string().url(),
    secret: z.string().min(16).max(256),
    events: z.string().min(1), // comma-separated event types
    isActive: z.boolean().optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
