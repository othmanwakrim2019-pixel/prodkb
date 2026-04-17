
import { Router, Request, Response, NextFunction } from 'express';
import { AuthController, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS } from './auth.controller';
import { authenticate, requirePermission, invalidateAuthCache, AuthRequest } from '../../common/middleware/auth.middleware';
import { authLimiter } from '../../common/middleware/rate-limiter.middleware';
import { refreshTokenService } from './refresh-token.service';
import { createResponse } from '../../common/types/api.response';
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '../../common/middleware/csrf.middleware';
import { clearFailedAttempts } from '../../common/services/lockout.service';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authenticate, requirePermission('USER_MANAGE'), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateMe);
router.put('/me/password', authenticate, AuthController.updateMyPassword);

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

        // Rotate CSRF token too
        const csrfToken = generateCsrfToken();
        setCsrfCookie(res, csrfToken);

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
        clearCsrfCookie(res);

        res.json(createResponse(true, null, 'Logged out successfully'));
    } catch (error) { next(error); }
});

// ── Admin: Unlock a locked account ──
// Clears the failed login attempt counter in Redis so the user can try again immediately.
// Only accessible by authenticated ADMIN users.
router.post('/unlock-account', authenticate, requirePermission('USER_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json(createResponse(false, null, 'Email is required'));
            return;
        }
        await clearFailedAttempts(email.toLowerCase().trim());
        res.json(createResponse(true, null, `Account ${email} has been unlocked successfully`));
    } catch (error) { next(error); }
});

export const authRoutes = router;
