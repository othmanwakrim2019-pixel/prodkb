import { logger } from '../../../common/utils/logger';
import { emailService } from '../../../common/services/emailService';
import { ValidationError } from '../../../common/errors/app.error';
import { IncidentStatus } from '../../../constants';

export const defaultInclude = {
    system: true,
    job: true,
    createdBy: { select: { id: true, name: true, email: true } },
    resolvedBy: { select: { id: true, name: true, email: true } },
    assignedTeam: true,
    sla: true,
    linkedProcedure: { select: { id: true, title: true } },
    logs: {
        include: {
            createdBy: { select: { id: true, name: true, email: true } }
        }
    },
    updatedBy: { select: { id: true, name: true } },
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    [IncidentStatus.OPEN]: [IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED],
    [IncidentStatus.ACKNOWLEDGED]: [IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED],
    [IncidentStatus.IN_PROGRESS]: [IncidentStatus.RESOLVED, IncidentStatus.OPEN],
    [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.OPEN],
    [IncidentStatus.CLOSED]: [IncidentStatus.OPEN], // Allow reopen
};

export function validateStatusTransition(currentStatus: string, newStatus: string): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
        throw new ValidationError(
            `Invalid status transition: '${currentStatus}' → '${newStatus}'. ` +
            `Allowed transitions from '${currentStatus}': [${(allowed || []).join(', ')}]`
        );
    }
}

export async function sendNotification(incident: unknown, type: 'created' | 'updated' | 'resolved'): Promise<void> {
    try {
        switch (type) {
            case 'created': await emailService.sendIncidentCreated({ incident }); break;
            case 'updated': await emailService.sendIncidentUpdated({ incident }); break;
            case 'resolved': await emailService.sendIncidentResolved({ incident }); break;
        }
    } catch (e) {
        logger.warn('Notification failed', { error: e });
    }
}

export interface IncidentStats {
    createdToday: number;
    resolvedToday: number;
    closedCount: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    topSystems: Array<{ systemId: string; count: number; name: string }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    trends: Array<{ date: string; created: number; resolved: number }>;
    myWork: { myTeamQueue: number; myTeamBreaches: number };
}
