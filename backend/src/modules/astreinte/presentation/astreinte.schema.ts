
import { z } from 'zod';

/**
 * Zod schemas for Astreinte module
 */

export const createAstreinteSchema = z.object({
    weekNumber: z.number().min(1).max(53),
    year: z.number().min(2020).max(2100),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    teamId: z.string().uuid(),
    userId: z.string().uuid(),
    phone: z.string().max(20).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
});

export const updateAstreinteSchema = z.object({
    userId: z.string().uuid().optional(),
    phone: z.string().max(20).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
});
