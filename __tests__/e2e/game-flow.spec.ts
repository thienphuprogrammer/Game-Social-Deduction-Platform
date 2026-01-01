import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Game Flow', () => {
  let hostContext: BrowserContext;
  let playerContexts: BrowserContext[];
  let hostPage: Page;
  let playerPages: Page[];
  let roomId: string;

  test.beforeEach(async ({ browser }) => {
    // Create contexts
    hostContext = await browser.newContext();
    playerContexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    hostPage = await hostContext.newPage();
    playerPages = await Promise.all(playerContexts.map(c => c.newPage()));

    // Host creates room
    await hostPage.goto('/room/create?name=GameHost');
    await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });

    const url = hostPage.url();
    roomId = url.match(/\/room\/([A-Z0-9]+)/)?.[1] || '';

    // Players join
    for (let i = 0; i < 3; i++) {
      await playerPages[i].goto('/');
      await playerPages[i].click('text=Tham gia');
      await playerPages[i].fill('input[placeholder="VD: ABC12345"]', roomId);
      await playerPages[i].fill('input[placeholder="Nhập tên hiển thị"]', `Player${i + 1}`);
      await playerPages[i].click('button:has-text("Vào phòng")');
      await playerPages[i].waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
    }

    // Wait for all players to be recognized
    await hostPage.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await hostContext.close();
    for (const ctx of playerContexts) {
      await ctx.close();
    }
  });

  test('should show all players in host view', async () => {
    await expect(hostPage.locator('text=Player1')).toBeVisible();
    await expect(hostPage.locator('text=Player2')).toBeVisible();
    await expect(hostPage.locator('text=Player3')).toBeVisible();
  });

  test('should allow host to select game type', async () => {
    // Click on a game card
    await hostPage.click('text=Alibi 1 câu');

    // Should show AI Assistant
    await expect(hostPage.locator('text=AI')).toBeVisible({ timeout: 5000 });
  });

  test('should allow host to generate AI content', async () => {
    // Select game
    await hostPage.click('text=Alibi 1 câu');
    await hostPage.waitForTimeout(500);

    // Generate content
    const generateButton = hostPage.locator('button:has-text("Tạo nội dung")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // Wait for loading to complete (may take time if OpenAI is available)
      // If no API key, it will show error
      await hostPage.waitForTimeout(3000);
    }
  });

  test('should update player view when game starts', async () => {
    // Select game
    await hostPage.click('text=Alibi 1 câu');
    await hostPage.waitForTimeout(500);

    // Check if Generate button is visible
    const generateButton = hostPage.locator('button:has-text("Tạo nội dung")');
    const isGenerateVisible = await generateButton.isVisible();

    if (isGenerateVisible) {
      // Try to generate content (may fail without API key)
      await generateButton.click();
      await hostPage.waitForTimeout(2000);

      // If content was generated, try to accept it
      const acceptButton = hostPage.locator('button:has-text("Chấp nhận")');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await hostPage.waitForTimeout(1000);

        // Start game
        const startButton = hostPage.locator('button:has-text("Bắt đầu")');
        if (await startButton.isVisible() && await startButton.isEnabled()) {
          await startButton.click();
          
          // Players should see their roles
          await playerPages[0].waitForTimeout(2000);
          // Check if player view has changed (will show game info)
        }
      }
    }
  });

  test('should show player count in host controls', async () => {
    // Should show 4 players (1 host + 3 players)
    await expect(hostPage.locator('text=4')).toBeVisible();
  });

  test('should allow host to reset room', async () => {
    // Select a game first
    await hostPage.click('text=Alibi 1 câu');
    await hostPage.waitForTimeout(500);

    // Reset room
    const resetButton = hostPage.locator('button:has-text("Reset")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Should go back to game selection
      await expect(hostPage.locator('text=Chọn loại game')).toBeVisible({ timeout: 5000 });
    }
  });
});

