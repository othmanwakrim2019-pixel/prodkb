import { prisma } from '../../../common/utils/prisma';
import { IRoleRepository } from '../domain/role.repository';

export class PrismaRoleRepository implements IRoleRepository {
    async findRoles() {
        return prisma.role.findMany({
            include: {
                permissions: true,
                _count: { select: { users: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findPermissions() {
        return prisma.permission.findMany({
            orderBy: { code: 'asc' },
        });
    }

    async createRole(data: { name: string; description?: string; permissionIds: string[]; incidentScope?: string }) {
        return prisma.role.create({
            data: {
                name: data.name,
                description: data.description,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                incidentScope: (data.incidentScope ?? 'ALL') as any,
                permissions: {
                    connect: data.permissionIds.map((id: string) => ({ id })),
                },
            },
            include: { permissions: true },
        });
    }

    async findRoleById(id: string) {
        return prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
    }

    async findRoleWithUsage(id: string) {
        return prisma.role.findUnique({
            where: { id },
            include: {
                permissions: true,
                _count: { select: { users: true } },
            },
        });
    }

    async updateRole(id: string, data: { name?: string; description?: string | null; permissionIds: string[]; incidentScope?: string }) {
        return prisma.role.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(data.incidentScope ? { incidentScope: data.incidentScope as any } : {}),
                permissions: {
                    set: [],
                    connect: data.permissionIds.map((permissionId: string) => ({ id: permissionId })),
                },
            },
            include: { permissions: true },
        });
    }

    async replaceRolePermissions(id: string, permissionIds: string[]) {
        return prisma.$transaction(async (tx) => {
            await tx.role.update({
                where: { id },
                data: {
                    permissions: {
                        set: [],
                    },
                },
            });

            return tx.role.update({
                where: { id },
                data: {
                    permissions: {
                        connect: permissionIds.map((permissionId) => ({ id: permissionId })),
                    },
                },
                include: { permissions: true },
            });
        });
    }

    async deleteRole(id: string) {
        return prisma.role.delete({ where: { id } });
    }
}

export const roleRepository = new PrismaRoleRepository();
