
import bcrypt from 'bcryptjs';
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { AuthenticationError, ConflictError, ValidationError, NotFoundError } from '../../common/errors/app.error';
import { JwtService } from '../../common/utils/jwt.utils';
import { refreshTokenService } from './refresh-token.service';
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from '../../common/services/lockout.service';
import type { CreateUserDTO, IUserPublic } from '../../types';

export class AuthService {
    private readonly SALT_ROUNDS = 10;

    /**
     * Register a new user
     */
    async register(data: CreateUserDTO): Promise<IUserPublic> {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new ConflictError('Email already registered');
        }

        if (data.password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

        let roleId: string | null = null;
        if (data.role) {
            const role = await prisma.role.findUnique({ where: { name: data.role } });
            if (role) roleId = role.id;
        }

        // Validate team if provided
        if (data.teamId) {
            const team = await prisma.team.findUnique({ where: { id: data.teamId } });
            if (!team) throw new ValidationError('Invalid team ID');
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: hashedPassword,
                    roleId,
                    isActive: data.isActive !== undefined ? data.isActive : true,
                },
                include: {
                    role: { select: { id: true, name: true } },
                },
            });

            if (data.teamId) {
                await tx.teamMember.create({
                    data: {
                        userId: user.id,
                        teamId: data.teamId,
                        role: data.teamRole || 'MEMBER',
                    },
                });
            }

            return user;
        });

        logger.info('User registered', { userId: result.id, email: result.email });

        return this.toPublicUser(result);
    }

    /**
     * Login user
     */
    async login(email: string, password: string) {
        // ── Account lockout check ──
        const lockoutRemaining = await isAccountLocked(email);
        if (lockoutRemaining > 0) {
            const minutes = Math.ceil(lockoutRemaining / 60);
            throw new AuthenticationError(`Account is temporarily locked. Try again in ${minutes} minute(s).`);
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: { select: { code: true } },
                    },
                },
            },
        });

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

        // ── Successful login — clear lockout counter ──
        await clearFailedAttempts(email);

        // Generate JWT using JwtService
        const token = JwtService.sign({
            userId: user.id,
            email: user.email,
            role: user.role?.name || 'OPERATOR', // Fallback role
        });

        const permissions = user.role?.permissions?.map(p => p.code) || [];

        // Generate refresh token for token rotation
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
