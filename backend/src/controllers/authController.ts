import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/UserService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

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

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('Registration request received', {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            teamId: req.body.teamId,
            teamRole: req.body.teamRole,
            isActive: req.body.isActive
        });
        const data = registerSchema.parse(req.body);
        const user = await userService.register(data);
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await userService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const user = await userService.findByIdWithPermissions(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};
