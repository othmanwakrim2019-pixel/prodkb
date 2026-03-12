
import { prisma } from '../../common/utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors/app.error';

export class RoleService {
    async findAllRoles() {
        return prisma.role.findMany({
            include: {
                permissions: true,
                _count: { select: { users: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findAllPermissions() {
        return prisma.permission.findMany({
            orderBy: { code: 'asc' }
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
                    connect: data.permissionIds.map((id: string) => ({ id }))
                }
            },
            include: { permissions: true }
        });
    }

    async updateRole(id: string, data: { name?: string; description?: string | null; permissionIds: string[]; incidentScope?: string }) {
        const currentRole = await prisma.role.findUnique({ where: { id } });

        if (!currentRole) throw new NotFoundError('Role not found');
        if (currentRole.name === 'ADMIN') {
            throw new ForbiddenError('Cannot modify ADMIN role');
        }

        return prisma.role.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(data.incidentScope ? { incidentScope: data.incidentScope as any } : {}),
                permissions: {
                    set: [],
                    connect: data.permissionIds.map((pid: string) => ({ id: pid }))
                }
            },
            include: { permissions: true }
        });
    }

    async replaceRolePermissions(id: string, permissionIds: string[]) {
        return prisma.$transaction(async (tx) => {
            const currentRole = await tx.role.findUnique({
                where: { id },
                include: { permissions: true }
            });

            if (!currentRole) throw new NotFoundError('Role not found');
            if (currentRole.name === 'ADMIN') {
                throw new ForbiddenError('Cannot modify ADMIN role');
            }

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
        const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });

        if (!role) throw new NotFoundError('Role not found');
        if (role.name === 'ADMIN') {
            throw new ForbiddenError('Cannot delete ADMIN role');
        }
        if (role._count.users > 0) {
            throw new ValidationError('Cannot delete role assigned to users');
        }

        await prisma.role.delete({ where: { id } });
        return role;
    }

    // Helper for audit
    async findRoleById(id: string) {
        return prisma.role.findUnique({ where: { id }, include: { permissions: true } });
    }
}

export const roleService = new RoleService();
