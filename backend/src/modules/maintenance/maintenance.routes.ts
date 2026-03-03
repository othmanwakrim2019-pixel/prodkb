import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', MaintenanceController.getAll);
router.get('/active', MaintenanceController.getActive);
router.post('/', authorize(['ADMIN']), MaintenanceController.create);
router.put('/:id', authorize(['ADMIN']), MaintenanceController.update);
router.delete('/:id', authorize(['ADMIN']), MaintenanceController.remove);

export const maintenanceRoutes = router;
