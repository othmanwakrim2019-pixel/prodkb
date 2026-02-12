
import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { checkPermission } from '../../common/middleware/auth.middleware'; // Or permission middleware if separate

const router = Router();

router.use(authenticate); // All user routes require auth

router.get('/', checkPermission('USER_VIEW'), UserController.getAllUsers);
router.put('/:id', checkPermission('USER_MANAGE'), UserController.updateUser);
router.delete('/:id', checkPermission('USER_MANAGE'), UserController.deleteUser);
router.put('/me/password', UserController.changePassword);

export const userRoutes = router;
