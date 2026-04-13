/**
 * User Service - User management logic
 * @module modules/users/user.service
 */

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError, AuthenticationError } from '../../common/errors/app.error';
import type { UpdateUserDTO, IUserPublic } from '../../types';
import { userRepository } from './repositories/user.repository';

export class UserService {
    private readonly SALT_ROUNDS = 10;

    async findAll(): Promise<IUserPublic[]> {
        const users = await userRepository.findAllUsers();
        return users.map((user) => this.toPublicUser(user));
    }

    async findAllDetailed() {
        return userRepository.findAllUsersDetailed();
    }

    async findById(id: string): Promise<IUserPublic> {
        const user = await userRepository.findUserById(id);
        if (!user) throw new NotFoundError('User not found');
        return this.toPublicUser(user);
    }

    async update(id: string, data: UpdateUserDTO): Promise<IUserPublic> {
        await this.findById(id);

        let roleId: string | undefined;
        if (data.role) {
            const role = await userRepository.findRoleByName(data.role);
            if (role) {
                roleId = role.id;
            }
        }

        const updateData: Prisma.UserUncheckedUpdateInput = {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(roleId !== undefined && { roleId }),
        };

        const user = await userRepository.updateUser(id, updateData);
        logger.info('User updated', { userId: id, changes: Object.keys(data) });
        return this.toPublicUser(user);
    }

    async delete(id: string): Promise<void> {
        const user = await userRepository.findUserWithUsage(id);
        if (!user) throw new NotFoundError('User not found');

        const reasons: string[] = [];
        if (user._count.createdIncidents > 0) reasons.push(`${user._count.createdIncidents} incident(s) créé(s)`);
        if (user._count.teamMemberships > 0) reasons.push(`${user._count.teamMemberships} équipe(s)`);

        if (reasons.length > 0) {
            throw new ValidationError(
                `Impossible de supprimer l'utilisateur "${user.name}" car il est lié à : ${reasons.join(', ')}. Veuillez d'abord retirer ces associations.`
            );
        }

        await userRepository.deleteUser(id);
        logger.info('User deleted', { userId: id });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await userRepository.findUserCredentials(userId);
        if (!user) throw new NotFoundError('User not found');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) throw new AuthenticationError('Current password is incorrect');
        if (newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters');

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await userRepository.updateUserPassword(userId, hashedPassword);
        logger.info('Password changed', { userId });
    }

    async adminResetPassword(targetUserId: string, newPassword: string): Promise<void> {
        const user = await userRepository.findUserCredentials(targetUserId);
        if (!user) throw new NotFoundError('User not found');
        if (newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters');

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await userRepository.updateUserPassword(targetUserId, hashedPassword);
        logger.info('Admin reset password for user', { targetUserId });
    }

    async findByIdWithPermissions(id: string): Promise<IUserPublic & { permissions: string[] }> {
        const user = await userRepository.findUserWithPermissions(id);
        if (!user) throw new NotFoundError('User not found');

        const permissions = user.role?.permissions?.map((permission) => permission.code) || [];
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
    }
}

export const userService = new UserService();
