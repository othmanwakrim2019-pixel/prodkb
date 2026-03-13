import { Router } from 'express';
import { warRoomService } from './warroom.service';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { Response, NextFunction } from 'express';
import { prisma } from '../../common/utils/prisma';
import { canAccessIncidentTeam } from '../incidents/services/incident-visibility.service';

const router = Router();
router.use(authenticate);

// GET /api/v1/warroom/:incidentId/messages — load history
router.get('/:incidentId/messages', requirePermission('INCIDENT_VIEW'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const incident = await prisma.incident.findUnique({
            where: { id: req.params.incidentId },
            select: { assignedTeamId: true }
        });

        if (!incident || !canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
            return res.status(403).json(createResponse(false, null, 'Forbidden'));
        }

        const messages = await warRoomService.getHistory(req.params.incidentId);
        res.json(createResponse(true, messages));
    } catch (error) { next(error); }
});

export const warRoomRoutes = router;
