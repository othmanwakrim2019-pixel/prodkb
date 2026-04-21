import { NotFoundError, ForbiddenError, ValidationError } from '../../../common/errors/app.error';
import { roleRepository } from '../infrastructure/prisma-role.repository';

export class RoleService {
    async findAllRoles() {
        return roleRepository.findRoles();
    }

    async findAllPermissions() {
        return roleRepository.findPermissions();
    }

    async createRole(data: { name: string; description?: string; permissionIds: string[]; incidentScope?: string }) {
        return roleRepository.createRole(data);
    }

    async updateRole(id: string, data: { name?: string; description?: string | null; permissionIds: string[]; incidentScope?: string }) {
        const currentRole = await roleRepository.findRoleById(id);
        if (!currentRole) throw new NotFoundError('Role not found');
        if (currentRole.name === 'ADMIN') {
            throw new ForbiddenError('Cannot modify ADMIN role');
        }

        return roleRepository.updateRole(id, data);
    }

    async replaceRolePermissions(id: string, permissionIds: string[]) {
        const currentRole = await roleRepository.findRoleById(id);
        if (!currentRole) throw new NotFoundError('Role not found');
        if (currentRole.name === 'ADMIN') {
            throw new ForbiddenError('Cannot modify ADMIN role');
        }

        return roleRepository.replaceRolePermissions(id, permissionIds);
    }

    async deleteRole(id: string) {
        const role = await roleRepository.findRoleWithUsage(id);
        if (!role) throw new NotFoundError('Role not found');
        if (role.name === 'ADMIN') {
            throw new ForbiddenError('Cannot delete ADMIN role');
        }
        if (role._count.users > 0) {
            throw new ValidationError('Cannot delete role assigned to users');
        }

        await roleRepository.deleteRole(id);
        return role;
    }

    async findRoleById(id: string) {
        return roleRepository.findRoleById(id);
    }
}

export const roleService = new RoleService();
