import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../common/utils/prisma';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { canAccessIncidentTeam } from '../incidents/services/incident-visibility.service';

const router = Router();

// GET /api/v1/incidents/:incidentId/postmortem
router.get('/:incidentId/postmortem', authenticate, requirePermission('INCIDENT_VIEW'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const incident = await prisma.incident.findUnique({
            where: { id: req.params.incidentId },
            select: { assignedTeamId: true }
        });

        if (!incident || !canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const pm = await prisma.postMortem.findUnique({
            where: { incidentId: req.params.incidentId },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        });
        if (!pm) return res.status(404).json({ success: false, error: 'No post-mortem found' });
        res.json({ success: true, data: pm });
    } catch (err) { next(err); }
});

// POST /api/v1/incidents/:incidentId/postmortem
router.post('/:incidentId/postmortem', authenticate, requirePermission('INCIDENT_EDIT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { summary, rootCause, timeline, impact, lessonsLearned, preventiveActions, status } = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

        const pm = await prisma.postMortem.upsert({
            where: { incidentId: req.params.incidentId },
            create: {
                incidentId: req.params.incidentId,
                summary: summary || '',
                rootCause: rootCause || '',
                timeline: timeline || '',
                impact: impact || '',
                lessonsLearned: lessonsLearned || '',
                preventiveActions: preventiveActions || '',
                status: status || 'DRAFT',
                createdById: userId,
            },
            update: {
                summary, rootCause, timeline, impact, lessonsLearned, preventiveActions,
                status: status || 'DRAFT',
            },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        });

        res.json({ success: true, data: pm });
    } catch (err) { next(err); }
});

export const postMortemRoutes = router;
