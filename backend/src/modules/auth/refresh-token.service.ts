
/**
 * Refresh Token Service
 * Implements token rotation: each refresh issues a new access + refresh token pair.
 * Old refresh tokens are revoked on use (rotation prevents replay attacks).
 * @module modules/auth/refresh-token.service
 */

import crypto from 'crypto';
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { AuthenticationError } from '../../common/errors/app.error';
import { JwtService } from '../../common/utils/jwt.utils';

export class RefreshTokenService {
    private readonly TOKEN_LENGTH = 64; // bytes
    private readonly EXPIRY_DAYS = 30;

    /**
     * Generate a new refresh token for a user
     */
    async generate(userId: string): Promise<string> {
        const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.EXPIRY_DAYS);

        await prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });

        return token;
    }

    /**
     * Refresh an access token using a valid refresh token
     * Implements token rotation: old token is revoked, new pair is issued
     */
    async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: {
                    include: {
                        role: {
                            include: { permissions: { select: { code: true } } },
                        },
                    },
                },
            },
        });

        if (!stored) {
            throw new AuthenticationError('Invalid refresh token');
        }

        if (stored.revokedAt) {
            // Token reuse detected — possible token theft. Revoke all tokens for this user.
            logger.warn('Refresh token reuse detected — revoking all tokens for user', { userId: stored.userId });
            await this.revokeAllForUser(stored.userId);
            throw new AuthenticationError('Token reuse detected. All sessions revoked — please log in again.');
        }

        if (new Date() > stored.expiresAt) {
            throw new AuthenticationError('Refresh token expired');
        }

        if (!stored.user.isActive) {
            throw new AuthenticationError('Account is inactive');
        }

        // Rotate: revoke old token, issue new pair
        await prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        // Generate new access token
        const accessToken = JwtService.sign({
            userId: stored.user.id,
            email: stored.user.email,
            role: stored.user.role?.name || 'OPERATOR',
        });

        // Generate new refresh token
        const newRefreshToken = await this.generate(stored.userId);

        logger.info('Token refreshed', { userId: stored.userId });

        return { token: accessToken, refreshToken: newRefreshToken };
    }

    /**
     * Revoke a specific refresh token
     */
    async revoke(token: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { token, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Revoke all refresh tokens for a user (logout everywhere)
     */
    async revokeAllForUser(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Cleanup expired tokens (run periodically)
     */
    async cleanup(): Promise<number> {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } },
                ],
            },
        });
        return result.count;
    }
}

export const refreshTokenService = new RefreshTokenService();
