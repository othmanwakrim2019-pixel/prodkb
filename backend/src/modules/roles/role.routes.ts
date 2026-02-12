
import { Router } from 'express';
import { RoleController } from './role.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Permissions (Public to auth users)
router.get('/permissions', RoleController.getAllPermissions);

// Roles
router.get('/', checkPermission('ROLE_MANAGE'), RoleController.getAllRoles);
router.post('/', checkPermission('ROLE_MANAGE'), RoleController.createRole);
router.put('/:id', checkPermission('ROLE_MANAGE'), RoleController.updateRole);
router.delete('/:id', checkPermission('ROLE_MANAGE'), RoleController.deleteRole);

export const roleRoutes = router;
