import { z } from 'zod';

export const periodEnum = z.enum(['monthly', 'quarterly', 'annual']);
export const statusEnum = z.enum(['pending', 'running', 'done']);
export const instanceStatusEnum = z.enum(['active', 'archived']);

export const createInstanceSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(500).optional(),
    period: periodEnum,
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export const createPlanningJobSchema = z.object({
    instanceId: z.string().uuid(),
    systemId: z.string().uuid(),
    jobId: z.string().uuid(),
    scheduledTime: z.string().datetime(),
    dependencies: z.array(z.string().uuid()).default([]),
    status: statusEnum.optional(),
});

export const updatePlanningJobSchema = z.object({
    systemId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    scheduledTime: z.string().datetime().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
});

export const updateStatusSchema = z.object({
    status: statusEnum,
});

export const updatePositionSchema = z.object({
    positionX: z.number(),
    positionY: z.number(),
});

export const batchPositionsSchema = z.object({
    positions: z.array(z.object({
        id: z.string().uuid(),
        positionX: z.number(),
        positionY: z.number(),
    })),
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;
export type CreatePlanningJobInput = z.infer<typeof createPlanningJobSchema>;
export type UpdatePlanningJobInput = z.infer<typeof updatePlanningJobSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
export type BatchPositionsInput = z.infer<typeof batchPositionsSchema>;
