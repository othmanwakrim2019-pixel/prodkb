import { prisma } from '../../../common/utils/prisma';
import type { z } from 'zod';
import { createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from '../auto-assign.schema';

const ruleInclude = {
    system: { select: { id: true, name: true } },
    team: { select: { id: true, name: true } },
} as const;

export class AutoAssignRepository {
    async findRules() {
        return prisma.autoAssignmentRule.findMany({
            include: ruleInclude,
            orderBy: { priority: 'desc' },
        });
    }

    async createRule(data: z.infer<typeof createAutoAssignRuleSchema>) {
        return prisma.autoAssignmentRule.create({
            data: {
                name: data.name,
                systemId: data.systemId || null,
                severity: data.severity || null,
                teamId: data.teamId,
                priority: data.priority ?? 0,
                isActive: data.isActive ?? true,
            },
            include: ruleInclude,
        });
    }

    async findRuleById(id: string) {
        return prisma.autoAssignmentRule.findUnique({ where: { id } });
    }

    async updateRule(id: string, data: z.infer<typeof updateAutoAssignRuleSchema>) {
        return prisma.autoAssignmentRule.update({
            where: { id },
            data,
            include: ruleInclude,
        });
    }

    async deleteRule(id: string) {
        return prisma.autoAssignmentRule.delete({ where: { id } });
    }

    async findMatchingRule(systemId: string, severity: string) {
        return prisma.autoAssignmentRule.findFirst({
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
                { systemId: 'desc' },
                { severity: 'desc' },
            ],
        });
    }
}

export const autoAssignRepository = new AutoAssignRepository();
