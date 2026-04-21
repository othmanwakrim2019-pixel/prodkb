import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { createResponse } from '../../../common/types/api.response';
import { canAccessIncidentTeam } from '../../incidents/application/services/incident-visibility.service';
import { warRoomService } from '../application/warroom.service';

export class WarRoomController {
    static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const incident = await warRoomService.findIncidentTeam(req.params.incidentId);

            if (!incident || !canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
                res.status(403).json(createResponse(false, null, 'Forbidden'));
                return;
            }

            const messages = await warRoomService.getHistory(req.params.incidentId);
            res.json(createResponse(true, messages));
        } catch (error) {
            next(error);
        }
    }
}
