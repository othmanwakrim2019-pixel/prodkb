
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', authenticate, authorize(['ADMIN']), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);

export const authRoutes = router;
