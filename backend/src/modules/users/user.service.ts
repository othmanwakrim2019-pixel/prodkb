
/**
 * User Service - User management logic
 * @module modules/users/user.service
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError, AuthenticationError } from '../../common/errors/app.error';
import type { UpdateUserDTO, IUserPublic } from '../../types';

export class UserService {
    private readonly SALT_ROUNDS = 10;

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
     * Get all users with details (for Admin)
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
                        role: true,
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
     * Get user by ID
     */
    async findById(id: string): Promise<IUserPublic> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                role: { select: { id: true, name: true } },
            },
        });

        if (!user) throw new NotFoundError('User not found');

        return this.toPublicUser(user);
    }

    /**
     * Update a user
     */
    async update(id: string, data: UpdateUserDTO): Promise<IUserPublic> {
        await this.findById(id);

        const updateData: Record<string, unknown> = { ...data };

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
     */
    async delete(id: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        createdIncidents: true,
                        teamMemberships: true,
                    }
                }
            }
        });
        if (!user) throw new NotFoundError('User not found');

        const reasons: string[] = [];
        if (user._count.createdIncidents > 0) reasons.push(`${user._count.createdIncidents} incident(s) créé(s)`);
        if (user._count.teamMemberships > 0) reasons.push(`${user._count.teamMemberships} équipe(s)`);

        if (reasons.length > 0) {
            throw new ValidationError(
                `Impossible de supprimer l'utilisateur "${user.name}" car il est lié à : ${reasons.join(', ')}. Veuillez d'abord retirer ces associations.`
            );
        }

        await prisma.user.delete({ where: { id } });
        logger.info('User deleted', { userId: id });
    }

    /**
     * Change password
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('User not found');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) throw new AuthenticationError('Current password is incorrect');

        if (newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters');

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        logger.info('Password changed', { userId });
    }

    /**
     * Admin reset password — forces a new password without requiring the old one.
     * Only callable by ADMIN users from the user management UI.
     */
    async adminResetPassword(targetUserId: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) throw new NotFoundError('User not found');

        if (newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters');

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await prisma.user.update({
            where: { id: targetUserId },
            data: { password: hashedPassword },
        });

        logger.info('Admin reset password for user', { targetUserId });
    }

    /**
     * Get user with permissions (internal use)
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

        if (!user) throw new NotFoundError('User not found');

        const permissions = user.role?.permissions?.map(p => p.code) || [];

        return {
            ...this.toPublicUser(user),
            permissions,
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
    };
}

export const userService = new UserService();
