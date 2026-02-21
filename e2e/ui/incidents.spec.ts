import { test, expect } from '@playwright/test';

test.describe('Incident Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should display incidents list', async ({ page }) => {
        await page.goto('/incidents');
        await expect(page.getByRole('heading', { name: /incidents/i })).toBeVisible({ timeout: 10000 });
    });

    test('should create new incident', async ({ page }) => {
        page.on('dialog', dialog => console.log('DIALOG:', dialog.message()));

        await page.goto('/incidents/new');

        // Select System (Required field) - Must do this first because the frontend clears 'title' when system changes!
        await page.waitForTimeout(1000); // Wait for Systems API to answer
        await page.locator('select[name="systemId"]').selectOption({ index: 1 });

        // Fill in incident form
        await page.fill('input[name="title"]', 'Test Incident - E2E');
        await page.fill('textarea[name="description"]', 'This is a test incident created by E2E test');

        // Select environment
        await page.selectOption('select[name="environment"]', 'PROD');

        // Select severity
        await page.selectOption('select[name="severity"]', 'Medium');

        // Submit form
        await page.click('button[type="submit"]');

        // Check for any validation errors
        const errors = await page.locator('.text-red-500.text-xs').allTextContents();
        if (errors.length > 0) {
            console.error('PLAYWRIGHT FOUND VALIDATION ERRORS:', errors);
        }

        // Should redirect back to the incidents list
        await expect(page).toHaveURL(/.*\/incidents(\?.*)?$/, { timeout: 10000 });
    });

    test('should view incident details', async ({ page }) => {
        await page.goto('/incidents');

        // Click on first incident
        const firstIncident = page.locator('table tbody tr a').first();
        await firstIncident.click();

        // Should show incident details
        await expect(page.getByText(/details|description/i)).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Procedure Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should display procedures list', async ({ page }) => {
        await page.goto('/procedures');
        await expect(page.getByRole('heading', { name: /procedures/i })).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should search across incidents and procedures', async ({ page }) => {
        await page.goto('/search');

        // Enter search term
        await page.fill('input[type="search"], input[placeholder*="search" i]', 'test');

        // Either press Enter or click search button
        await page.keyboard.press('Enter');

        // Wait for results
        await page.waitForTimeout(1000);
    });
});

test.describe('Admin Panel Access', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@prodkb.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should access admin panel as admin', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible({ timeout: 10000 });
    });

    test('should display user management tab', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.getByText(/user management/i)).toBeVisible({ timeout: 10000 });
    });
});
