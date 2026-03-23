import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { AutoAssignController } from './auto-assign.controller';

const router = Router();

router.get('/', authenticate, requirePermission('AUTO_ASSIGN_MANAGE'), AutoAssignController.getAll);
router.post('/', authenticate, requirePermission('AUTO_ASSIGN_MANAGE'), AutoAssignController.create);
router.put('/:id', authenticate, requirePermission('AUTO_ASSIGN_MANAGE'), AutoAssignController.update);
router.delete('/:id', authenticate, requirePermission('AUTO_ASSIGN_MANAGE'), AutoAssignController.delete);

export const autoAssignRoutes = router;
