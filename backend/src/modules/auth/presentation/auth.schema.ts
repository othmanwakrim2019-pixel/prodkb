import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    role: z.string().optional(),
    teamId: z.string().uuid().optional(),
    teamRole: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
