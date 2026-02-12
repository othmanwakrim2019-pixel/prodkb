
import { authService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/common/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
        teamMember: {
            create: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    };
    mock.$transaction.mockImplementation((cb: Function) => cb(mock));
    return { prisma: mock };
});

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (prisma as any).$transaction.mockImplementation((cb: Function) => cb(prisma));
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const mockInput = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'VIEWER'
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role-viewer', name: 'VIEWER' });

            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-123',
                name: mockInput.name,
                email: mockInput.email,
                password: 'hashed_password',
                role: { name: 'VIEWER' }
            });

            const result = await authService.register(mockInput);

            expect((prisma as any).$transaction).toHaveBeenCalled();
            expect(result).toHaveProperty('id', 'user-123');
            expect(result).not.toHaveProperty('password');
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed_password',
                isActive: true,
                role: {
                    name: 'ADMIN',
                    permissions: [{ code: 'USER_MANAGE' }]
                }
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mock_token');

            const result = await authService.login('test@example.com', 'password123');

            expect(result).toHaveProperty('token', 'mock_token');
            expect(result.user).toHaveProperty('email', 'test@example.com');
            expect(result.user.permissions).toContain('USER_MANAGE');
        });

        it('should fail with invalid password', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed_password',
                isActive: true
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(authService.login('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Invalid email or password');
        });
    });
});
