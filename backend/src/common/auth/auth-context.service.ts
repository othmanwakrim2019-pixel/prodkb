import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import type { AuthUser, CachedAuthUser } from './auth.types';

const AUTH_CACHE_TTL_SECONDS = 5 * 60;
const AUTH_CACHE_PREFIX = 'auth:';

const getAuthCacheKey = (userId: string) => `${AUTH_CACHE_PREFIX}${userId}`;

const mapCachedAuthUser = (userId: string, cached: CachedAuthUser): AuthUser => ({
    id: userId,
    name: cached.name || 'Unknown',
    role: cached.role,
    permissions: cached.permissions,
    teamIds: cached.teamIds,
    incidentScope: cached.incidentScope ?? 'ALL',
});

export const invalidateAuthCache = async (userId: string): Promise<void> => {
    try {
        await redis.del(getAuthCacheKey(userId));
        logger.debug('Auth cache invalidated', { userId });
    } catch (err) {
        logger.warn('Failed to invalidate auth cache', { userId, error: (err as Error).message });
    }
};

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

export const loadAuthUser = async (userId: string): Promise<AuthUser | null> => {
    try {
        const cached = await redis.get(getAuthCacheKey(userId));
        if (cached) {
            return mapCachedAuthUser(userId, JSON.parse(cached) as CachedAuthUser);
        }
    } catch (cacheErr) {
        logger.warn('Redis cache read failed, falling back to DB', {
            userId,
            error: (cacheErr as Error).message,
        });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: { include: { permissions: true } },
            teamMemberships: { select: { teamId: true } },
        },
    });

    if (!user || user.isActive === false) {
        await invalidateAuthCache(userId);
        return null;
    }

    const authUser: AuthUser = {
        id: userId,
        name: user.name || 'Unknown',
        role: user.role?.name || 'VIEWER',
        permissions: user.role?.permissions.map((permission) => permission.code) || [],
        teamIds: user.teamMemberships.map((membership: { teamId: string }) => membership.teamId),
        incidentScope: (user.role as { incidentScope?: string } | null)?.incidentScope ?? 'ALL',
    };

    try {
        const cachePayload: CachedAuthUser = {
            name: authUser.name,
            role: authUser.role,
            permissions: authUser.permissions,
            teamIds: authUser.teamIds,
            incidentScope: authUser.incidentScope,
        };
        await redis.set(
            getAuthCacheKey(userId),
            JSON.stringify(cachePayload),
            'EX',
            AUTH_CACHE_TTL_SECONDS,
        );
    } catch (cacheErr) {
        logger.warn('Redis cache write failed', {
            userId,
            error: (cacheErr as Error).message,
        });
    }

    return authUser;
};
