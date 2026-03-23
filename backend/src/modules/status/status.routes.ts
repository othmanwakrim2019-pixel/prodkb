import { Router } from 'express';
import { StatusController } from './status.controller';

const router = Router();

router.get('/', StatusController.getPublicStatus);

export const statusRoutes = router;
