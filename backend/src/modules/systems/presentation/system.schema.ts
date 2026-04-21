import { z } from 'zod';

export const createSystemSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
});

export const updateSystemSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
});

export const createJobSchema = z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(1).max(50),
    systemId: z.string().uuid(),
    teamId: z.string().uuid().optional(),
});

export const updateJobSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(1).max(50).optional(),
    systemId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional().nullable(),
});

export type CreateSystemInput = z.infer<typeof createSystemSchema>;
export type UpdateSystemInput = z.infer<typeof updateSystemSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
