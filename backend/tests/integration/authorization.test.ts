import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/common/utils/prisma';
import { authService } from '../../src/modules/auth/auth.service';
import { clearAuthCache } from '../../src/common/middleware/auth.middleware';

describe('Authorization Integration', () => {
    const unique = Date.now().toString();
    const adminEmail = `admin-authz-${unique}@example.com`;
    const operatorEmail = `operator-authz-${unique}@example.com`;
    const password = 'password123';

    beforeAll(async () => {
        await prisma.user.deleteMany({
            where: {
                email: { in: [adminEmail, operatorEmail] },
            },
        });

        await authService.register({
            name: 'Authorization Admin',
            email: adminEmail,
            password,
            role: 'ADMIN',
        });

        await authService.register({
            name: 'Authorization Operator',
            email: operatorEmail,
            password,
            role: 'OPERATOR',
        });
    });

    afterAll(async () => {
        await clearAuthCache();
        await prisma.user.deleteMany({
            where: {
                email: { in: [adminEmail, operatorEmail] },
            },
        });
    });

    const loginAndGetCookie = async (email: string) => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email, password });

        expect(response.status).toBe(200);
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const accessCookie = Array.isArray(cookies)
            ? cookies.find((cookie: string) => cookie.startsWith('access_token='))
            : typeof cookies === 'string' && cookies.startsWith('access_token=') ? cookies : undefined;

        expect(accessCookie).toBeDefined();
        return accessCookie!;
    };

    it('returns 401 for protected routes without authentication', async () => {
        const response = await request(app).get('/api/v1/users');

        expect(response.status).toBe(401);
    });

    it('returns 403 when the user lacks the required permission', async () => {
        const operatorCookie = await loginAndGetCookie(operatorEmail);

        const response = await request(app)
            .get('/api/v1/users')
            .set('Cookie', [operatorCookie]);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            status: 403,
            message: 'Forbidden',
        });
    });

    it('allows access when the required permission is present', async () => {
        const adminCookie = await loginAndGetCookie(adminEmail);

        const response = await request(app)
            .get('/api/v1/users')
            .set('Cookie', [adminCookie]);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
