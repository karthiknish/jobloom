import { test, expect } from '@playwright/test';

test.describe('Chatbot', () => {
  test('should display chatbot button on homepage', async ({ page }) => {
    await page.goto('/');

    // Check if chatbot button is visible
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await expect(chatButton).toBeVisible();
  });

  test('should open chatbot when clicked', async ({ page }) => {
    await page.goto('/');

    // Click on chatbot button
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Check if chat window opens
    const chatWindow = page.locator('[data-testid="chat-window"], [class*="fixed"][class*="z-"][class*="rounded-xl"]');
    await expect(chatWindow).toBeVisible();

    // Check if welcome message is displayed
    await expect(page.getByText(/Hi! I'm.*AI/i)).toBeVisible();
  });

  test('should show suggested questions', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window to open
    await page.waitForTimeout(500);

    // Check if suggested questions are visible
    await expect(page.getByText(/💡 Quick suggestions/i)).toBeVisible();

    // Check for some suggested questions
    await expect(page.getByText(/How do I negotiate/i)).toBeVisible();
    await expect(page.getByText(/How can I improve/i)).toBeVisible();
  });

  test('should allow typing in chat input', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window
    await page.waitForTimeout(500);

    // Find chat input
    const chatInput = page.locator('textarea[placeholder*="Ask me about"], input[placeholder*="Ask me about"]');
    await expect(chatInput).toBeVisible();

    // Type a message
    await chatInput.fill('Hello, can you help me with interview preparation?');
    await expect(chatInput).toHaveValue('Hello, can you help me with interview preparation?');
  });

  test('should have chat history button', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window
    await page.waitForTimeout(500);

    // Check for history button (clock/history icon)
    const historyButton = page.locator('button[aria-label*="history"], button:has(.lucide-history), button:has(.lucide-clock)');
    await expect(historyButton).toBeVisible();
  });

  test('should have minimize and close buttons', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window
    await page.waitForTimeout(500);

    // Check for minimize button
    const minimizeButton = page.locator('button[aria-label*="minimize"], button:has(.lucide-minus), button:has(.lucide-minimize)');
    await expect(minimizeButton).toBeVisible();

    // Check for close button
    const closeButton = page.locator('button[aria-label*="close"], button:has(.lucide-x)');
    await expect(closeButton).toBeVisible();
  });

  test('should close chatbot when close button clicked', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window
    await page.waitForTimeout(500);

    // Click close button
    const closeButton = page.locator('button[aria-label*="close"], button:has(.lucide-x)').first();
    await closeButton.click();

    // Check if chat window is closed
    const chatWindow = page.locator('[data-testid="chat-window"], [class*="fixed"][class*="z-"][class*="rounded-xl"]');
    await expect(chatWindow).not.toBeVisible();
  });

  test('should show branding and description', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    const chatButton = page.locator('[data-testid="chatbot-button"], button[aria-label*="chat"], button:has(.lucide-message-circle)');
    await chatButton.click();

    // Wait for chat window
    await page.waitForTimeout(500);

    // Check for HireAll branding
    await expect(page.getByText(/HireAll AI/i)).toBeVisible();
    await expect(page.getByText(/Career Assistant/i)).toBeVisible();
  });
});
