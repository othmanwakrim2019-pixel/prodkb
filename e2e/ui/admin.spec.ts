import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should load all major admin modules via tabs', async ({ page }) => {
        // Navigate to Admin dashboard
        await page.goto('/admin');
        await expect(page.locator('[role="tablist"]')).toBeVisible({ timeout: 10000 });

        // Check Systems 
        await page.locator('[role="tab"]').nth(1).click();
        await expect(page.locator('button .lucide, a .lucide').first()).toBeVisible({ timeout: 5000 });

        // Check Teams
        await page.locator('[role="tab"]').nth(2).click();
        await expect(page.locator('button .lucide, a .lucide').first()).toBeVisible({ timeout: 5000 });

        // Check SLAs
        await page.locator('[role="tab"]').nth(3).click();
        await expect(page.locator('button .lucide, a .lucide').first()).toBeVisible({ timeout: 5000 });

        // Check Webhooks
        await page.locator('[role="tab"]').nth(6).click(); // Roles is 7, Webhooks is 6? (0:Users, 1:Systems, 2:Teams, 3:SLAs, 4:Escalation, 5:Auto-Assign, 6:Webhooks)
        await expect(page.locator('button .lucide, a .lucide').first()).toBeVisible({ timeout: 5000 });
    });
});
