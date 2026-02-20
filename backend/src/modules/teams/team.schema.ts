import { z } from 'zod';

export const createTeamSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    emailDistribution: z.string().email(),
    sendEmail: z.boolean().optional(),
});

export const updateTeamSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    emailDistribution: z.string().email().optional(),
    isActive: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
});

export const addMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.string().min(1).max(50),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
