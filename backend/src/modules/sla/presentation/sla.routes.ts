
import { Router } from 'express';
import { SlaController } from '../presentation/sla.controller';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// List/Get accessible to authenticated users (or restrict as needed)
router.get('/', SlaController.listSLAs);
router.get('/:id', SlaController.getSLA);

// Manage requires permission
router.post('/', requirePermission('SLA_MANAGE'), SlaController.createSLA);
router.put('/:id', requirePermission('SLA_MANAGE'), SlaController.updateSLA);
router.delete('/:id', requirePermission('SLA_MANAGE'), SlaController.deleteSLA);

export const slaRoutes = router;
