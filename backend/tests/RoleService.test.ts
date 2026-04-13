import { roleService } from '../src/modules/roles/role.service';
import { roleRepository } from '../src/modules/roles/repositories/role.repository';

jest.mock('../src/modules/roles/repositories/role.repository', () => ({
    roleRepository: {
        findRoles: jest.fn(),
        findPermissions: jest.fn(),
        createRole: jest.fn(),
        findRoleById: jest.fn(),
        updateRole: jest.fn(),
        replaceRolePermissions: jest.fn(),
        findRoleWithUsage: jest.fn(),
        deleteRole: jest.fn(),
    },
}));

describe('RoleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('read operations', () => {
        it('returns all roles', async () => {
            (roleRepository.findRoles as jest.Mock).mockResolvedValue([{ id: 'role-1', name: 'EDITOR' }]);

            await expect(roleService.findAllRoles()).resolves.toEqual([{ id: 'role-1', name: 'EDITOR' }]);
        });

        it('returns all permissions', async () => {
            (roleRepository.findPermissions as jest.Mock).mockResolvedValue([{ id: 'perm-1', code: 'USERS_READ' }]);

            await expect(roleService.findAllPermissions()).resolves.toEqual([{ id: 'perm-1', code: 'USERS_READ' }]);
        });

        it('returns a role by id', async () => {
            (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ id: 'role-2', name: 'EDITOR' });

            await expect(roleService.findRoleById('role-2')).resolves.toEqual({ id: 'role-2', name: 'EDITOR' });
        });
    });

    describe('createRole', () => {
        it('creates a role through the repository', async () => {
            (roleRepository.createRole as jest.Mock).mockResolvedValue({ id: 'role-2', name: 'EDITOR' });

            await expect(roleService.createRole({
                name: 'EDITOR',
                permissionIds: ['perm-1'],
            })).resolves.toEqual({ id: 'role-2', name: 'EDITOR' });
        });
    });

    describe('updateRole', () => {
        it('rejects missing roles', async () => {
            (roleRepository.findRoleById as jest.Mock).mockResolvedValue(null);

            await expect(roleService.updateRole('missing', { permissionIds: [] }))
                .rejects.toThrow('Role not found');
        });

        it('forbids modifying the ADMIN role', async () => {
            (roleRepository.findRoleById as jest.Mock).mockResolvedValue({
                id: 'role-1',
                name: 'ADMIN',
                permissions: [],
            });

            await expect(roleService.updateRole('role-1', { permissionIds: [] }))
                .rejects.toThrow('Cannot modify ADMIN role');
        });
    });

    describe('replaceRolePermissions', () => {
        it('replaces permissions for non-admin roles', async () => {
            (roleRepository.findRoleById as jest.Mock).mockResolvedValue({
                id: 'role-2',
                name: 'EDITOR',
                permissions: [],
            });
            (roleRepository.replaceRolePermissions as jest.Mock).mockResolvedValue({
                id: 'role-2',
                name: 'EDITOR',
                permissions: [{ id: 'perm-1', code: 'USERS_READ' }],
            });

            const result = await roleService.replaceRolePermissions('role-2', ['perm-1']);

            expect(roleRepository.replaceRolePermissions).toHaveBeenCalledWith('role-2', ['perm-1']);
            expect(result.permissions).toHaveLength(1);
        });
    });

    describe('deleteRole', () => {
        it('rejects deleting roles that are still assigned to users', async () => {
            (roleRepository.findRoleWithUsage as jest.Mock).mockResolvedValue({
                id: 'role-2',
                name: 'EDITOR',
                _count: { users: 3 },
            });

            await expect(roleService.deleteRole('role-2'))
                .rejects.toThrow('Cannot delete role assigned to users');
        });

        it('deletes unassigned non-admin roles', async () => {
            (roleRepository.findRoleWithUsage as jest.Mock).mockResolvedValue({
                id: 'role-2',
                name: 'EDITOR',
                _count: { users: 0 },
            });
            (roleRepository.deleteRole as jest.Mock).mockResolvedValue(undefined);

            const result = await roleService.deleteRole('role-2');

            expect(roleRepository.deleteRole).toHaveBeenCalledWith('role-2');
            expect(result.name).toBe('EDITOR');
        });
    });
});
