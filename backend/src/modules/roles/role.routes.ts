
import { Router } from 'express';
import { RoleController } from './role.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Permissions (Public to auth users)
router.get('/permissions', RoleController.getAllPermissions);

// Roles
router.get('/roles', checkPermission('ROLE_MANAGE'), RoleController.getAllRoles);
router.post('/roles', checkPermission('ROLE_MANAGE'), RoleController.createRole);
router.put('/roles/:id', checkPermission('ROLE_MANAGE'), RoleController.updateRole);
router.delete('/roles/:id', checkPermission('ROLE_MANAGE'), RoleController.deleteRole);

export const roleRoutes = router;
