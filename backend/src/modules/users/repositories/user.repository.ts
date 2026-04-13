import { Prisma } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';

const userRoleInclude = {
    role: { select: { id: true, name: true } },
} as const;

export class UserRepository {
    async findAllUsers() {
        return prisma.user.findMany({
            include: userRoleInclude,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllUsersDetailed() {
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
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: userRoleInclude,
        });
    }

    async findRoleByName(name: string) {
        return prisma.role.findUnique({ where: { name } });
    }

    async updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            include: userRoleInclude,
        });
    }

    async findUserWithUsage(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        createdIncidents: true,
                        teamMemberships: true,
                    },
                },
            },
        });
    }

    async deleteUser(id: string) {
        return prisma.user.delete({ where: { id } });
    }

    async findUserCredentials(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }

    async updateUserPassword(id: string, password: string) {
        return prisma.user.update({
            where: { id },
            data: { password },
        });
    }

    async findUserWithPermissions(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        permissions: { select: { code: true } },
                    },
                },
            },
        });
    }
}

export const userRepository = new UserRepository();
