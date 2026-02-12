
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { JwtService } from '../utils/jwt.utils';
import { AppError, UnauthorizedError, ForbiddenError } from '../errors/app.error';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        permissions: string[];
        teamIds: string[];
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        next(new UnauthorizedError('Authentication required'));
        return;
    }

    try {
        const decoded = JwtService.verify(token) as { userId: string };

        // Fetch fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                role: { include: { permissions: true } },
                teamMemberships: { select: { teamId: true } }
            }
        });

        if (!user || user.isActive === false) {
            next(new UnauthorizedError('User not found or inactive'));
            return;
        }

        const roleName = user.role?.name || 'VIEWER';
        const permissions = user.role?.permissions.map((p: any) => p.code) || [];
        const teamIds = user.teamMemberships.map((t: any) => t.teamId);

        req.user = {
            id: user.id,
            role: roleName,
            permissions: permissions,
            teamIds: teamIds
        };

        next();
    } catch (error) {
        next(error);
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
            next(new ForbiddenError(`Insufficient permissions: ${requiredPermission}`));
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
            next(new ForbiddenError());
            return;
        }
        next();
    };
};
