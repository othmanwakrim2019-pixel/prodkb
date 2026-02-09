import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../../src/utils/prisma';
import bcrypt from 'bcryptjs';

import { userService } from '../../src/services/UserService';

describe('Auth Integration', () => {
    const testUser = {
        name: 'Integration Test User',
        email: 'integration-test@example.com',
        password: 'password123'
    };

    // ...

    beforeAll(async () => {
        // Cleanup potentially stale data
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        });

        // Seed user for login tests
        await userService.register(testUser);
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
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body).toHaveProperty('token');
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
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(testUser.email);
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
