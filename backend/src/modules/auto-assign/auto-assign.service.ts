
/**
 * Auto-Assignment Rules Engine
 * Routes incidents to teams based on system + severity rules.
 * @module modules/auto-assign/auto-assign.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError } from '../../common/errors/app.error';
import { z } from 'zod';
import { createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from './auto-assign.schema';


export class AutoAssignService {
    async findAll() {
        return prisma.autoAssignmentRule.findMany({
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
            orderBy: { priority: 'desc' },
        });
    }

    async create(data: z.infer<typeof createAutoAssignRuleSchema>) {
        return prisma.autoAssignmentRule.create({
            data: {
                name: data.name,
                systemId: data.systemId || null,
                severity: data.severity || null,
                teamId: data.teamId,
                priority: data.priority ?? 0,
                isActive: data.isActive ?? true,
            },
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: string, data: z.infer<typeof updateAutoAssignRuleSchema>) {
        const existing = await prisma.autoAssignmentRule.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Auto-assignment rule not found');
        return prisma.autoAssignmentRule.update({
            where: { id },
            data,
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    async delete(id: string) {
        const existing = await prisma.autoAssignmentRule.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Auto-assignment rule not found');
        return prisma.autoAssignmentRule.delete({ where: { id } });
    }

    /**
     * Match the best rule for a new incident and return the team ID
     * Highest priority rule wins. Most specific match preferred.
     */
    async matchRule(systemId: string, severity: string): Promise<string | null> {
        const rule = await prisma.autoAssignmentRule.findFirst({
            where: {
                isActive: true,
                OR: [
                    { systemId, severity },
                    { systemId, severity: null },
                    { systemId: null, severity },
                    { systemId: null, severity: null },
                ],
            },
            orderBy: [
                { priority: 'desc' },
                { systemId: 'desc' }, // prefer specific over wildcard
                { severity: 'desc' },
            ],
        });

        if (rule) {
            logger.info('Auto-assignment matched', { ruleId: rule.id, ruleName: rule.name, teamId: rule.teamId });
            return rule.teamId;
        }

        return null;
    }
}

export const autoAssignService = new AutoAssignService();
