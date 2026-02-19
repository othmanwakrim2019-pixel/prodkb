
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

// ── In-memory permission cache (5-minute TTL) ──
// Eliminates a DB query on every single API call.
// Cache is invalidated when roles/permissions change.

interface CachedAuth {
    role: string;
    permissions: string[];
    teamIds: string[];
    expiresAt: number;
}

const AUTH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const authCache = new Map<string, CachedAuth>();

/**
 * Invalidate cached auth for a specific user.
 * Call this when a user's role or permissions change.
 */
export const invalidateAuthCache = (userId: string) => {
    authCache.delete(userId);
};

/**
 * Clear the entire auth cache.
 * Useful after bulk role/permission changes.
 */
export const clearAuthCache = () => {
    authCache.clear();
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        next(new UnauthorizedError('Authentication required'));
        return;
    }

    try {
        const decoded = JwtService.verify(token) as { userId: string };
        const userId = decoded.userId;

        // ── Check cache first ──
        const cached = authCache.get(userId);
        const now = Date.now();

        if (cached && cached.expiresAt > now) {
            req.user = {
                id: userId,
                role: cached.role,
                permissions: cached.permissions,
                teamIds: cached.teamIds,
            };
            next();
            return;
        }

        // ── Cache miss — fetch from DB ──
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: { include: { permissions: true } },
                teamMemberships: { select: { teamId: true } }
            }
        });

        if (!user || user.isActive === false) {
            authCache.delete(userId);
            next(new UnauthorizedError('User not found or inactive'));
            return;
        }

        const roleName = user.role?.name || 'VIEWER';
        const permissions = user.role?.permissions.map((p: any) => p.code) || [];
        const teamIds = user.teamMemberships.map((t: any) => t.teamId);

        // ── Store in cache ──
        authCache.set(userId, {
            role: roleName,
            permissions,
            teamIds,
            expiresAt: now + AUTH_CACHE_TTL_MS,
        });

        req.user = {
            id: userId,
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
