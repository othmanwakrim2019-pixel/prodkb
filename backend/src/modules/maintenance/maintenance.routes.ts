import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', MaintenanceController.getAll);
router.get('/active', MaintenanceController.getActive);
router.post('/', checkPermission('SYSTEM_MANAGE'), MaintenanceController.create);
router.put('/:id', checkPermission('SYSTEM_MANAGE'), MaintenanceController.update);
router.delete('/:id', checkPermission('SYSTEM_MANAGE'), MaintenanceController.remove);

export const maintenanceRoutes = router;
