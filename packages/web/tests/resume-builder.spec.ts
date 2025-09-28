import { test, expect } from '@playwright/test';

// NOTE: Assumes an authenticated session may be required; if auth redirects, we just assert sign-in prompt.

test.describe('Resume Builder', () => {
  test('loads and allows entering personal info + generating cover letter (unauth state fallback)', async ({ page }) => {
    await page.goto('/resume-builder');

    // If redirected to sign-in, assert prompt and exit early
    if (await page.getByText('Please sign in to access the resume builder.').isVisible().catch(()=>false)) {
      await expect(page.getByText('Please sign in to access the resume builder.')).toBeVisible();
      return; // Auth flow not part of this lightweight test
    }

    await expect(page.getByText('Resume Builder')).toBeVisible();

    // Go to Personal tab (should be default)
    await page.getByLabel('Full Name *').fill('Jane Candidate');
    await page.getByLabel('Email *').fill('jane@example.com');
    await page.getByLabel('Location').fill('Remote');

    // Switch to Experience and add one
    await page.getByRole('tab', { name: /Experience/i }).click();
    await page.getByRole('button', { name: /Add Experience/i }).click();
    await page.getByPlaceholder('Company Name').fill('Acme Corp');
    await page.getByPlaceholder('Software Engineer').fill('Senior Engineer');

    // Switch to Cover Letter tab
    await page.getByRole('tab', { name: /Cover Letter/i }).click();
    await page.getByLabel('Job Title').fill('Frontend Engineer');
    await page.getByLabel('Company Name').fill('TechStars');
    await page.getByRole('button', { name: /Generate Letter/i }).click();

    // Validate letter output appears
    await expect(page.getByText('Dear')).toBeVisible();
  });
});
