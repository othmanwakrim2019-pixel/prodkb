/**
 * Refresh Token Service
 * Implements token rotation: each refresh issues a new access + refresh token pair.
 * Old refresh tokens are revoked on use (rotation prevents replay attacks).
 * @module modules/auth/refresh-token.service
 */

import crypto from 'crypto';
import { logger } from '../../../common/utils/logger';
import { AuthenticationError } from '../../../common/errors/app.error';
import { JwtService } from '../../../common/utils/jwt.utils';
import { authRepository } from '../infrastructure/prisma-auth.repository';

export class RefreshTokenService {
    private readonly TOKEN_LENGTH = 64;
    private readonly EXPIRY_DAYS = 30;

    async generate(userId: string): Promise<string> {
        const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.EXPIRY_DAYS);

        await authRepository.createRefreshToken(token, userId, expiresAt);
        return token;
    }

    async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        const stored = await authRepository.findRefreshToken(refreshToken);

        if (!stored) {
            throw new AuthenticationError('Invalid refresh token');
        }

        if (stored.revokedAt) {
            logger.warn('Refresh token reuse detected - revoking all tokens for user', { userId: stored.userId });
            await this.revokeAllForUser(stored.userId);
            throw new AuthenticationError('Token reuse detected. All sessions revoked - please log in again.');
        }

        if (new Date() > stored.expiresAt) {
            throw new AuthenticationError('Refresh token expired');
        }

        if (!stored.user.isActive) {
            throw new AuthenticationError('Account is inactive');
        }

        await authRepository.revokeRefreshTokenById(stored.id);

        const accessToken = JwtService.sign({
            userId: stored.user.id,
            email: stored.user.email,
            role: stored.user.role?.name || 'OPERATOR',
        });

        const newRefreshToken = await this.generate(stored.userId);

        logger.info('Token refreshed', { userId: stored.userId });
        return { token: accessToken, refreshToken: newRefreshToken };
    }

    async revoke(token: string): Promise<void> {
        await authRepository.revokeRefreshTokenValue(token);
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await authRepository.revokeAllRefreshTokensForUser(userId);
    }

    async cleanup(): Promise<number> {
        const result = await authRepository.deleteExpiredOrRevokedRefreshTokens();
        return result.count;
    }
}

export const refreshTokenService = new RefreshTokenService();
