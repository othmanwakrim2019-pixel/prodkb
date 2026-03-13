
import { Router } from 'express';
import { RoleController } from './role.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Permission catalogue for role management
router.get('/permissions', requirePermission('ROLE_MANAGE'), RoleController.getAllPermissions);

// Roles
router.get('/', requirePermission('ROLE_MANAGE'), RoleController.getAllRoles);
router.get('/:id', requirePermission('ROLE_MANAGE'), RoleController.getRoleById);
router.post('/', requirePermission('ROLE_MANAGE'), RoleController.createRole);
router.put('/:id', requirePermission('ROLE_MANAGE'), RoleController.updateRole);
router.put('/:id/permissions', requirePermission('ROLE_MANAGE'), RoleController.updateRolePermissions);
router.delete('/:id', requirePermission('ROLE_MANAGE'), RoleController.deleteRole);

export const roleRoutes = router;
