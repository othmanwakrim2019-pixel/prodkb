import { logger } from '../../../common/utils/logger';
import { ValidationError } from '../../../common/errors/app.error';
import { IncidentStatus } from '../../../constants';
import type { IIncident } from '../../../types';
import { webhookService } from '../../webhooks/webhook.service';
import { sendNotification } from './incident-shared';
import { incidentCrudService } from './incident-crud.service';
import { incidentRepository } from '../repositories/incident.repository';

export class IncidentStatusService {
    async acknowledge(id: string, userId: string): Promise<IIncident> {
        const incident = await incidentCrudService.findById(id);

        if (incident.status !== IncidentStatus.OPEN) {
            throw new ValidationError(`Cannot acknowledge incident in status '${incident.status}'. Only 'Open' incidents can be acknowledged.`);
        }

        if (incident.acknowledgedAt) {
            throw new ValidationError('Incident has already been acknowledged.');
        }

        const now = new Date();
        const timeToAcknowledge = Math.round((now.getTime() - new Date(incident.createdAt).getTime()) / 60000);

        const updated = await incidentRepository.updateIncident(id, {
            status: IncidentStatus.ACKNOWLEDGED,
            acknowledgedAt: now,
            timeToAcknowledge,
            updatedById: userId,
            version: (incident.version ?? 0) + 1,
        });

        await incidentRepository.createIncidentLog({
            incidentId: id,
            logType: 'activity',
            rawLog: `Incident **acknowledged**. Time to acknowledge: ${timeToAcknowledge} minutes.`,
            createdById: userId,
        });

        logger.info('Incident acknowledged', { incidentId: id, userId, timeToAcknowledge });
        sendNotification(updated, 'updated').catch(() => { });
        webhookService.dispatch('incident.updated', { incident: updated }).catch(() => { });

        return updated as unknown as IIncident;
    }
}

export const incidentStatusService = new IncidentStatusService();
