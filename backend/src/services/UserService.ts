/**
 * User Service - Business logic for user management
 * @module services/UserService
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import { env } from '../config/env';
import type { CreateUserDTO, UpdateUserDTO, IUser, IUserPublic } from '../types';

/**
 * JWT payload structure
 */
interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Login response
 */
interface LoginResponse {
    token: string;
    user: IUserPublic & { permissions: string[] };
}

/**
 * Service class for user-related business logic
 */
export class UserService {
    private readonly SALT_ROUNDS = 10;
    private readonly JWT_EXPIRES_IN = '24h';

    /**
     * Register a new user
     * @param data - User registration data
     */
    async register(data: CreateUserDTO): Promise<IUserPublic> {
        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new ConflictError('Email already registered');
        }

        // Validate password strength
        if (data.password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

        // Find or create role
        let roleId: string | null = null;
        if (data.role) {
            const role = await prisma.role.findUnique({ where: { name: data.role } });
            if (role) {
                roleId = role.id;
            }
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                roleId,
            },
            include: {
                role: { select: { id: true, name: true } },
            },
        });

        logger.info('User registered', { userId: user.id, email: user.email });

        return this.toPublicUser(user);
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        // Find user by email
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
            logger.warn('Login attempt failed: user not found', { email });
            throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            logger.warn('Login attempt failed: invalid password', { userId: user.id });
            throw new AuthenticationError('Invalid email or password');
        }

        // Check if account is active
        if (!user.isActive) {
            logger.warn('Login attempt failed: account inactive', { userId: user.id });
            throw new AuthenticationError('Account is inactive');
        }

        // Generate JWT
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role?.name || 'OPERATOR',
        };

        const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });

        // Extract permissions
        const permissions = user.role?.permissions?.map(p => p.code) || [];

        logger.info('User logged in successfully', { userId: user.id });

        return {
            token,
            user: {
                ...this.toPublicUser(user),
                permissions,
            },
        };
    }

    /**
     * Get user by ID
     * @param id - User ID
     */
    async findById(id: string): Promise<IUserPublic> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                role: { select: { id: true, name: true } },
            },
        });

        if (!user) {
            throw new NotFoundError('User');
        }

        return this.toPublicUser(user);
    }

    /**
     * Get user with permissions
     * @param id - User ID
     */
    async findByIdWithPermissions(id: string): Promise<IUserPublic & { permissions: string[] }> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        permissions: { select: { code: true } },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundError('User');
        }

        const permissions = user.role?.permissions?.map(p => p.code) || [];

        return {
            ...this.toPublicUser(user),
            permissions,
        };
    }

    /**
     * Get all users
     */
    async findAll(): Promise<IUserPublic[]> {
        const users = await prisma.user.findMany({
            include: {
                role: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return users.map(u => this.toPublicUser(u));
    }

    /**
     * Get all users with team memberships (Admin view)
     */
    async findAllDetailed() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { id: true, name: true } },
                isActive: true,
                createdAt: true,
                teamMemberships: {
                    select: {
                        team: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Update a user
     * @param id - User ID
     * @param data - Update data
     */
    async update(id: string, data: UpdateUserDTO): Promise<IUserPublic> {
        await this.findById(id); // Throws if not found

        const updateData: Record<string, unknown> = { ...data };

        // Handle role update
        if (data.role) {
            const role = await prisma.role.findUnique({ where: { name: data.role } });
            if (role) {
                updateData.roleId = role.id;
            }
            delete updateData.role;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                role: { select: { id: true, name: true } },
            },
        });

        logger.info('User updated', { userId: id, changes: Object.keys(data) });

        return this.toPublicUser(user);
    }

    /**
     * Delete a user
     * @param id - User ID
     */
    async delete(id: string): Promise<void> {
        await this.findById(id); // Throws if not found

        await prisma.user.delete({ where: { id } });

        logger.info('User deleted', { userId: id });
    }

    /**
     * Verify JWT token and return user
     * @param token - JWT token
     */
    async verifyToken(token: string): Promise<IUserPublic & { permissions: string[] }> {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
            return this.findByIdWithPermissions(decoded.userId);
        } catch (error) {
            console.error('VerifyToken error:', error);
            throw new AuthenticationError('Invalid or expired token');
        }
    }

    /**
     * Convert user to public representation (no password)
     */
    private toPublicUser(user: {
        id: string;
        name: string;
        email: string;
        isActive: boolean;
        role?: { id: string; name: string } | null;
        createdAt: Date;
    }): IUserPublic {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isActive: user.isActive,
            role: user.role?.name || 'VIEWER',
            createdAt: user.createdAt,
        };
    };
}

// Export singleton instance
export const userService = new UserService();
