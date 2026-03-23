import bcrypt from 'bcryptjs';
import { userService } from '../src/modules/users/user.service';
import { userRepository } from '../src/modules/users/repositories/user.repository';

jest.mock('bcryptjs');
jest.mock('../src/modules/users/repositories/user.repository', () => ({
    userRepository: {
        findAllUsers: jest.fn(),
        findAllUsersDetailed: jest.fn(),
        findUserById: jest.fn(),
        findRoleByName: jest.fn(),
        updateUser: jest.fn(),
        findUserWithUsage: jest.fn(),
        deleteUser: jest.fn(),
        findUserCredentials: jest.fn(),
        updateUserPassword: jest.fn(),
        findUserWithPermissions: jest.fn(),
    },
}));
jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('UserService', () => {
    const createdAt = new Date('2026-03-23T10:00:00.000Z');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('maps repository users into the public shape', async () => {
            (userRepository.findAllUsers as jest.Mock).mockResolvedValue([
                { id: '1', name: 'User 1', email: 'u1@example.com', isActive: true, createdAt, role: { name: 'ADMIN' } },
                { id: '2', name: 'User 2', email: 'u2@example.com', isActive: false, createdAt, role: null },
            ]);

            const result = await userService.findAll();

            expect(result).toEqual([
                { id: '1', name: 'User 1', email: 'u1@example.com', isActive: true, createdAt, role: 'ADMIN' },
                { id: '2', name: 'User 2', email: 'u2@example.com', isActive: false, createdAt, role: 'VIEWER' },
            ]);
        });

        it('returns detailed users without remapping', async () => {
            const detailedUsers = [{ id: '1', name: 'User 1', teamMemberships: [] }];
            (userRepository.findAllUsersDetailed as jest.Mock).mockResolvedValue(detailedUsers);

            await expect(userService.findAllDetailed()).resolves.toEqual(detailedUsers);
        });
    });

    describe('findById', () => {
        it('throws when the user does not exist', async () => {
            (userRepository.findUserById as jest.Mock).mockResolvedValue(null);

            await expect(userService.findById('missing')).rejects.toThrow('User not found');
        });
    });

    describe('update', () => {
        it('updates a user and resolves role names through the repository', async () => {
            (userRepository.findUserById as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Old Name',
                email: 'old@example.com',
                isActive: true,
                createdAt,
                role: { name: 'VIEWER' },
            });
            (userRepository.findRoleByName as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'ADMIN' });
            (userRepository.updateUser as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'New Name',
                email: 'new@example.com',
                isActive: false,
                createdAt,
                role: { name: 'ADMIN' },
            });

            const result = await userService.update('user-1', {
                name: 'New Name',
                email: 'new@example.com',
                isActive: false,
                role: 'ADMIN',
            } as any);

            expect(userRepository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
                name: 'New Name',
                email: 'new@example.com',
                isActive: false,
                roleId: 'role-1',
            }));
            expect(result.role).toBe('ADMIN');
        });
    });

    describe('delete', () => {
        it('rejects deletion when the user is still linked to incidents or teams', async () => {
            (userRepository.findUserWithUsage as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Busy User',
                _count: {
                    createdIncidents: 2,
                    teamMemberships: 1,
                },
            });

            await expect(userService.delete('user-1'))
                .rejects.toThrow('Impossible de supprimer');
        });

        it('deletes an unlinked user', async () => {
            (userRepository.findUserWithUsage as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Free User',
                _count: {
                    createdIncidents: 0,
                    teamMemberships: 0,
                },
            });
            (userRepository.deleteUser as jest.Mock).mockResolvedValue(undefined);

            await userService.delete('user-1');

            expect(userRepository.deleteUser).toHaveBeenCalledWith('user-1');
        });
    });

    describe('changePassword', () => {
        it('rejects incorrect current passwords', async () => {
            (userRepository.findUserCredentials as jest.Mock).mockResolvedValue({
                id: 'user-1',
                password: 'hashed-password',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(userService.changePassword('user-1', 'wrong-password', 'newpassword123'))
                .rejects.toThrow('Current password is incorrect');
        });

        it('updates the password when the current password is valid', async () => {
            (userRepository.findUserCredentials as jest.Mock).mockResolvedValue({
                id: 'user-1',
                password: 'hashed-password',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
            (userRepository.updateUserPassword as jest.Mock).mockResolvedValue(undefined);

            await userService.changePassword('user-1', 'oldpassword123', 'newpassword123');

            expect(userRepository.updateUserPassword).toHaveBeenCalledWith('user-1', 'new-hash');
        });
    });

    describe('adminResetPassword', () => {
        it('resets a password when the admin provides a valid password', async () => {
            (userRepository.findUserCredentials as jest.Mock).mockResolvedValue({
                id: 'user-2',
                password: 'old-hash',
            });
            (bcrypt.hash as jest.Mock).mockResolvedValue('admin-reset-hash');
            (userRepository.updateUserPassword as jest.Mock).mockResolvedValue(undefined);

            await userService.adminResetPassword('user-2', 'newpassword123');

            expect(userRepository.updateUserPassword).toHaveBeenCalledWith('user-2', 'admin-reset-hash');
        });
    });

    describe('findByIdWithPermissions', () => {
        it('returns merged role permissions in the public user response', async () => {
            (userRepository.findUserWithPermissions as jest.Mock).mockResolvedValue({
                id: 'user-1',
                name: 'Admin User',
                email: 'admin@example.com',
                isActive: true,
                createdAt,
                role: {
                    name: 'ADMIN',
                    permissions: [{ code: 'USERS_READ' }, { code: 'USERS_WRITE' }],
                },
            });

            const result = await userService.findByIdWithPermissions('user-1');

            expect(result).toEqual({
                id: 'user-1',
                name: 'Admin User',
                email: 'admin@example.com',
                isActive: true,
                createdAt,
                role: 'ADMIN',
                permissions: ['USERS_READ', 'USERS_WRITE'],
            });
        });
    });
});
