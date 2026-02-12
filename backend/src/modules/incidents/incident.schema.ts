
import { z } from 'zod';

export const createIncidentSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    environment: z.enum(['PROD', 'PREPROD', 'RECETTE']),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    impact: z.string().optional(),
    detectionSource: z.string().optional(),
    systemId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    slaId: z.string().uuid().optional(),
    assignedTeamId: z.string().uuid().optional(),
    logs: z.array(z.object({
        logType: z.string().optional(),
        rawLog: z.string().optional(),
        errorMessage: z.string().optional(),
    })).optional(),
});

export const updateIncidentSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).optional(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    environment: z.enum(['PROD', 'PREPROD', 'RECETTE']).optional(),
    impact: z.string().optional(),
    assignedTeamId: z.string().uuid().optional().nullable(),
    linkedProcedureId: z.string().uuid().optional().nullable(),
    slaId: z.string().uuid().optional().nullable(),
});
