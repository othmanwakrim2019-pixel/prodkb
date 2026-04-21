/**
 * Escalation Service - Auto-escalation based on rules
 * When SLA breaches occur, escalates incidents through team chains.
 * @module modules/escalation/escalation.service
 */

import { logger } from '../../../common/utils/logger';
import { NotFoundError } from '../../../common/errors/app.error';
import { z } from 'zod';
import { createEscalationRuleSchema, updateEscalationRuleSchema } from '../presentation/escalation.schema';
import { escalationRepository } from '../infrastructure/prisma-escalation.repository';

export class EscalationService {
    async findAll() {
        return escalationRepository.findRules();
    }

    async create(data: z.infer<typeof createEscalationRuleSchema>) {
        return escalationRepository.createRule(data);
    }

    async update(id: string, data: z.infer<typeof updateEscalationRuleSchema>) {
        const existing = await escalationRepository.findRuleById(id);
        if (!existing) throw new NotFoundError('Escalation rule not found');

        return escalationRepository.updateRule(id, data);
    }

    async delete(id: string) {
        const existing = await escalationRepository.findRuleById(id);
        if (!existing) throw new NotFoundError('Escalation rule not found');
        return escalationRepository.deleteRule(id);
    }

    async escalateIncident(incidentId: string): Promise<void> {
        const incident = await escalationRepository.findIncidentForEscalation(incidentId);
        if (!incident) return;

        const nextLevel = incident.escalationLevel + 1;
        const rule = await escalationRepository.findNextEscalationRule(incident.systemId, incident.severity, nextLevel);

        if (!rule) {
            logger.info('No escalation rule found for next level', { incidentId, nextLevel });
            return;
        }

        if (incident.slaBreachNotifiedAt) {
            const minutesSinceBreach = (Date.now() - new Date(incident.slaBreachNotifiedAt).getTime()) / 60_000;
            if (minutesSinceBreach < rule.delayMinutes) {
                return;
            }
        }

        await escalationRepository.escalateIncident(incidentId, rule.teamId, nextLevel);
        await escalationRepository.createIncidentLog(
            incidentId,
            `AUTO-ESCALATION: Incident escalated to level ${nextLevel}. Reassigned to team via rule "${rule.name}".`
        );

        logger.info('Incident escalated', { incidentId, level: nextLevel, ruleId: rule.id, teamId: rule.teamId });
    }
}

export const escalationService = new EscalationService();
