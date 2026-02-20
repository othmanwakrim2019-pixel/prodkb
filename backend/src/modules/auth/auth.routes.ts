
import { Router, Request, Response, NextFunction } from 'express';
import { AuthController, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS } from './auth.controller';
import { authenticate, authorize, invalidateAuthCache, AuthRequest } from '../../common/middleware/auth.middleware';
import { refreshTokenService } from './refresh-token.service';
import { createResponse } from '../../common/types/api.response';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', authenticate, authorize(['ADMIN']), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);

// ── Refresh Token ──
// Reads refresh token from httpOnly cookie (no body needed)
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

        if (!refreshToken) {
            res.status(401).json(createResponse(false, null, 'No refresh token'));
            return;
        }

        const result = await refreshTokenService.refresh(refreshToken);

        // Set new access token cookie
        res.cookie(ACCESS_TOKEN_COOKIE, result.token, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set new refresh token cookie (rotation)
        res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json(createResponse(true, null, 'Token refreshed'));
    } catch (error) { next(error); }
});

// Logout — revoke refresh token + clear cookies + invalidate Redis cache
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Read refresh token from cookie
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
        if (refreshToken) {
            await refreshTokenService.revoke(refreshToken);
        }

        // Invalidate the Redis auth cache for this user
        if (req.user?.id) {
            await invalidateAuthCache(req.user.id);
        }

        // Clear both cookies
        res.clearCookie(ACCESS_TOKEN_COOKIE, { ...COOKIE_OPTIONS });
        res.clearCookie(REFRESH_TOKEN_COOKIE, { ...COOKIE_OPTIONS });

        res.json(createResponse(true, null, 'Logged out successfully'));
    } catch (error) { next(error); }
});

export const authRoutes = router;
