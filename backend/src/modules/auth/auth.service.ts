import bcrypt from 'bcryptjs';
import { logger } from '../../common/utils/logger';
import { AuthenticationError, ConflictError, ValidationError } from '../../common/errors/app.error';
import { JwtService } from '../../common/utils/jwt.utils';
import { refreshTokenService } from './refresh-token.service';
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from '../../common/services/lockout.service';
import type { CreateUserDTO, IUserPublic } from '../../types';
import { authRepository } from './repositories/auth.repository';

export class AuthService {
    private readonly SALT_ROUNDS = 10;

    async register(data: CreateUserDTO): Promise<IUserPublic> {
        const existing = await authRepository.findUserByEmail(data.email);
        if (existing) {
            throw new ConflictError('Email already registered');
        }

        if (data.password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

        let roleId: string | null = null;
        if (data.role) {
            const role = await authRepository.findRoleByName(data.role);
            if (role) roleId = role.id;
        }

        if (data.teamId) {
            const team = await authRepository.findTeamById(data.teamId);
            if (!team) throw new ValidationError('Invalid team ID');
        }

        const result = await authRepository.createUserWithOptionalTeam({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            roleId,
            isActive: data.isActive !== undefined ? data.isActive : true,
            teamId: data.teamId,
            teamRole: data.teamRole,
        });

        logger.info('User registered', { userId: result.id, email: result.email });
        return this.toPublicUser(result);
    }

    async login(email: string, password: string) {
        const lockoutRemaining = await isAccountLocked(email);
        if (lockoutRemaining > 0) {
            const minutes = Math.ceil(lockoutRemaining / 60);
            throw new AuthenticationError(`Account is temporarily locked. Try again in ${minutes} minute(s).`);
        }

        const user = await authRepository.findUserForLogin(email);
        if (!user) {
            await recordFailedAttempt(email);
            throw new AuthenticationError('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            const result = await recordFailedAttempt(email);
            if (result.locked) {
                throw new AuthenticationError('Too many failed attempts. Account is locked for 15 minutes.');
            }
            throw new AuthenticationError(`Invalid email or password. ${result.attemptsLeft} attempt(s) remaining.`);
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is inactive');
        }

        await clearFailedAttempts(email);

        const token = JwtService.sign({
            userId: user.id,
            email: user.email,
            role: user.role?.name || 'OPERATOR',
        });

        const permissions = user.role?.permissions?.map((permission) => permission.code) || [];
        const refreshToken = await refreshTokenService.generate(user.id);

        return {
            token,
            refreshToken,
            user: {
                ...this.toPublicUser(user),
                permissions,
            },
        };
    }

    private toPublicUser(user: { id: string; name: string; email: string; isActive: boolean; role?: { name: string } | null; createdAt: Date }): IUserPublic {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isActive: user.isActive,
            role: user.role?.name || 'VIEWER',
            createdAt: user.createdAt,
        };
    }
}

export const authService = new AuthService();
