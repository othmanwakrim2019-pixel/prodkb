
import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('SEARCH_VIEW'), SearchController.globalSearch);

export const searchRoutes = router;
