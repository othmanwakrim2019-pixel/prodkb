
import { Router } from 'express';
import { SlaController } from './sla.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// List/Get accessible to authenticated users (or restrict as needed)
router.get('/', SlaController.listSLAs);
router.get('/:id', SlaController.getSLA);

// Manage requires permission
router.post('/', checkPermission('SLA_MANAGE'), SlaController.createSLA);
router.put('/:id', checkPermission('SLA_MANAGE'), SlaController.updateSLA);
router.delete('/:id', checkPermission('SLA_MANAGE'), SlaController.deleteSLA);

export const slaRoutes = router;
