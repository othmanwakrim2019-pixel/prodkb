import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/login');

        // Fill in credentials
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');

        // Submit form
        await page.click('button[type="submit"]');

        // Expect to be redirected to dashboard
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        await page.click('button[type="submit"]');

        // Expect error message
        await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });
});
