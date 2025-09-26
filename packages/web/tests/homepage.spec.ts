import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    await page.goto('/');

    // Check if the page title is correct
    await expect(page).toHaveTitle(/HireAll/);

    // Check if main elements are visible
    await expect(page.getByText('Find Your Dream Job')).toBeVisible();
    await expect(page.getByText('Ace Your Interviews')).toBeVisible();
    await expect(page.getByText('Build Your Portfolio')).toBeVisible();

    // Check if navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();

    // Check if main CTA button is present
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
  });

  test('should navigate to jobs page', async ({ page }) => {
    await page.goto('/');

    // Click on Jobs link in navigation
    await page.getByRole('link', { name: /Jobs/i }).first().click();

    // Should navigate to jobs page
    await expect(page).toHaveURL(/.*jobs/);
    await expect(page.getByText(/Jobs Found/i)).toBeVisible();
  });

  test('should navigate to interview prep page', async ({ page }) => {
    await page.goto('/');

    // Click on Interview Prep link
    await page.getByRole('link', { name: /Interview Prep/i }).click();

    // Should navigate to interview prep page
    await expect(page).toHaveURL(/.*interview-prep/);
    await expect(page.getByText(/Interview Preparation/i)).toBeVisible();
  });

  test('should navigate to portfolio page', async ({ page }) => {
    await page.goto('/');

    // Click on Portfolio link
    await page.getByRole('link', { name: /Portfolio/i }).click();

    // Should navigate to portfolio page
    await expect(page).toHaveURL(/.*portfolio/);
    await expect(page.getByText(/Portfolio Builder/i)).toBeVisible();
  });
});
