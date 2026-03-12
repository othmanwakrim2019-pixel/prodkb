
import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('SEARCH_VIEW'), SearchController.globalSearch);

export const searchRoutes = router;
