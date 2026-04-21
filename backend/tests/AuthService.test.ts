import bcrypt from 'bcryptjs';
import { authService } from '../src/modules/auth/application/auth.service';
import { authRepository } from '../src/modules/auth/infrastructure/prisma-auth.repository';
import { refreshTokenService } from '../src/modules/auth/application/refresh-token.service';
import { JwtService } from '../src/common/utils/jwt.utils';
import { clearFailedAttempts, isAccountLocked, recordFailedAttempt } from '../src/common/services/lockout.service';

jest.mock('bcryptjs');
jest.mock('../src/modules/auth/infrastructure/prisma-auth.repository', () => ({
    authRepository: {
        findUserByEmail: jest.fn(),
        findRoleByName: jest.fn(),
        findTeamById: jest.fn(),
        createUserWithOptionalTeam: jest.fn(),
        findUserForLogin: jest.fn(),
    },
}));
jest.mock('../src/modules/auth/application/refresh-token.service', () => ({
    refreshTokenService: {
        generate: jest.fn(),
    },
}));
jest.mock('../src/common/utils/jwt.utils', () => ({
    JwtService: {
        sign: jest.fn(),
    },
}));
jest.mock('../src/common/services/lockout.service', () => ({
    isAccountLocked: jest.fn(),
    recordFailedAttempt: jest.fn(),
    clearFailedAttempts: jest.fn(),
}));
jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (isAccountLocked as jest.Mock).mockResolvedValue(0);
        (recordFailedAttempt as jest.Mock).mockResolvedValue({ locked: false, attemptsLeft: 4 });
        (clearFailedAttempts as jest.Mock).mockResolvedValue(undefined);
    });

    describe('register', () => {
        it('rejects duplicate email addresses', async () => {
            (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing-user' });

            await expect(authService.register({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'VIEWER',
            })).rejects.toThrow('Email already registered');
        });

        it('rejects weak passwords', async () => {
            (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

            await expect(authService.register({
                name: 'Test User',
                email: 'test@example.com',
                password: 'short',
                role: 'VIEWER',
            })).rejects.toThrow('Password must be at least 8 characters');
        });

        it('rejects invalid teams', async () => {
            (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (authRepository.findRoleByName as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'VIEWER' });
            (authRepository.findTeamById as jest.Mock).mockResolvedValue(null);

            await expect(authService.register({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'VIEWER',
                teamId: 'team-1',
            })).rejects.toThrow('Invalid team ID');
        });

        it('registers a valid user and returns the public shape', async () => {
            const createdAt = new Date('2026-03-23T10:00:00.000Z');

            (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (authRepository.findRoleByName as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'VIEWER' });
            (authRepository.findTeamById as jest.Mock).mockResolvedValue({ id: 'team-1' });
            (authRepository.createUserWithOptionalTeam as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                isActive: true,
                password: 'hashed-password',
                createdAt,
                role: { name: 'VIEWER' },
            });

            const result = await authService.register({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'VIEWER',
                teamId: 'team-1',
                teamRole: 'MEMBER',
            });

            expect(authRepository.createUserWithOptionalTeam).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com',
                password: 'hashed-password',
                roleId: 'role-1',
                teamId: 'team-1',
            }));
            expect(result).toEqual({
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                isActive: true,
                role: 'VIEWER',
                createdAt,
            });
        });
    });

    describe('login', () => {
        it('rejects locked accounts before loading the user', async () => {
            (isAccountLocked as jest.Mock).mockResolvedValue(120);

            await expect(authService.login('test@example.com', 'password123'))
                .rejects.toThrow('Account is temporarily locked. Try again in 2 minute(s).');

            expect(authRepository.findUserForLogin).not.toHaveBeenCalled();
        });

        it('records failed attempts when the user does not exist', async () => {
            (authRepository.findUserForLogin as jest.Mock).mockResolvedValue(null);

            await expect(authService.login('missing@example.com', 'password123'))
                .rejects.toThrow('Invalid email or password');

            expect(recordFailedAttempt).toHaveBeenCalledWith('missing@example.com');
        });

        it('locks after too many failed password attempts', async () => {
            (authRepository.findUserForLogin as jest.Mock).mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                password: 'hashed-password',
                isActive: true,
                role: { name: 'ADMIN', permissions: [] },
                createdAt: new Date(),
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (recordFailedAttempt as jest.Mock).mockResolvedValue({ locked: true, attemptsLeft: 0 });

            await expect(authService.login('test@example.com', 'wrong-password'))
                .rejects.toThrow('Too many failed attempts. Account is locked for 15 minutes.');
        });

        it('rejects inactive users', async () => {
            (authRepository.findUserForLogin as jest.Mock).mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                password: 'hashed-password',
                isActive: false,
                role: { name: 'VIEWER', permissions: [] },
                createdAt: new Date(),
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(authService.login('test@example.com', 'password123'))
                .rejects.toThrow('Account is inactive');
        });

        it('returns access token, refresh token, and permissions for valid users', async () => {
            const createdAt = new Date('2026-03-23T10:00:00.000Z');
            (authRepository.findUserForLogin as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'hashed-password',
                isActive: true,
                createdAt,
                role: {
                    name: 'ADMIN',
                    permissions: [{ code: 'USER_MANAGE' }, { code: 'INCIDENT_READ' }],
                },
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (JwtService.sign as jest.Mock).mockReturnValue('access-token');
            (refreshTokenService.generate as jest.Mock).mockResolvedValue('refresh-token');

            const result = await authService.login('admin@example.com', 'password123');

            expect(clearFailedAttempts).toHaveBeenCalledWith('admin@example.com');
            expect(JwtService.sign).toHaveBeenCalledWith({
                userId: 'user-1',
                email: 'admin@example.com',
                role: 'ADMIN',
            });
            expect(refreshTokenService.generate).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({
                token: 'access-token',
                refreshToken: 'refresh-token',
                user: {
                    id: 'user-1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    isActive: true,
                    role: 'ADMIN',
                    createdAt,
                    permissions: ['USER_MANAGE', 'INCIDENT_READ'],
                },
            });
        });
    });
});
