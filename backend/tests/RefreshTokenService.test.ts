import crypto from 'crypto';
import { refreshTokenService } from '../src/modules/auth/application/refresh-token.service';
import { authRepository } from '../src/modules/auth/infrastructure/prisma-auth.repository';
import { JwtService } from '../src/common/utils/jwt.utils';

jest.mock('crypto', () => ({
    randomBytes: jest.fn(),
}));
jest.mock('../src/modules/auth/infrastructure/prisma-auth.repository', () => ({
    authRepository: {
        createRefreshToken: jest.fn(),
        findRefreshToken: jest.fn(),
        revokeRefreshTokenById: jest.fn(),
        revokeRefreshTokenValue: jest.fn(),
        revokeAllRefreshTokensForUser: jest.fn(),
        deleteExpiredOrRevokedRefreshTokens: jest.fn(),
    },
}));
jest.mock('../src/common/utils/jwt.utils', () => ({
    JwtService: {
        sign: jest.fn(),
    },
}));
jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('RefreshTokenService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generate', () => {
        it('creates a refresh token with an expiry date', async () => {
            (crypto.randomBytes as jest.Mock).mockReturnValue({
                toString: jest.fn().mockReturnValue('generated-token'),
            });
            (authRepository.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const token = await refreshTokenService.generate('user-1');

            expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
                'generated-token',
                'user-1',
                expect.any(Date),
            );
            expect(token).toBe('generated-token');
        });
    });

    describe('refresh', () => {
        it('rejects missing refresh tokens', async () => {
            (authRepository.findRefreshToken as jest.Mock).mockResolvedValue(null);

            await expect(refreshTokenService.refresh('missing-token'))
                .rejects.toThrow('Invalid refresh token');
        });

        it('revokes all sessions when a reused token is detected', async () => {
            (authRepository.findRefreshToken as jest.Mock).mockResolvedValue({
                id: 'rt-1',
                userId: 'user-1',
                revokedAt: new Date(),
                expiresAt: new Date('2026-04-01T00:00:00.000Z'),
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    isActive: true,
                    role: { name: 'ADMIN' },
                },
            });

            await expect(refreshTokenService.refresh('reused-token'))
                .rejects.toThrow('Token reuse detected. All sessions revoked - please log in again.');

            expect(authRepository.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('user-1');
        });

        it('rejects expired tokens', async () => {
            (authRepository.findRefreshToken as jest.Mock).mockResolvedValue({
                id: 'rt-1',
                userId: 'user-1',
                revokedAt: null,
                expiresAt: new Date('2020-01-01T00:00:00.000Z'),
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    isActive: true,
                    role: { name: 'ADMIN' },
                },
            });

            await expect(refreshTokenService.refresh('expired-token'))
                .rejects.toThrow('Refresh token expired');
        });

        it('rejects inactive users', async () => {
            (authRepository.findRefreshToken as jest.Mock).mockResolvedValue({
                id: 'rt-1',
                userId: 'user-1',
                revokedAt: null,
                expiresAt: new Date('2099-01-01T00:00:00.000Z'),
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    isActive: false,
                    role: { name: 'ADMIN' },
                },
            });

            await expect(refreshTokenService.refresh('inactive-token'))
                .rejects.toThrow('Account is inactive');
        });

        it('rotates valid refresh tokens', async () => {
            jest.spyOn(refreshTokenService, 'generate').mockResolvedValue('new-refresh-token');
            (authRepository.findRefreshToken as jest.Mock).mockResolvedValue({
                id: 'rt-1',
                userId: 'user-1',
                revokedAt: null,
                expiresAt: new Date('2099-01-01T00:00:00.000Z'),
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    isActive: true,
                    role: { name: 'ADMIN' },
                },
            });
            (JwtService.sign as jest.Mock).mockReturnValue('new-access-token');
            (authRepository.revokeRefreshTokenById as jest.Mock).mockResolvedValue(undefined);

            const result = await refreshTokenService.refresh('valid-token');

            expect(authRepository.revokeRefreshTokenById).toHaveBeenCalledWith('rt-1');
            expect(JwtService.sign).toHaveBeenCalledWith({
                userId: 'user-1',
                email: 'user@example.com',
                role: 'ADMIN',
            });
            expect(result).toEqual({
                token: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });
        });
    });

    describe('maintenance helpers', () => {
        it('revokes a single token', async () => {
            (authRepository.revokeRefreshTokenValue as jest.Mock).mockResolvedValue(undefined);

            await refreshTokenService.revoke('token-value');

            expect(authRepository.revokeRefreshTokenValue).toHaveBeenCalledWith('token-value');
        });

        it('returns cleanup count', async () => {
            (authRepository.deleteExpiredOrRevokedRefreshTokens as jest.Mock).mockResolvedValue({ count: 7 });

            await expect(refreshTokenService.cleanup()).resolves.toBe(7);
        });
    });
});
