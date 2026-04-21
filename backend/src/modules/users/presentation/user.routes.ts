import { Router } from 'express';
import { UserController } from '../presentation/user.controller';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate); // All user routes require auth

router.get('/', requirePermission('USER_VIEW'), UserController.getAllUsers);
router.get('/:id/permissions', requirePermission('USER_VIEW'), UserController.getUserPermissions);
router.put('/:id', requirePermission('USER_MANAGE'), UserController.updateUser);
router.delete('/:id', requirePermission('USER_MANAGE'), UserController.deleteUser);
router.put('/me/password', UserController.changePassword);
router.put('/:id/reset-password', requirePermission('USER_MANAGE'), UserController.adminResetPassword);

export const userRoutes = router;
