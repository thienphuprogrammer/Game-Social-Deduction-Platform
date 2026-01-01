import { test, expect } from '@playwright/test';

test.describe('Create Room Flow', () => {
  test('should display home page correctly', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Social Deduction/i);

    // Check main elements exist - tab buttons
    await expect(page.locator('text=Tạo phòng')).toBeVisible();
    await expect(page.locator('text=Tham gia')).toBeVisible();
  });

  test('should switch between create and join modes', async ({ page }) => {
    await page.goto('/');

    // Click join tab
    await page.click('text=Tham gia');
    
    // Should show room code input
    await expect(page.locator('text=Mã phòng')).toBeVisible();

    // Click create tab
    await page.click('text=Tạo phòng');
    
    // Room code input should be hidden
    await expect(page.locator('text=Mã phòng')).not.toBeVisible();
  });

  test('should create room from home page', async ({ page }) => {
    await page.goto('/');

    // Fill in host name
    await page.fill('input[placeholder="Nhập tên hiển thị"]', 'TestHost');
    await page.click('button:has-text("Tạo phòng mới")');

    // Should redirect to create page then room page
    await expect(page).toHaveURL(/\/room\/create/);
  });

  test('should show game selector after room creation', async ({ page }) => {
    // Navigate to create room with name in URL
    await page.goto('/room/create?name=TestHost');

    // Wait for WebSocket connection and room creation
    await page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
    
    // Should see game selector
    await expect(page.locator('text=Chọn loại game')).toBeVisible({ timeout: 5000 });
  });
});

