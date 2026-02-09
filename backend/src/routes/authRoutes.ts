import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorize(['ADMIN']), register);
router.get('/me', authenticate, getMe);

export default router;
