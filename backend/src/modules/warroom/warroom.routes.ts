import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { WarRoomController } from './warroom.controller';

const router = Router();

router.use(authenticate);

router.get(
    '/:incidentId/messages',
    requirePermission('INCIDENT_VIEW'),
    WarRoomController.getHistory
);

export const warRoomRoutes = router;
