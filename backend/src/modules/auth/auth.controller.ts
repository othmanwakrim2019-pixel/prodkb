
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
            res.json(createResponse(true, result, 'Login successful'));
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
