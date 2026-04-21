import { Router } from 'express';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';
import { PostMortemController } from '../presentation/postmortem.controller';

const router = Router();

router.get(
    '/:incidentId/postmortem',
    authenticate,
    requirePermission('INCIDENT_VIEW'),
    PostMortemController.getByIncidentId
);

router.post(
    '/:incidentId/postmortem',
    authenticate,
    requirePermission('INCIDENT_EDIT'),
    PostMortemController.saveByIncidentId
);

export const postMortemRoutes = router;
