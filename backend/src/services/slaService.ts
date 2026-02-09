import { Incident, SLA } from '@prisma/client';

export interface SLAStatus {
    status: 'ON_TARGET' | 'AT_RISK' | 'BREACHED';
    acknowledgeStatus: 'ON_TARGET' | 'AT_RISK' | 'BREACHED';
    resolveStatus: 'ON_TARGET' | 'AT_RISK' | 'BREACHED';
    acknowledgeTimeLeft?: number; // minutes
    resolveTimeLeft?: number; // minutes
}

export class SLAService {
    calculateTimeToAcknowledge(incident: Incident): number | null {
        if (!incident.acknowledgedAt) {
            return null;
        }
        const createdAt = new Date(incident.createdAt);
        const acknowledgedAt = new Date(incident.acknowledgedAt);
        const diffMs = acknowledgedAt.getTime() - createdAt.getTime();
        return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }

    calculateTimeToResolve(incident: Incident): number | null {
        if (!incident.resolvedAt) {
            return null;
        }
        const createdAt = new Date(incident.createdAt);
        const resolvedAt = new Date(incident.resolvedAt);
        const diffMs = resolvedAt.getTime() - createdAt.getTime();
        return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }

    getSLAStatus(incident: Incident & { sla?: SLA | null }): SLAStatus {
        if (!incident.sla) {
            return {
                status: 'ON_TARGET',
                acknowledgeStatus: 'ON_TARGET',
                resolveStatus: 'ON_TARGET',
            };
        }

        const now = new Date();
        const createdAt = new Date(incident.createdAt);
        const elapsed = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60)); // minutes

        // Check acknowledge SLA
        let acknowledgeStatus: 'ON_TARGET' | 'AT_RISK' | 'BREACHED' = 'ON_TARGET';
        let acknowledgeTimeLeft: number | undefined;

        if (!incident.acknowledgedAt) {
            const acknowledgeTarget = incident.sla.acknowledgeTimeMinutes;
            const percentElapsed = (elapsed / acknowledgeTarget) * 100;

            if (elapsed >= acknowledgeTarget) {
                acknowledgeStatus = 'BREACHED';
                acknowledgeTimeLeft = 0;
            } else if (percentElapsed >= 75) {
                acknowledgeStatus = 'AT_RISK';
                acknowledgeTimeLeft = acknowledgeTarget - elapsed;
            } else {
                acknowledgeStatus = 'ON_TARGET';
                acknowledgeTimeLeft = acknowledgeTarget - elapsed;
            }
        } else {
            const timeToAck = this.calculateTimeToAcknowledge(incident) || 0;
            acknowledgeStatus = timeToAck <= incident.sla.acknowledgeTimeMinutes ? 'ON_TARGET' : 'BREACHED';
        }

        // Check resolve SLA
        let resolveStatus: 'ON_TARGET' | 'AT_RISK' | 'BREACHED' = 'ON_TARGET';
        let resolveTimeLeft: number | undefined;

        if (incident.status !== 'Resolved' && incident.status !== 'Closed') {
            const resolveTarget = incident.sla.resolveTimeMinutes;
            const percentElapsed = (elapsed / resolveTarget) * 100;

            if (elapsed >= resolveTarget) {
                resolveStatus = 'BREACHED';
                resolveTimeLeft = 0;
            } else if (percentElapsed >= 75) {
                resolveStatus = 'AT_RISK';
                resolveTimeLeft = resolveTarget - elapsed;
            } else {
                resolveStatus = 'ON_TARGET';
                resolveTimeLeft = resolveTarget - elapsed;
            }
        } else if (incident.resolvedAt) {
            const timeToResolve = this.calculateTimeToResolve(incident) || 0;
            resolveStatus = timeToResolve <= incident.sla.resolveTimeMinutes ? 'ON_TARGET' : 'BREACHED';
        }

        // Overall status is the worst of the two
        const status =
            acknowledgeStatus === 'BREACHED' || resolveStatus === 'BREACHED' ? 'BREACHED' :
                acknowledgeStatus === 'AT_RISK' || resolveStatus === 'AT_RISK' ? 'AT_RISK' :
                    'ON_TARGET';

        return {
            status,
            acknowledgeStatus,
            resolveStatus,
            acknowledgeTimeLeft,
            resolveTimeLeft,
        };
    }

    // Auto-calculate and update SLA metrics when incident status changes
    updateSLAMetrics(incident: Incident): Partial<Incident> {
        const updates: Partial<Incident> = {};

        // Auto-acknowledge on status change to "In Progress"
        if (incident.status === 'In Progress' && !incident.acknowledgedAt) {
            updates.acknowledgedAt = new Date();
            updates.timeToAcknowledge = this.calculateTimeToAcknowledge({
                ...incident,
                acknowledgedAt: new Date(),
            });
        }

        // Auto-resolve on status change to "Resolved"
        if ((incident.status === 'Resolved' || incident.status === 'Closed') && !incident.resolvedAt) {
            updates.resolvedAt = new Date();
            updates.timeToResolve = this.calculateTimeToResolve({
                ...incident,
                resolvedAt: new Date(),
            });
        }

        return updates;
    }
}

export const slaService = new SLAService();
