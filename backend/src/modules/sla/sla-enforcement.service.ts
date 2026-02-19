
/**
 * SLA Enforcement Engine
 * Cron job that checks for SLA breaches every 60 seconds.
 * Detects acknowledge + resolve time violations, marks incidents, and sends alerts.
 * @module modules/sla/sla-enforcement.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { emailService } from '../../common/services/emailService';
import { IncidentStatus } from '../../constants';

export class SLAEnforcementService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL_MS = 60_000; // 60 seconds
    private isRunning = false;

    /**
     * Start the SLA enforcement cron
     */
    start(): void {
        if (this.intervalId) return; // already running
        logger.info('SLA Enforcement Engine started (interval: 60s)');
        this.intervalId = setInterval(() => this.check(), this.CHECK_INTERVAL_MS);
        // Run immediately on start
        this.check();
    }

    /**
     * Stop the SLA enforcement cron
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('SLA Enforcement Engine stopped');
        }
    }

    /**
     * Main enforcement loop — idempotent, safe to run concurrently
     */
    private async check(): Promise<void> {
        if (this.isRunning) return; // skip if previous check still running
        this.isRunning = true;

        try {
            const now = new Date();

            // Find open incidents with SLAs that haven't been breached yet
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
                    system: { select: { name: true } },
                    assignedTeam: { select: { name: true, emailDistribution: true } },
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

                    // Send breach notification
                    this.notifyBreach(incident, ackBreached ? 'acknowledge' : 'resolve', minutesElapsed)
                        .catch(err => logger.error('SLA breach notification failed', { error: err.message, incidentId: incident.id }));
                }
            }

            if (breachCount > 0) {
                logger.warn(`SLA Enforcement: ${breachCount} breach(es) detected`, { total: incidents.length, breached: breachCount });
            }
        } catch (error: any) {
            logger.error('SLA Enforcement check failed', { error: error.message });
        } finally {
            this.isRunning = false;
        }
    }

    private async notifyBreach(incident: any, type: 'acknowledge' | 'resolve', minutesElapsed: number): Promise<void> {
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
