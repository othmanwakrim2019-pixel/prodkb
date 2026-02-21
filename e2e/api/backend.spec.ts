import { test, expect } from '@playwright/test';

test.describe('Backend API E2E', () => {
    // Tests hitting the backend REST APIs directly through the proxy or direct endpoint
    test('Authentication API should return an access token via cookie', async ({ request }) => {
        const response = await request.post('/auth/v1/login', {
            data: { email: 'admin@prodkb.com', password: 'password123' }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.success).toBe(true);
        // Token is passed via httpOnly cookie, auto-managed by Playwright
    });

    test('Systems API should list and create systems', async ({ request }) => {
        // Authenticate
        const loginRes = await request.post('/auth/v1/login', {
            data: { email: 'admin@prodkb.com', password: 'password123' }
        });
        expect(loginRes.ok()).toBeTruthy();

        // Extract CSRF token manually from Set-Cookie headers
        let csrfToken = '';
        const headers = loginRes.headersArray();
        for (const h of headers) {
            if (h.name.toLowerCase() === 'set-cookie' && h.value.includes('csrf_token=')) {
                csrfToken = h.value.split('csrf_token=')[1].split(';')[0];
            }
        }

        // Create
        const createRes = await request.post('/api/v1/systems', {
            headers: { 'x-csrf-token': csrfToken },
            data: {
                name: 'E2E Test System ' + Date.now(),
                description: 'Created by API Playwright Test',
                status: 'operational',
                repositoryUrl: 'https://github.com/company/e2e-system',
                ownerTeamId: null
            }
        });
        expect(createRes.ok()).toBeTruthy();
        const createJson = await createRes.json();
        expect(createJson.success).toBe(true);
        const systemId = createJson.data.id;

        // List
        const listRes = await request.get('/api/v1/systems');
        expect(listRes.ok()).toBeTruthy();
        const listJson = await listRes.json();
        const items = listJson.data?.data || listJson.data || listJson.items || listJson;
        expect(items.length).toBeGreaterThan(0);
    });

    test('Health API should return OK', async ({ request }) => {
        const response = await request.get('http://localhost:3000/health');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.status).toBe('ok');
    });
});
