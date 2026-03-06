
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
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

// ── Redis-backed permission cache (5-minute TTL) ──
// Eliminates a DB query on every single API call.
// Cache is invalidated when roles/permissions change, or on logout.

const AUTH_CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const AUTH_CACHE_PREFIX = 'auth:';

interface CachedAuth {
    role: string;
    permissions: string[];
    teamIds: string[];
}

/**
 * Invalidate cached auth for a specific user.
 * Call this when a user's role or permissions change, or on logout.
 */
export const invalidateAuthCache = async (userId: string): Promise<void> => {
    try {
        await redis.del(`${AUTH_CACHE_PREFIX}${userId}`);
        logger.debug('Auth cache invalidated', { userId });
    } catch (err) {
        logger.warn('Failed to invalidate auth cache', { userId, error: (err as Error).message });
    }
};

/**
 * Clear the entire auth cache.
 * Useful after bulk role/permission changes.
 */
export const clearAuthCache = async (): Promise<void> => {
    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${AUTH_CACHE_PREFIX}*`, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');
        logger.info('Auth cache cleared');
    } catch (err) {
        logger.warn('Failed to clear auth cache', { error: (err as Error).message });
    }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Read token from httpOnly cookie first, then fallback to Authorization header
    const token = req.cookies?.access_token
        || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        next(new UnauthorizedError('Authentication required'));
        return;
    }

    try {
        const decoded = JwtService.verify(token) as { userId: string };
        const userId = decoded.userId;

        // ── Check Redis cache first ──
        try {
            const cached = await redis.get(`${AUTH_CACHE_PREFIX}${userId}`);
            if (cached) {
                const parsed: CachedAuth = JSON.parse(cached);
                req.user = {
                    id: userId,
                    role: parsed.role,
                    permissions: parsed.permissions,
                    teamIds: parsed.teamIds,
                };
                next();
                return;
            }
        } catch (cacheErr) {
            // Redis failure is non-fatal — fall through to DB
            logger.warn('Redis cache read failed, falling back to DB', {
                userId,
                error: (cacheErr as Error).message,
            });
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
            await invalidateAuthCache(userId);
            next(new UnauthorizedError('User not found or inactive'));
            return;
        }

        const roleName = user.role?.name || 'VIEWER';
        const permissions = user.role?.permissions.map(p => p.code) || [];
        const teamIds = user.teamMemberships.map((t: { teamId: string }) => t.teamId);

        // ── Store in Redis cache ──
        try {
            const cachePayload: CachedAuth = { role: roleName, permissions, teamIds };
            await redis.set(
                `${AUTH_CACHE_PREFIX}${userId}`,
                JSON.stringify(cachePayload),
                'EX',
                AUTH_CACHE_TTL_SECONDS,
            );
        } catch (cacheErr) {
            // Redis failure is non-fatal — just log and continue
            logger.warn('Redis cache write failed', {
                userId,
                error: (cacheErr as Error).message,
            });
        }

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
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }
        // ADMIN role always has full access — no permission check needed
        if (req.user.role === 'ADMIN') {
            next();
            return;
        }
        if (!req.user.permissions.includes(requiredPermission)) {
            logger.warn('Permission denied', {
                userId: req.user.id,
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
