import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { UnauthorizedError, ForbiddenError } from '../errors/app.error';
import { hasPermission, hasRole } from '../auth/authorization.policy';
import { clearAuthCache, invalidateAuthCache } from '../auth/auth-context.service';
import { extractAccessToken, resolveAuthUserFromRequest } from '../auth/auth-request.service';
import type { AuthUser } from '../auth/auth.types';

export { clearAuthCache, invalidateAuthCache } from '../auth/auth-context.service';

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!extractAccessToken(req)) {
        next(new UnauthorizedError('Authentication required'));
        return;
    }

    try {
        const authUser = await resolveAuthUserFromRequest(req);
        if (!authUser) {
            next(new UnauthorizedError('User not found or inactive'));
            return;
        }

        req.user = authUser;
        next();
    } catch (error) {
        next(error);
    }
};

export const requirePermission = (requiredPermission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            const isAuthenticated = await new Promise<boolean>((resolve) => {
                authenticate(req, res, (error?: unknown) => {
                    if (error || !req.user) {
                        resolve(false);
                        return;
                    }

                    resolve(true);
                });
            });

            if (!isAuthenticated || !req.user) {
                res.status(401).json({ status: 401, message: 'Unauthenticated' });
                return;
            }
        }

        if (hasPermission(req.user, requiredPermission)) {
            next();
            return;
        }

        logger.warn('Permission denied', {
            userId: req.user.id,
            requiredPermission,
            path: req.path
        });
        res.status(403).json({ status: 403, message: 'Forbidden' });
    };
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!hasRole(req.user, roles)) {
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
