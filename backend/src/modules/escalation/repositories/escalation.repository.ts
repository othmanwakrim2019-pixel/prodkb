import { prisma } from '../../../common/utils/prisma';
import { IncidentStatus } from '../../../constants';
import type { z } from 'zod';
import { createEscalationRuleSchema, updateEscalationRuleSchema } from '../escalation.schema';

const escalationRuleInclude = {
    system: { select: { id: true, name: true } },
    team: { select: { id: true, name: true } },
} as const;

export class EscalationRepository {
    async findRules() {
        return prisma.escalationRule.findMany({
            include: escalationRuleInclude,
            orderBy: [{ systemId: 'asc' }, { severity: 'asc' }, { level: 'asc' }],
        });
    }

    async createRule(data: z.infer<typeof createEscalationRuleSchema>) {
        return prisma.escalationRule.create({
            data: {
                name: data.name,
                systemId: data.systemId || null,
                severity: data.severity || null,
                level: data.level,
                teamId: data.teamId,
                delayMinutes: data.delayMinutes,
                isActive: data.isActive ?? true,
            },
            include: escalationRuleInclude,
        });
    }

    async findRuleById(id: string) {
        return prisma.escalationRule.findUnique({ where: { id } });
    }

    async updateRule(id: string, data: z.infer<typeof updateEscalationRuleSchema>) {
        return prisma.escalationRule.update({
            where: { id },
            data,
            include: escalationRuleInclude,
        });
    }

    async deleteRule(id: string) {
        return prisma.escalationRule.delete({ where: { id } });
    }

    async findIncidentForEscalation(incidentId: string) {
        return prisma.incident.findUnique({
            where: { id: incidentId },
            include: { system: true, sla: true },
        });
    }

    async findNextEscalationRule(systemId: string, severity: string, level: number) {
        return prisma.escalationRule.findFirst({
            where: {
                isActive: true,
                level,
                OR: [
                    { systemId, severity },
                    { systemId, severity: null },
                    { systemId: null, severity },
                    { systemId: null, severity: null },
                ],
            },
            orderBy: [
                { systemId: 'desc' },
                { severity: 'desc' },
            ],
        });
    }

    async escalateIncident(incidentId: string, teamId: string, level: number) {
        return prisma.incident.update({
            where: { id: incidentId },
            data: {
                assignedTeamId: teamId,
                escalationLevel: level,
            },
        });
    }

    async createIncidentLog(incidentId: string, rawLog: string) {
        return prisma.incidentLog.create({
            data: {
                incidentId,
                logType: 'note',
                rawLog,
            },
        });
    }
}

export const escalationRepository = new EscalationRepository();
