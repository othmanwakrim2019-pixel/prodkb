
/**
 * Escalation Service — Auto-escalation based on rules
 * When SLA breaches occur, escalates incidents through team chains.
 * @module modules/escalation/escalation.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { IncidentStatus } from '../../constants';
import { z } from 'zod';

// ── Zod schemas ──
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

export class EscalationService {
    /**
     * Get all escalation rules
     */
    async findAll() {
        return prisma.escalationRule.findMany({
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
            orderBy: [{ systemId: 'asc' }, { severity: 'asc' }, { level: 'asc' }],
        });
    }

    /**
     * Create an escalation rule
     */
    async create(data: z.infer<typeof createEscalationRuleSchema>) {
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
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Update an escalation rule
     */
    async update(id: string, data: z.infer<typeof updateEscalationRuleSchema>) {
        const existing = await prisma.escalationRule.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Escalation rule not found');

        return prisma.escalationRule.update({
            where: { id },
            data,
            include: {
                system: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Delete an escalation rule
     */
    async delete(id: string) {
        const existing = await prisma.escalationRule.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Escalation rule not found');
        return prisma.escalationRule.delete({ where: { id } });
    }

    /**
     * Escalate an incident to the next level
     * Called by SLA enforcement when breach detected
     */
    async escalateIncident(incidentId: string): Promise<void> {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: { system: true, sla: true },
        });

        if (!incident) return;

        // Find the next escalation rule for this incident
        const nextLevel = incident.escalationLevel + 1;

        const rule = await prisma.escalationRule.findFirst({
            where: {
                isActive: true,
                level: nextLevel,
                OR: [
                    { systemId: incident.systemId, severity: incident.severity },
                    { systemId: incident.systemId, severity: null },
                    { systemId: null, severity: incident.severity },
                    { systemId: null, severity: null },
                ],
            },
            orderBy: [
                // Most specific rule wins (system+severity > system > severity > wildcard)
                { systemId: 'desc' },
                { severity: 'desc' },
            ],
        });

        if (!rule) {
            logger.info('No escalation rule found for next level', { incidentId, nextLevel });
            return;
        }

        // Check if enough time has passed since breach notification
        if (incident.slaBreachNotifiedAt) {
            const minutesSinceBreach = (Date.now() - new Date(incident.slaBreachNotifiedAt).getTime()) / 60_000;
            if (minutesSinceBreach < rule.delayMinutes) {
                return; // Not time to escalate yet
            }
        }

        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                assignedTeamId: rule.teamId,
                escalationLevel: nextLevel,
            },
        });

        // Log the escalation
        await prisma.incidentLog.create({
            data: {
                incidentId,
                logType: 'note',
                rawLog: `AUTO-ESCALATION: Incident escalated to level ${nextLevel}. Reassigned to team via rule "${rule.name}".`,
            },
        });

        logger.info('Incident escalated', { incidentId, level: nextLevel, ruleId: rule.id, teamId: rule.teamId });
    }
}

export const escalationService = new EscalationService();
