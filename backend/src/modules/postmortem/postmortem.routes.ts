import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../common/utils/prisma';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';
import type { AuthRequest } from '../../common/middleware/auth.middleware';

const router = Router();

// GET /api/v1/incidents/:incidentId/postmortem
router.get('/:incidentId/postmortem', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const pm = await prisma.postMortem.findUnique({
            where: { incidentId: req.params.incidentId },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        });
        if (!pm) return res.status(404).json({ success: false, error: 'No post-mortem found' });
        res.json({ success: true, data: pm });
    } catch (err) { next(err); }
});

// POST /api/v1/incidents/:incidentId/postmortem
router.post('/:incidentId/postmortem', authenticate, checkPermission('INCIDENT_EDIT'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { summary, rootCause, timeline, impact, lessonsLearned, preventiveActions, status } = req.body;
        const userId = req.user?.id;

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
