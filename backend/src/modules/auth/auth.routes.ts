
import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { refreshTokenService } from './refresh-token.service';
import { createResponse } from '../../common/types/api.response';
import { z } from 'zod';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', authenticate, authorize(['ADMIN']), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);

// ── Refresh Token ──
const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const result = await refreshTokenService.refresh(refreshToken);
        res.json(createResponse(true, result));
    } catch (error) { next(error); }
});

// Logout — revoke refresh token
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await refreshTokenService.revoke(refreshToken);
        }
        res.json(createResponse(true, null, 'Logged out successfully'));
    } catch (error) { next(error); }
});

export const authRoutes = router;
