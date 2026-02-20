import { z } from 'zod';

export const updateEmailTemplateSchema = z.object({
    subject: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    cc: z.string().optional().nullable(),
});

export const previewEmailTemplateSchema = z.object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1),
});

export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type PreviewEmailTemplateInput = z.infer<typeof previewEmailTemplateSchema>;
