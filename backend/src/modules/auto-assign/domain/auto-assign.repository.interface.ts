import type { z } from 'zod';
import { createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from '../presentation/auto-assign.schema';

export interface IAutoAssignRepository {
    findRules(): Promise<any[]>;
    createRule(data: z.infer<typeof createAutoAssignRuleSchema>): Promise<any>;
    findRuleById(id: string): Promise<any | null>;
    updateRule(id: string, data: z.infer<typeof updateAutoAssignRuleSchema>): Promise<any>;
    deleteRule(id: string): Promise<any>;
    findMatchingRule(systemId: string, severity: string): Promise<any | null>;
}
