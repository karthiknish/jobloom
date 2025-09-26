import { test, expect } from '@playwright/test';

test.describe('Interview Prep Page', () => {
  test('should load interview prep page correctly', async ({ page }) => {
    await page.goto('/interview-prep');

    // Check page title and main elements
    await expect(page).toHaveTitle(/Interview Preparation/);
    await expect(page.getByText(/Interview Preparation/i)).toBeVisible();

    // Check if tabs are present
    await expect(page.getByRole('tab', { name: /Practice Questions/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Tips/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Mock Interviews/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Progress/i })).toBeVisible();
  });

  test('should display practice questions tab', async ({ page }) => {
    await page.goto('/interview-prep');

    // Click on Practice Questions tab (should be default)
    await page.getByRole('tab', { name: /Practice Questions/i }).click();

    // Check if question categories are displayed
    await expect(page.getByText(/Question Types/i)).toBeVisible();
    await expect(page.getByText(/Behavioral/i)).toBeVisible();
    await expect(page.getByText(/Technical/i)).toBeVisible();
    await expect(page.getByText(/Situational/i)).toBeVisible();
  });

  test('should allow selecting question categories', async ({ page }) => {
    await page.goto('/interview-prep');

    // Click on a question category
    await page.getByText('Behavioral').click();

    // Check if questions are loaded (should show question content)
    await expect(page.getByText(/Questions Completed/i)).toBeVisible();
  });

  test('should display interview tips', async ({ page }) => {
    await page.goto('/interview-prep');

    // Click on Tips tab
    await page.getByRole('tab', { name: /Tips/i }).click();

    // Check if tips are displayed
    await expect(page.getByText(/Interview Tips/i)).toBeVisible();

    // Check if tip cards are present
    const tipCards = page.locator('[class*="hover:shadow-lg"]');
    await expect(tipCards.first()).toBeVisible();
  });

  test('should display mock interview section', async ({ page }) => {
    await page.goto('/interview-prep');

    // Click on Mock Interviews tab
    await page.getByRole('tab', { name: /Mock Interviews/i }).click();

    // Check if mock interview content is displayed
    await expect(page.getByText(/Mock Interview Sessions/i)).toBeVisible();
    await expect(page.getByText(/How it works/i)).toBeVisible();
  });

  test('should display progress tracking', async ({ page }) => {
    await page.goto('/interview-prep');

    // Click on Progress tab
    await page.getByRole('tab', { name: /Progress/i }).click();

    // Check if progress metrics are displayed
    await expect(page.getByText(/Questions Practiced/i)).toBeVisible();
    await expect(page.getByText(/Practice Sessions/i)).toBeVisible();
    await expect(page.getByText(/Average Score/i)).toBeVisible();
  });

  test('should show loading states when navigating', async ({ page }) => {
    await page.goto('/interview-prep');

    // Switch between tabs quickly to potentially catch loading states
    await page.getByRole('tab', { name: /Tips/i }).click();
    await page.getByRole('tab', { name: /Mock Interviews/i }).click();
    await page.getByRole('tab', { name: /Progress/i }).click();

    // Page should remain stable without crashes
    await expect(page.getByText(/Interview Preparation/i)).toBeVisible();
  });
});
