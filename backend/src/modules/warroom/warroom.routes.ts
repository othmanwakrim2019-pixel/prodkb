import { Router } from 'express';
import { warRoomService } from './warroom.service';
import { authenticate } from '../../common/middleware/auth.middleware';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/v1/warroom/:incidentId/messages — load history
router.get('/:incidentId/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const messages = await warRoomService.getHistory(req.params.incidentId);
        res.json(createResponse(true, messages));
    } catch (error) { next(error); }
});

export const warRoomRoutes = router;
