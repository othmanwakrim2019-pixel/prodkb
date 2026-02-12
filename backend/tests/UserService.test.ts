
import { userService } from '../src/modules/users/user.service';
import { prisma } from '../src/common/utils/prisma';

// Mock prisma
jest.mock('../src/common/utils/prisma', () => {
    const mock = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        role: {
            findUnique: jest.fn(),
        },
    };
    return { prisma: mock };
});

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: '1', name: 'User 1', email: 'u1@ex.com', isActive: true, role: { name: 'ADMIN' } },
                { id: '2', name: 'User 2', email: 'u2@ex.com', isActive: true, role: { name: 'VIEWER' } }
            ];
            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

            const result = await userService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('role', 'ADMIN');
        });
    });

    describe('findById', () => {
        it('should return a user by ID', async () => {
            const mockUser = { id: '1', name: 'User 1', email: 'u1@ex.com', isActive: true, role: { name: 'ADMIN' } };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await userService.findById('1');

            expect(result).toHaveProperty('id', '1');
            expect(result).toHaveProperty('role', 'ADMIN');
        });

        it('should throw NotFoundError if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(userService.findById('999')).rejects.toThrow('User not found');
        });
    });
});
