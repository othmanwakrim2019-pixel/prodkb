import { z } from 'zod';

export const periodEnum = z.enum(['monthly', 'quarterly', 'annual']);
export const statusEnum = z.enum(['pending', 'running', 'done', 'failed', 'blocked']);
export const taskTypeEnum = z.enum(['BATCH', 'MANUAL_ACTION']);
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
    systemId: z.string().uuid().optional(),       // Required for BATCH, optional for MANUAL_ACTION
    jobId: z.string().uuid().optional(),           // Required for BATCH, optional for MANUAL_ACTION
    customTaskName: z.string().min(2).max(500).optional(), // Free-text for MANUAL_ACTION
    scheduledTime: z.string().datetime(),
    dependencies: z.array(z.string().uuid()).default([]),
    status: statusEnum.optional(),
    taskType: taskTypeEnum.optional(),
    supportContact: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
}).refine(
    (data) => {
        if (data.taskType === 'MANUAL_ACTION') {
            // MANUAL needs customTaskName
            return !!data.customTaskName;
        }
        // BATCH needs systemId + jobId
        return !!data.systemId && !!data.jobId;
    },
    { message: 'BATCH tasks require system & job. MANUAL_ACTION tasks require a task name.' }
);

export const updatePlanningJobSchema = z.object({
    systemId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    customTaskName: z.string().min(2).max(500).optional().nullable(),
    scheduledTime: z.string().datetime().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    taskType: taskTypeEnum.optional(),
    supportContact: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

export const updateStatusSchema = z.object({
    status: statusEnum,
    notes: z.string().max(2000).optional(), // required for MANUAL_ACTION → done
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
