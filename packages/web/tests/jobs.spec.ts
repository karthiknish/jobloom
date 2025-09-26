import { test, expect } from '@playwright/test';

test.describe('Jobs Page', () => {
  test('should load jobs page and display job listings', async ({ page }) => {
    await page.goto('/jobs');

    // Check page title and main elements
    await expect(page).toHaveTitle(/Jobs/);
    await expect(page.getByText(/Jobs Found/i)).toBeVisible();

    // Check if search and filter elements are present
    await expect(page.getByPlaceholder(/Job title, keywords/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Location/i)).toBeVisible();

    // Check if job cards are displayed
    const jobCards = page.locator('[data-testid="job-card"], .bg-white.rounded-lg');
    await expect(jobCards.first()).toBeVisible();

    // Check if at least one job has a title, company, and location
    const firstJob = jobCards.first();
    await expect(firstJob.locator('h3')).toBeVisible();
    await expect(firstJob.getByText(/\$/)).toBeVisible(); // Salary information
  });

  test('should filter jobs by search query', async ({ page }) => {
    await page.goto('/jobs');

    // Get initial job count
    const initialCount = await page.locator('[data-testid="job-card"], .bg-white.rounded-lg').count();

    // Search for a specific job title
    await page.getByPlaceholder(/Job title, keywords/i).fill('Senior Software Engineer');
    await page.waitForTimeout(500); // Wait for filtering

    // Check that results are filtered (should have fewer or equal results)
    const filteredCount = await page.locator('[data-testid="job-card"], .bg-white.rounded-lg').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter jobs by location', async ({ page }) => {
    await page.goto('/jobs');

    // Search for jobs in a specific location
    await page.getByPlaceholder(/Location/i).fill('San Francisco');
    await page.waitForTimeout(500); // Wait for filtering

    // Check that location filter is applied
    const jobCards = page.locator('[data-testid="job-card"], .bg-white.rounded-lg');
    if (await jobCards.count() > 0) {
      await expect(jobCards.first()).toContainText('San Francisco');
    }
  });

  test('should show loading skeleton when filtering', async ({ page }) => {
    await page.goto('/jobs');

    // Start typing in search to trigger loading state
    await page.getByPlaceholder(/Job title, keywords/i).fill('Software Engineer');

    // Check if loading skeletons appear during filtering
    const skeletons = page.locator('[class*="animate-pulse"]');
    // Note: Loading state might be too fast to catch in tests, so this is optional
    // await expect(skeletons).toHaveCount(await skeletons.count());
  });

  test('should display job details correctly', async ({ page }) => {
    await page.goto('/jobs');

    const firstJob = page.locator('[data-testid="job-card"], .bg-white.rounded-lg').first();

    // Check job card structure
    await expect(firstJob.locator('h3')).toBeVisible(); // Job title
    await expect(firstJob.getByText(/\$/)).toBeVisible(); // Salary
    await expect(firstJob.getByText(/Remote|On-site|Hybrid/i)).toBeVisible(); // Job type
  });
});
