/**
 * SLA Enforcement Engine
 * Core business logic for detecting SLA breaches and escalating incidents.
 *
 * This service is now stateless - it no longer manages its own scheduling.
 * Scheduling is handled by BullMQ (see sla.queue.ts + workers/sla.worker.ts).
 *
 * The `check()` method is the main entry point, called by the BullMQ worker.
 * It is idempotent and safe to retry on failure.
 *
 * @module modules/sla/sla-enforcement.service
 */

import { logger } from '../../../common/utils/logger';
import { emailService } from '../../../common/services/email.service';
import { escalationService } from '../../escalation/application/escalation.service';
import { webhookService } from '../../webhooks/application/webhook.service';
import { slaRepository } from '../infrastructure/prisma-sla.repository';

export class SLAEnforcementService {
    async check(): Promise<void> {
        try {
            const now = new Date();
            await this.detectNewBreaches(now);
            await this.escalateBreachedIncidents();
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            logger.error('SLA Enforcement check failed', { error: errMsg });
            throw error;
        }
    }

    private async detectNewBreaches(now: Date): Promise<void> {
        const incidents = await slaRepository.findUnbreachedActiveIncidentsWithSla();
        let breachCount = 0;

        for (const incident of incidents) {
            if (!incident.sla) continue;

            const createdAt = new Date(incident.createdAt);
            const minutesElapsed = (now.getTime() - createdAt.getTime()) / 60_000;

            const ackBreached = !incident.acknowledgedAt &&
                minutesElapsed > incident.sla.acknowledgeTimeMinutes;

            const resolveBreached = !incident.resolvedAt &&
                minutesElapsed > incident.sla.resolveTimeMinutes;

            if (ackBreached || resolveBreached) {
                breachCount++;

                await slaRepository.markIncidentSlaBreached(incident.id, now);
                await slaRepository.createIncidentLog({
                    incidentId: incident.id,
                    logType: 'note',
                    rawLog: `SLA BREACH: ${ackBreached ? 'Acknowledge' : 'Resolution'} time exceeded. ` +
                        `SLA "${incident.sla.name}" requires ${ackBreached ? `${incident.sla.acknowledgeTimeMinutes}min acknowledge` : `${incident.sla.resolveTimeMinutes}min resolution`}. ` +
                        `Elapsed: ${Math.round(minutesElapsed)}min.`,
                });

                this.notifyBreach(incident, ackBreached ? 'acknowledge' : 'resolve', minutesElapsed)
                    .catch((err) => logger.error('SLA breach notification failed', { error: err.message, incidentId: incident.id }));

                webhookService.dispatch('incident.sla_breached', {
                    incident: {
                        id: incident.id,
                        title: incident.title,
                        severity: incident.severity,
                        status: incident.status,
                        system: incident.system,
                        assignedTeam: incident.assignedTeam,
                        sla: { name: incident.sla.name },
                        breachType: ackBreached ? 'acknowledge' : 'resolve',
                        minutesElapsed: Math.round(minutesElapsed),
                    },
                }).catch(() => { });

                try {
                    await escalationService.escalateIncident(incident.id);
                    logger.info('L1 escalation triggered after SLA breach', { incidentId: incident.id });
                } catch (escErr: unknown) {
                    const errMsg = escErr instanceof Error ? escErr.message : String(escErr);
                    logger.error('Escalation failed after breach', { error: errMsg, incidentId: incident.id });
                }
            }
        }

        if (breachCount > 0) {
            logger.warn(`SLA Enforcement: ${breachCount} breach(es) detected`, { total: incidents.length, breached: breachCount });
        }
    }

    private async escalateBreachedIncidents(): Promise<void> {
        const breachedIncidents = await slaRepository.findBreachedActiveIncidents();

        for (const incident of breachedIncidents) {
            try {
                const prevLevel = incident.escalationLevel;
                await escalationService.escalateIncident(incident.id);

                const updated = await slaRepository.findIncidentEscalationState(incident.id);
                if (updated && updated.escalationLevel > prevLevel) {
                    logger.info('Incident escalated to next level', {
                        incidentId: incident.id,
                        fromLevel: prevLevel,
                        toLevel: updated.escalationLevel,
                    });

                    webhookService.dispatch('incident.escalated', {
                        incident: {
                            id: incident.id,
                            title: incident.title,
                            severity: incident.severity,
                            escalationLevel: updated.escalationLevel,
                            assignedTeamId: updated.assignedTeamId,
                        },
                    }).catch(() => { });
                }
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                logger.error('Escalation check failed', { error: errMsg, incidentId: incident.id });
            }
        }
    }

    private async notifyBreach(
        incident: { id: string; title: string; severity: string; status: string; sla?: { name: string } | null; [key: string]: unknown },
        type: 'acknowledge' | 'resolve',
        minutesElapsed: number,
    ): Promise<void> {
        try {
            await emailService.sendIncidentUpdated({
                incident: {
                    ...incident,
                    _breachType: type,
                    _minutesElapsed: Math.round(minutesElapsed),
                    _slaName: incident.sla?.name,
                },
            });
        } catch (e) {
            logger.warn('SLA breach email failed', { error: e });
        }
    }
}

export const slaEnforcementService = new SLAEnforcementService();
