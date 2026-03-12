import type { Request } from 'express';
import { JwtService } from '../utils/jwt.utils';
import { loadAuthUser } from './auth-context.service';
import type { AuthUser } from './auth.types';

export const extractAccessToken = (req: Request): string | null => {
    const bearerToken = req.header('Authorization')?.replace('Bearer ', '').trim();
    return req.cookies?.access_token || bearerToken || null;
};

export const resolveAuthUserFromRequest = async (req: Request): Promise<AuthUser | null> => {
    const token = extractAccessToken(req);
    if (!token) return null;

    const decoded = JwtService.verify(token) as { userId: string };
    if (!decoded.userId) return null;

    return loadAuthUser(decoded.userId);
};
