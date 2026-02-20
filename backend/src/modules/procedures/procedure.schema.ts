import { z } from 'zod';

export const createProcedureSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(5),
    resolutionSteps: z.string().min(5),
    systemId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    rootCause: z.string().optional(),
    workaround: z.string().optional(),
    commands: z.string().optional(),
    errorCode: z.string().optional(),
    tags: z.string().optional(),
});

export const updateProcedureSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(5).optional(),
    resolutionSteps: z.string().min(5).optional(),
    systemId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional().nullable(),
    rootCause: z.string().optional().nullable(),
    workaround: z.string().optional().nullable(),
    commands: z.string().optional().nullable(),
    errorCode: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;
