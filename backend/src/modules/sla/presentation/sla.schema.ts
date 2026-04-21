import { z } from 'zod';

export const createSLASchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    acknowledgeTimeMinutes: z.number().int().min(1),
    resolveTimeMinutes: z.number().int().min(1),
});

export const updateSLASchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    acknowledgeTimeMinutes: z.number().int().min(1).optional(),
    resolveTimeMinutes: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
});

export type CreateSLAInput = z.infer<typeof createSLASchema>;
export type UpdateSLAInput = z.infer<typeof updateSLASchema>;
