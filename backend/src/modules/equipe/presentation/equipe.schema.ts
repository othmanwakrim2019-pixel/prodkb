
import { z } from 'zod';
import { OperationalTaskType, OperationalTaskStatus, OperationalTaskPriority } from '../../constants';

/**
 * Zod schemas for Equipe module (Daily Plan & Operational Tasks)
 */

export const createDailyPlanSchema = z.object({
    date: z.string().datetime(),
    teamId: z.string().uuid(),
    label: z.string().max(100).optional().nullable(),
    isWeekend: z.boolean().optional(),
});

export const updateDailyPlanSchema = z.object({
    label: z.string().max(100).optional().nullable(),
    isWeekend: z.boolean().optional(),
});

export const createOperationalTaskSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).optional().nullable(),
    taskType: z.nativeEnum(OperationalTaskType).optional(),
    priority: z.nativeEnum(OperationalTaskPriority).optional(),
    assignedToId: z.string().uuid(),
    systemId: z.string().uuid().optional().nullable(),
    chainLabel: z.string().max(100).optional().nullable(),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
});

export const updateOperationalTaskSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    taskType: z.nativeEnum(OperationalTaskType).optional(),
    priority: z.nativeEnum(OperationalTaskPriority).optional(),
    assignedToId: z.string().uuid().optional(),
    systemId: z.string().uuid().optional().nullable(),
    chainLabel: z.string().max(100).optional().nullable(),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
    status: z.nativeEnum(OperationalTaskStatus).optional(),
    note: z.string().max(1000).optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
    status: z.nativeEnum(OperationalTaskStatus),
    note: z.string().max(1000).optional().nullable(),
});
