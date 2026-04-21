import { z } from 'zod';

export const createAutoAssignRuleSchema = z.object({
    name: z.string().min(2).max(100),
    systemId: z.string().uuid().optional().nullable(),
    severity: z.string().optional().nullable(),
    teamId: z.string().uuid(),
    priority: z.number().int().min(0).default(0),
    isActive: z.boolean().optional(),
});

export const updateAutoAssignRuleSchema = createAutoAssignRuleSchema.partial();

export type CreateAutoAssignRuleInput = z.infer<typeof createAutoAssignRuleSchema>;
export type UpdateAutoAssignRuleInput = z.infer<typeof updateAutoAssignRuleSchema>;
