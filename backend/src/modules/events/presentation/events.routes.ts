import { Router } from 'express';
import { SSEController } from '../presentation/sse.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';

const router = Router();

// SSE stream — requires authentication
router.get('/stream', authenticate, SSEController.stream);

export const eventRoutes = router;
