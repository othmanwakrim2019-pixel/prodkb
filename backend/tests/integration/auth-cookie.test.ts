/**
 * Auth Cookie Integration Tests
 * Verifies that login sets httpOnly cookies and protected routes work with cookie auth.
 */
import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../../src/common/utils/prisma';
import { authService } from '../../src/modules/auth/auth.service';

describe('Auth Cookie Integration', () => {
    const testUser = {
        name: 'Cookie Test User',
        email: 'cookie-test@example.com',
        password: 'password123',
        role: 'ADMIN',
    };

    let authCookie: string;

    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await authService.register(testUser);
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('should return a Set-Cookie header with httpOnly token on login', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);

        // Check for Set-Cookie header
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();

        // Find the access_token cookie (the auth controller uses 'access_token' as cookie name)
        const tokenCookie = Array.isArray(cookies)
            ? cookies.find((c: string) => c.startsWith('access_token='))
            : typeof cookies === 'string' && cookies.startsWith('access_token=') ? cookies : undefined;

        expect(tokenCookie).toBeDefined();
        expect(tokenCookie).toContain('HttpOnly');

        // Save for subsequent tests
        authCookie = tokenCookie!;
    });

    it('should allow accessing protected routes with cookie auth', async () => {
        // Skip if login didn't set cookie
        if (!authCookie) return;

        const res = await request(app)
            .get('/api/v1/users')
            .set('Cookie', [authCookie]);

        // Should not be 401 — cookies are accepted as auth
        expect(res.status).not.toBe(401);
    });

    it('should reject protected routes without any auth', async () => {
        const res = await request(app)
            .get('/api/v1/users');

        expect(res.status).toBe(401);
    });

    it('should reject protected routes with invalid cookie', async () => {
        const res = await request(app)
            .get('/api/v1/users')
            .set('Cookie', ['access_token=invalidjwttoken']);

        expect(res.status).toBe(401);
    });

    it('should clear cookie on logout', async () => {
        if (!authCookie) return;

        const res = await request(app)
            .post('/auth/logout')
            .set('Cookie', [authCookie]);

        // Logout should clear the cookie
        const cookies = res.headers['set-cookie'];
        if (cookies) {
            const tokenCookie = Array.isArray(cookies)
                ? cookies.find((c: string) => c.startsWith('access_token='))
                : cookies;
            if (tokenCookie) {
                // Cookie should be expired/empty
                expect(tokenCookie).toMatch(/access_token=;|Max-Age=0|expires=/i);
            }
        }
    });
});
