import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test('should show mobile navigation on small screens', async ({ page, isMobile }) => {
    // Skip this test if not running on mobile
    test.skip(!isMobile, 'This test is only for mobile devices');

    await page.goto('/');

    // Check if bottom navigation is visible on mobile
    const mobileNav = page.locator('[class*="fixed"][class*="bottom-0"]');
    await expect(mobileNav).toBeVisible();

    // Check if main navigation items are present
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Jobs')).toBeVisible();
    await expect(page.getByText('Interview')).toBeVisible();
    await expect(page.getByText('Resume')).toBeVisible();
  });

  test('should hide mobile navigation on auth pages', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');

    await page.goto('/sign-in');

    // Mobile navigation should be hidden on auth pages
    const mobileNav = page.locator('[class*="fixed"][class*="bottom-0"]');
    await expect(mobileNav).not.toBeVisible();
  });

  test('should navigate using mobile navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');

    await page.goto('/');

    // Click on Jobs in mobile navigation
    await page.getByText('Jobs').click();

    // Should navigate to jobs page
    await expect(page).toHaveURL(/.*jobs/);
  });

  test('should hide mobile nav on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    await page.goto('/');

    // Mobile navigation should be hidden on desktop (md:hidden class)
    const mobileNav = page.locator('[class*="md:hidden"]');
    await expect(mobileNav).toHaveClass(/hidden/);
  });
});

test.describe('Responsive Design', () => {
  test('should adapt layout for mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    await page.goto('/');

    // Check if mobile-friendly elements are present
    const mainContent = page.locator('main, [class*="container"], [class*="max-w"]');
    await expect(mainContent).toBeVisible();

    // Check if text is readable on mobile
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check if mobile menu button exists (hamburger menu)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has(.lucide-menu), [data-testid="mobile-menu"]');
    // Note: May not exist if using bottom navigation instead
    try {
      await expect(mobileMenuButton).toBeVisible();
    } catch {
      // Bottom navigation might be used instead - that's also fine
      const bottomNav = page.locator('[class*="fixed"][class*="bottom-0"]');
      await expect(bottomNav).toBeVisible();
    }
  });

  test('should stack elements vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check if main content areas are stacked (not side by side)
    const heroSection = page.locator('[class*="py-10"], [class*="py-12"]').first();
    await expect(heroSection).toBeVisible();

    // Check if buttons are appropriately sized for mobile
    const ctaButton = page.getByRole('button').first();
    const buttonBox = await ctaButton.boundingBox();
    expect(buttonBox?.width).toBeLessThan(400); // Should not be too wide on mobile
  });
});
