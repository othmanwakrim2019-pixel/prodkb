import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        permissions: string[];
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

        // Fetch fresh user data from DB to ensure permissions are up-to-date
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!user || user.isActive === false) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }

        const roleName = user.role?.name || 'VIEWER';
        const permissions = user.role?.permissions.map(p => p.code) || [];

        req.user = {
            id: user.id,
            role: roleName,
            permissions: permissions
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const checkPermission = (requiredPermission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.permissions.includes(requiredPermission)) {
            logger.warn('Permission denied', {
                userId: req.user?.id,
                requiredPermission,
                path: req.path
            });
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }
        next();
    };
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.warn('Authorization failed', {
                userId: req.user?.id,
                userRole: req.user?.role,
                requiredRoles: roles,
                path: req.path
            });
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
};
