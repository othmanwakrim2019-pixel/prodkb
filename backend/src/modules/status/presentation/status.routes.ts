import { Router } from 'express';
import { StatusController } from '../presentation/status.controller';

const router = Router();

router.get('/', StatusController.getPublicStatus);

export const statusRoutes = router;
