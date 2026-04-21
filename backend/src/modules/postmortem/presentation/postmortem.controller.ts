import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { canAccessIncidentTeam } from '../../incidents/application/services/incident-visibility.service';
import { postMortemService } from '../application/postmortem.service';

export class PostMortemController {
    static async getByIncidentId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const incident = await postMortemService.findIncidentTeam(req.params.incidentId);

            if (!incident || !canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
                res.status(403).json({ success: false, error: 'Forbidden' });
                return;
            }

            const postMortem = await postMortemService.findByIncidentId(req.params.incidentId);
            if (!postMortem) {
                res.status(404).json({ success: false, error: 'No post-mortem found' });
                return;
            }

            res.json({ success: true, data: postMortem });
        } catch (error) {
            next(error);
        }
    }

    static async saveByIncidentId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Not authenticated' });
                return;
            }

            const postMortem = await postMortemService.saveByIncidentId(req.params.incidentId, userId, req.body);
            res.json({ success: true, data: postMortem });
        } catch (error) {
            next(error);
        }
    }
}
