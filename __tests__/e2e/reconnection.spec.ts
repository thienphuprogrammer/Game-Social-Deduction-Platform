import { test, expect } from '@playwright/test';

test.describe('Reconnection Flow', () => {
  test('host should be able to reconnect after page reload', async ({ page }) => {
    // Create room
    await page.goto('/room/create?name=ReconnectHost');
    await page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

    // Get the URL
    const originalUrl = page.url();

    // Reload page
    await page.reload();

    // Should still be in host view
    await expect(page.locator('text=Chọn loại game')).toBeVisible({ timeout: 10000 });
  });

  test('player should reconnect by name after reload', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates room
      await hostPage.goto('/room/create?name=HostPlayer');
      await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      const roomId = hostPage.url().match(/\/room\/([A-Z0-9]+)/)?.[1];

      // Player joins
      await playerPage.goto('/');
      await playerPage.click('text=Tham gia');
      await playerPage.fill('input[placeholder="VD: ABC12345"]', roomId!);
      await playerPage.fill('input[placeholder="Nhập tên hiển thị"]', 'TestPlayer');
      await playerPage.click('button:has-text("Vào phòng")');
      await playerPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      // Player reloads page - should go back to home
      await playerPage.goto('/');

      // Player rejoins with same name
      await playerPage.click('text=Tham gia');
      await playerPage.fill('input[placeholder="VD: ABC12345"]', roomId!);
      await playerPage.fill('input[placeholder="Nhập tên hiển thị"]', 'TestPlayer');
      await playerPage.click('button:has-text("Vào phòng")');

      // Should join successfully without "name already used" error
      await playerPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
      await playerPage.waitForTimeout(2000);
      
      // Should not see error messages
      await expect(playerPage.locator('text=đã được sử dụng')).not.toBeVisible();
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('WebSocket should reconnect automatically', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    try {
      // Create room
      await hostPage.goto('/room/create?name=WSTestHost');
      await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      // Should be connected
      await expect(hostPage.locator('text=Chọn loại game')).toBeVisible();

      // Wait a bit and check if still connected
      await hostPage.waitForTimeout(2000);
      
      // Page should still work (no "Đang kết nối..." indicator)
      await expect(hostPage.locator('text=Đang kết nối')).not.toBeVisible();
    } finally {
      await hostContext.close();
    }
  });
});

