import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('MAINTENANCE_MANAGE'), MaintenanceController.getAll);
router.get('/active', requirePermission('MAINTENANCE_MANAGE'), MaintenanceController.getActive);
router.post('/', requirePermission('MAINTENANCE_MANAGE'), MaintenanceController.create);
router.put('/:id', requirePermission('MAINTENANCE_MANAGE'), MaintenanceController.update);
router.delete('/:id', requirePermission('MAINTENANCE_MANAGE'), MaintenanceController.remove);

export const maintenanceRoutes = router;
