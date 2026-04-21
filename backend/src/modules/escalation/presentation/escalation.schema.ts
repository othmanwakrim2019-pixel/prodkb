import { z } from 'zod';

export const createEscalationRuleSchema = z.object({
    name: z.string().min(2).max(100),
    systemId: z.string().uuid().optional().nullable(),
    severity: z.string().optional().nullable(),
    level: z.number().int().min(1).max(10),
    teamId: z.string().uuid(),
    delayMinutes: z.number().int().min(1),
    isActive: z.boolean().optional(),
});

export const updateEscalationRuleSchema = createEscalationRuleSchema.partial();

export type CreateEscalationRuleInput = z.infer<typeof createEscalationRuleSchema>;
export type UpdateEscalationRuleInput = z.infer<typeof updateEscalationRuleSchema>;
