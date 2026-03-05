
/**
 * SLA Enforcement Engine
 * Core business logic for detecting SLA breaches and escalating incidents.
 *
 * This service is now stateless — it no longer manages its own scheduling.
 * Scheduling is handled by BullMQ (see sla.queue.ts + workers/sla.worker.ts).
 *
 * The `check()` method is the main entry point, called by the BullMQ worker.
 * It is idempotent and safe to retry on failure.
 *
 * @module modules/sla/sla-enforcement.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { emailService } from '../../common/services/email.service';
import { IncidentStatus } from '../../constants';
import { escalationService } from '../escalation/escalation.service';
import { webhookService } from '../webhooks/webhook.service';

export class SLAEnforcementService {
    /**
     * Main enforcement check — called by the BullMQ worker.
     * Idempotent, safe to retry on failure.
     */
    async check(): Promise<void> {
        try {
            const now = new Date();

            // ── Pass 1: Detect NEW SLA breaches ──
            await this.detectNewBreaches(now);

            // ── Pass 2: Escalate already-breached incidents to next level ──
            await this.escalateBreachedIncidents();
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            logger.error('SLA Enforcement check failed', { error: errMsg });
            // Re-throw so BullMQ can retry with backoff
            throw error;
        }
    }

    /**
     * Pass 1: Find incidents that just breached their SLA
     * Mark them as breached, trigger L1 escalation, dispatch webhooks
     */
    private async detectNewBreaches(now: Date): Promise<void> {
        const incidents = await prisma.incident.findMany({
            where: {
                status: {
                    in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS],
                },
                slaId: { not: null },
                slaBreached: false,
            },
            include: {
                sla: true,
                system: { select: { id: true, name: true } },
                assignedTeam: { select: { id: true, name: true, emailDistribution: true } },
                createdBy: { select: { name: true, email: true } },
            },
        });

        let breachCount = 0;

        for (const incident of incidents) {
            if (!incident.sla) continue;

            const createdAt = new Date(incident.createdAt);
            const minutesElapsed = (now.getTime() - createdAt.getTime()) / 60_000;

            // Check acknowledge SLA breach
            const ackBreached = !incident.acknowledgedAt &&
                minutesElapsed > incident.sla.acknowledgeTimeMinutes;

            // Check resolve SLA breach
            const resolveBreached = !incident.resolvedAt &&
                minutesElapsed > incident.sla.resolveTimeMinutes;

            if (ackBreached || resolveBreached) {
                breachCount++;

                await prisma.incident.update({
                    where: { id: incident.id },
                    data: {
                        slaBreached: true,
                        slaBreachNotifiedAt: now,
                    },
                });

                // Log the breach
                await prisma.incidentLog.create({
                    data: {
                        incidentId: incident.id,
                        logType: 'note',
                        rawLog: `SLA BREACH: ${ackBreached ? 'Acknowledge' : 'Resolution'} time exceeded. ` +
                            `SLA "${incident.sla.name}" requires ${ackBreached ? incident.sla.acknowledgeTimeMinutes + 'min acknowledge' : incident.sla.resolveTimeMinutes + 'min resolution'}. ` +
                            `Elapsed: ${Math.round(minutesElapsed)}min.`,
                    },
                });

                // Send breach notification email
                this.notifyBreach(incident, ackBreached ? 'acknowledge' : 'resolve', minutesElapsed)
                    .catch(err => logger.error('SLA breach notification failed', { error: err.message, incidentId: incident.id }));

                // Dispatch webhook: incident.sla_breached
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
                    }
                }).catch(() => { });

                // Trigger L1 escalation immediately
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

    /**
     * Pass 2: Check already-breached incidents for next-level escalation
     * The escalateIncident() method checks delayMinutes internally
     */
    private async escalateBreachedIncidents(): Promise<void> {
        // Find active incidents that are already breached but not resolved
        const breachedIncidents = await prisma.incident.findMany({
            where: {
                status: {
                    in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS],
                },
                slaBreached: true,
                slaBreachNotifiedAt: { not: null },
            },
            select: { id: true, escalationLevel: true, title: true, severity: true },
        });

        for (const incident of breachedIncidents) {
            try {
                const prevLevel = incident.escalationLevel;
                await escalationService.escalateIncident(incident.id);

                // Check if escalation actually happened by re-reading the incident
                const updated = await prisma.incident.findUnique({
                    where: { id: incident.id },
                    select: { escalationLevel: true, assignedTeamId: true },
                });

                if (updated && updated.escalationLevel > prevLevel) {
                    logger.info('Incident escalated to next level', {
                        incidentId: incident.id,
                        fromLevel: prevLevel,
                        toLevel: updated.escalationLevel,
                    });

                    // Dispatch webhook: incident.escalated
                    webhookService.dispatch('incident.escalated', {
                        incident: {
                            id: incident.id,
                            title: incident.title,
                            severity: incident.severity,
                            escalationLevel: updated.escalationLevel,
                            assignedTeamId: updated.assignedTeamId,
                        }
                    }).catch(() => { });
                }
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                logger.error('Escalation check failed', { error: errMsg, incidentId: incident.id });
            }
        }
    }

    private async notifyBreach(
        incident: { id: string; title: string; severity: string; status: string; sla?: { name: string } | null;[key: string]: unknown },
        type: 'acknowledge' | 'resolve',
        minutesElapsed: number
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
