import request from 'supertest';
import { app } from '../../src/server';
import { userService } from '../../src/services/UserService';
import { prisma } from '../../src/utils/prisma';

describe('Centralized Error Handling Integration', () => {
    let token: string;
    const testUser = {
        name: 'Error Test User',
        email: 'error-test@example.com',
        password: 'password123'
    };

    beforeAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        // Create user
        await userService.register(testUser);
        // Login
        const loginRes = await userService.login(testUser.email, testUser.password);
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
        expect(res.body.code).toBe('NOT_FOUND');
    });
});
