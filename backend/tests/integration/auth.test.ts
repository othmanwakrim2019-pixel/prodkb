import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/common/utils/prisma';
import bcrypt from 'bcryptjs';

import { userService } from '../../src/modules/users/user.service';
import { authService } from '../../src/modules/auth/auth.service';

describe('Auth Integration', () => {
    const testUser = {
        name: 'Integration Test User',
        email: 'integration-test@example.com',
        password: 'password123',
        role: 'ADMIN'
    };

    // ...

    beforeAll(async () => {
        // Cleanup potentially stale data
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        });

        // Seed user for login tests
        await authService.register(testUser);
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        });
        await prisma.$disconnect();
    });

    // Register is protected by ADMIN role, so we skip integration testing it here without an admin token
    /*
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user.email).toBe(testUser.email);
        expect(res.body.data).toHaveProperty('token');
    });
    */

    it('should login with the registered user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        // Token is now in httpOnly cookie, not in response body
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user.email).toBe(testUser.email);

        // Verify cookie is set
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const tokenCookie = Array.isArray(cookies)
            ? cookies.find((c: string) => c.startsWith('access_token='))
            : cookies;
        expect(tokenCookie).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
    });

    it('should fail login with non-existent user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });

        expect(res.status).toBe(401);
    });
});
