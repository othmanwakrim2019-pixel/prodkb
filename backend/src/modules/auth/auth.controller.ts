
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { userService } from '../users/user.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { logger } from '../../common/utils/logger';
import { createResponse } from '../../common/types/api.response';
import { ValidationError } from '../../common/errors/app.error';

const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    role: z.string().optional(),
    teamId: z.string().uuid().optional(),
    teamRole: z.string().optional(),
    isActive: z.boolean().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// ── Cookie configuration ──
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,          // HTTPS only in production
    sameSite: 'strict' as const,
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;       // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Registration request received', { email: req.body.email });
            const data = registerSchema.parse(req.body);
            const user = await authService.register(data);
            res.status(201).json(createResponse(true, user, 'User registered successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await authService.login(email, password);

            // Set access token as httpOnly cookie
            res.cookie(ACCESS_TOKEN_COOKIE, result.token, {
                ...COOKIE_OPTIONS,
                maxAge: ACCESS_TOKEN_MAX_AGE,
            });

            // Set refresh token as httpOnly cookie
            res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: REFRESH_TOKEN_MAX_AGE,
            });

            // Return user info (but NOT the tokens — they're in cookies now)
            res.json(createResponse(true, {
                user: result.user,
            }, 'Login successful'));
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?.id) throw new ValidationError('User not authenticated');

            const user = await userService.findByIdWithPermissions(req.user.id);
            res.json(createResponse(true, user));
        } catch (error) {
            next(error);
        }
    }
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS };
