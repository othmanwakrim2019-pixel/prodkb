import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).min(1),
});

export const updateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.string().uuid()).min(1),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
