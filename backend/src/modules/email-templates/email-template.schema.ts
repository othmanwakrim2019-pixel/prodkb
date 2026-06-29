import { z } from 'zod';

const emailListSchema = z.string()
    .optional()
    .nullable()
    .refine((value) => {
        if (!value) return true;
        return value.split(',').every(email => z.string().email().safeParse(email.trim()).success);
    }, 'CC must be a comma-separated list of valid email addresses');

export const createEmailTemplateSchema = z.object({
    name: z.string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9_:-]+$/i, 'Name can only contain letters, numbers, underscores, colons, and hyphens'),
    subject: z.string().min(1).max(200),
    body: z.string().min(1),
    variables: z.string().optional().nullable(),
    enabled: z.boolean().optional(),
    cc: emailListSchema,
});

export const updateEmailTemplateSchema = z.object({
    name: z.string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9_:-]+$/i, 'Name can only contain letters, numbers, underscores, colons, and hyphens')
        .optional(),
    subject: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    variables: z.string().optional().nullable(),
    enabled: z.boolean().optional(),
    cc: emailListSchema,
});

export const previewEmailTemplateSchema = z.object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1),
});

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type PreviewEmailTemplateInput = z.infer<typeof previewEmailTemplateSchema>;
