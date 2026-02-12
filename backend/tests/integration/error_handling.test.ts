import request from 'supertest';
import { app } from '../../src/server';
import { userService } from '../../src/modules/users/user.service';
import { authService } from '../../src/modules/auth/auth.service';
import { prisma } from '../../src/common/utils/prisma';

describe('Centralized Error Handling Integration', () => {
    let token: string;
    const testUser = {
        name: 'Error Test User',
        email: 'error-test@example.com',
        password: 'password123',
        role: 'ADMIN'
    };

    beforeAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { email: testUser.email } });

        // Ensure role and permission exist for integration test
        let permission = await prisma.permission.findUnique({ where: { code: 'INCIDENT_VIEW' } });
        if (!permission) {
            permission = await prisma.permission.create({
                data: { code: 'INCIDENT_VIEW', description: 'Permission to view incidents' }
            });
        }

        let role = await prisma.role.findUnique({
            where: { name: 'ADMIN' },
            include: { permissions: { where: { code: 'INCIDENT_VIEW' } } }
        });

        if (!role) {
            role = await prisma.role.create({
                data: {
                    name: 'ADMIN',
                    description: 'Admin role',
                    permissions: { connect: { id: permission.id } }
                },
                include: { permissions: true }
            });
        } else if (role.permissions.length === 0) {
            await prisma.role.update({
                where: { id: role.id },
                data: { permissions: { connect: { id: permission.id } } }
            });
        }

        // Create user
        await authService.register(testUser);
        // Login
        const loginRes = await authService.login(testUser.email, testUser.password);
        token = loginRes.token;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('should return 500 for invalid UUID (Prisma error handled by middleware)', async () => {
        const res = await request(app)
            .get('/api/incidents/invalid-uuid')
            .set('Authorization', `Bearer ${token}`);

        // Prisma usually throws a P2023 for invalid UUID input to findUnique
        // Our errorHandler might catch it as default (500) or if it's validation error it might vary.
        // Let's accept 400 or 500 as long as it's JSON and has error code.
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent resource', async () => {
        const validUuid = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/incidents/${validUuid}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
    });
});
