/**
 * Auto-Assignment Rules Engine
 * Routes incidents to teams based on system + severity rules.
 * @module modules/auto-assign/auto-assign.service
 */

import { logger } from '../../../common/utils/logger';
import { NotFoundError } from '../../../common/errors/app.error';
import { z } from 'zod';
import { createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from '../presentation/auto-assign.schema';
import { autoAssignRepository } from '../infrastructure/prisma-auto-assign.repository';

export class AutoAssignService {
    async findAll() {
        return autoAssignRepository.findRules();
    }

    async create(data: z.infer<typeof createAutoAssignRuleSchema>) {
        return autoAssignRepository.createRule(data);
    }

    async update(id: string, data: z.infer<typeof updateAutoAssignRuleSchema>) {
        const existing = await autoAssignRepository.findRuleById(id);
        if (!existing) throw new NotFoundError('Auto-assignment rule not found');
        return autoAssignRepository.updateRule(id, data);
    }

    async delete(id: string) {
        const existing = await autoAssignRepository.findRuleById(id);
        if (!existing) throw new NotFoundError('Auto-assignment rule not found');
        return autoAssignRepository.deleteRule(id);
    }

    async matchRule(systemId: string, severity: string): Promise<string | null> {
        const rule = await autoAssignRepository.findMatchingRule(systemId, severity);

        if (rule) {
            logger.info('Auto-assignment matched', { ruleId: rule.id, ruleName: rule.name, teamId: rule.teamId });
            return rule.teamId;
        }

        return null;
    }
}

export const autoAssignService = new AutoAssignService();
