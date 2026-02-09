import { userService } from '../src/services/UserService';
import { prisma } from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

// Mock prisma and auth utils
jest.mock('../src/utils/prisma', () => ({
    prisma: {
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
        auditLog: {
            create: jest.fn(),
        }
    }
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const mockInput = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'VIEWER'
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role-viewer', name: 'VIEWER' });

            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-123',
                name: mockInput.name,
                email: mockInput.email,
                password: 'hashed_password',
                role: { name: 'VIEWER' }
            });

            const result = await userService.register(mockInput);

            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: 'test@example.com',
                    password: 'hashed_password'
                })
            }));

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

            const result = await userService.login('test@example.com', 'password123');

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

            await expect(userService.login('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Invalid email or password');
        });
    });
});
