import { logger } from '../../../../common/utils/logger';
import { emailService } from '../../../../common/services/email.service';
import { notificationService } from '../../../notifications/application/notification.service';
import { ValidationError } from '../../../../common/errors/app.error';
import { IncidentStatus } from '../../../../constants';

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

export async function sendNotification(incident: any, type: 'created' | 'updated' | 'resolved'): Promise<void> {
    try {
        // Email notification
        switch (type) {
            case 'created': await emailService.sendIncidentCreated({ incident }); break;
            case 'updated': await emailService.sendIncidentUpdated({ incident }); break;
            case 'resolved': await emailService.sendIncidentResolved({ incident }); break;
        }
    } catch (e) {
        logger.warn('Email notification failed', { error: e });
    }

    // In-app notification for team members
    if (incident.assignedTeamId) {
        try {
            const incidentRef = `#${incident.id.substring(0, 8)}`;
            let notifType = 'incident_updated';
            let title = '';
            let message = '';

            switch (type) {
                case 'created':
                    notifType = 'incident_created';
                    title = `New Incident ${incidentRef}`;
                    message = `${incident.title} — Severity: ${incident.severity}`;
                    break;
                case 'updated':
                    notifType = 'status_changed';
                    title = `Incident Updated ${incidentRef}`;
                    message = `${incident.title} — Status: ${incident.status}`;
                    break;
                case 'resolved':
                    notifType = 'incident_resolved';
                    title = `Incident Resolved ${incidentRef}`;
                    message = `${incident.title} has been resolved`;
                    break;
            }

            await notificationService.createForTeam(
                incident.assignedTeamId, notifType, title, message, incident.id
            );
        } catch (e) {
            logger.warn('In-app notification failed', { error: e });
        }
    }
}

/**
 * Send in-app notification for note/file events (no email)
 */
export async function sendNoteNotification(incident: any, noteType: 'note_added' | 'file_uploaded'): Promise<void> {
    if (!incident.assignedTeamId) return;
    try {
        const incidentRef = `#${incident.id.substring(0, 8)}`;
        const title = noteType === 'note_added'
            ? `Note Added ${incidentRef}`
            : `File Uploaded ${incidentRef}`;
        const message = incident.title;

        await notificationService.createForTeam(
            incident.assignedTeamId, noteType, title, message, incident.id
        );
    } catch (e) {
        logger.warn('In-app note notification failed', { error: e });
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
