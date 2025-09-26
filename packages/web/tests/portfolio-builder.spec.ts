import { test, expect } from '@playwright/test';

test.describe('Portfolio Builder', () => {
  test('should load portfolio builder page', async ({ page }) => {
    await page.goto('/portfolio-builder');

    // Check if redirected to sign-in (since user is not authenticated)
    // or shows the portfolio builder interface
    const isOnSignIn = page.url().includes('/sign-in');
    const hasPortfolioBuilder = await page.getByText('Portfolio Builder').isVisible().catch(() => false);

    if (isOnSignIn) {
      await expect(page.getByText(/sign in/i)).toBeVisible();
    } else {
      await expect(page.getByText('Portfolio Builder')).toBeVisible();
      await expect(page.getByText('Advanced Portfolio Builder')).toBeVisible();
    }
  });

  test('should display portfolio builder features on marketing page', async ({ page }) => {
    await page.goto('/portfolio');

    // Check if portfolio page shows builder information
    await expect(page.getByText('Portfolio Builder')).toBeVisible();
    await expect(page.getByText('Advanced Portfolio Builder')).toBeVisible();

    // Check if features are listed
    await expect(page.getByText(/Custom Templates/i)).toBeVisible();
    await expect(page.getByText(/Mobile Responsive/i)).toBeVisible();
    await expect(page.getByText(/SEO Ready/i)).toBeVisible();
  });

  test('should show portfolio builder benefits', async ({ page }) => {
    await page.goto('/portfolio');

    // Check for key benefits
    await expect(page.getByText(/Easy Customization/i)).toBeVisible();
    await expect(page.getByText(/Analytics Integration/i)).toBeVisible();
    await expect(page.getByText(/Privacy Controls/i)).toBeVisible();
  });

  test('should have portfolio builder CTA', async ({ page }) => {
    await page.goto('/portfolio');

    // Check if CTA button is present
    await expect(page.getByRole('link', { name: /Start Building Your Portfolio/i })).toBeVisible();
  });

  test('should navigate to resume builder as alternative', async ({ page }) => {
    await page.goto('/portfolio');

    // Check if resume builder link exists
    await expect(page.getByRole('link', { name: /Go to Resume Builder/i })).toBeVisible();
  });
});

// Tests for authenticated portfolio builder functionality
// Note: These tests would require authentication setup
test.describe('Portfolio Builder (Authenticated)', () => {
  test.skip('should allow template selection', async ({ page }) => {
    // This test would require authentication setup
    // await page.goto('/portfolio-builder');
    // await expect(page.getByText('Choose a template')).toBeVisible();
  });

  test.skip('should allow adding sections', async ({ page }) => {
    // This test would require authentication setup
    // await page.getByRole('button', { name: /Add Section/i }).click();
    // await expect(page.getByText('Hero Section')).toBeVisible();
  });

  test.skip('should allow saving portfolio', async ({ page }) => {
    // This test would require authentication setup
    // await page.getByRole('button', { name: /Save/i }).click();
    // await expect(page.getByText(/saved successfully/i)).toBeVisible();
  });
});
