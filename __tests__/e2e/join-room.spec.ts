import { test, expect } from '@playwright/test';

test.describe('Join Room Flow', () => {
  test('should show join room form when join tab is clicked', async ({ page }) => {
    await page.goto('/');

    // Click join tab
    await page.click('text=Tham gia');

    // Check join form exists
    await expect(page.locator('input[placeholder="VD: ABC12345"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Nhập tên hiển thị"]')).toBeVisible();
    await expect(page.locator('button:has-text("Vào phòng")')).toBeVisible();
  });

  test('should show error for non-existent room', async ({ page }) => {
    await page.goto('/');

    // Switch to join mode
    await page.click('text=Tham gia');

    // Fill in invalid room code
    await page.fill('input[placeholder="VD: ABC12345"]', 'INVALID1');
    await page.fill('input[placeholder="Nhập tên hiển thị"]', 'Player1');
    await page.click('button:has-text("Vào phòng")');

    // Should navigate to room page, then show error
    await page.waitForURL(/\/room\/INVALID1/);
    await expect(page.locator('text=không tồn tại')).toBeVisible({ timeout: 5000 });
  });

  test('should join existing room successfully', async ({ browser }) => {
    // Create two contexts: one for host, one for player
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates room
      await hostPage.goto('/room/create?name=HostPlayer');
      await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      // Extract room code from URL
      const url = hostPage.url();
      const roomId = url.match(/\/room\/([A-Z0-9]+)/)?.[1];
      expect(roomId).toBeDefined();

      // Player joins room
      await playerPage.goto('/');
      await playerPage.click('text=Tham gia');
      await playerPage.fill('input[placeholder="VD: ABC12345"]', roomId!);
      await playerPage.fill('input[placeholder="Nhập tên hiển thị"]', 'Player1');
      await playerPage.click('button:has-text("Vào phòng")');

      // Player should be in room
      await playerPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
      
      // Wait for connection
      await playerPage.waitForTimeout(2000);

      // Host should see player in list (check after player joins)
      await hostPage.waitForTimeout(1000);
      await expect(hostPage.locator('text=Player1')).toBeVisible({ timeout: 5000 });
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('should allow player to reconnect with same name', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates room
      await hostPage.goto('/room/create?name=HostPlayer');
      await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      const url = hostPage.url();
      const roomId = url.match(/\/room\/([A-Z0-9]+)/)?.[1];

      // Player joins room first time
      await playerPage.goto('/');
      await playerPage.click('text=Tham gia');
      await playerPage.fill('input[placeholder="VD: ABC12345"]', roomId!);
      await playerPage.fill('input[placeholder="Nhập tên hiển thị"]', 'ReconnectTest');
      await playerPage.click('button:has-text("Vào phòng")');
      await playerPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

      // Player "disconnects" and rejoins
      await playerPage.goto('/');
      await playerPage.click('text=Tham gia');
      await playerPage.fill('input[placeholder="VD: ABC12345"]', roomId!);
      await playerPage.fill('input[placeholder="Nhập tên hiển thị"]', 'ReconnectTest');
      await playerPage.click('button:has-text("Vào phòng")');

      // Should rejoin successfully (no error)
      await playerPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
      await playerPage.waitForTimeout(2000);
      await expect(playerPage.locator('text=đã được sử dụng')).not.toBeVisible();
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});

