import { test, expect } from '@playwright/test';

test.describe('CV Evaluator', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should load CV evaluator page correctly', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Check page title
    await expect(page).toHaveTitle(/CV Evaluator/);
    
    // Check main sections are visible
    await expect(page.getByText('CV Evaluator')).toBeVisible();
    await expect(page.getByText('Upload your CV to get instant ATS analysis')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload a test CV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Wait for upload processing
    await expect(page.getByText('Processing CV...')).toBeVisible();
    
    // Check for analysis results after processing
    await expect(page.getByText('ATS Score')).toBeVisible({ timeout: 30000 });
  });

  test('should display CV analysis results', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload CV first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Wait for analysis to complete
    await page.waitForSelector('[data-testid="ats-score"]', { timeout: 30000 });
    
    // Check analysis components
    await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="cv-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-tabs"]')).toBeVisible();
  });

  test('should navigate between analysis tabs', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload CV first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Wait for tabs to appear
    await page.waitForSelector('[data-testid="analysis-tabs"]', { timeout: 30000 });
    
    // Test tab navigation
    await page.click('button:has-text("Overview")');
    await expect(page.locator('[data-testid="overview-tab"]')).toBeVisible();
    
    await page.click('button:has-text("Skills")');
    await expect(page.locator('[data-testid="skills-tab"]')).toBeVisible();
    
    await page.click('button:has-text("Experience")');
    await expect(page.locator('[data-testid="experience-tab"]')).toBeVisible();
    
    await page.click('button:has-text("Recommendations")');
    await expect(page.locator('[data-testid="recommendations-tab"]')).toBeVisible();
  });

  test('should show improvement suggestions', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload CV first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Navigate to recommendations tab
    await page.waitForSelector('button:has-text("Recommendations")', { timeout: 30000 });
    await page.click('button:has-text("Recommendations")');
    
    // Check for improvement suggestions
    await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
    await expect(page.getByText(/improvement|recommendation|suggestion/i)).toBeVisible();
  });

  test('should handle multiple CV uploads', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload first CV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Wait for first analysis
    await page.waitForSelector('[data-testid="ats-score"]', { timeout: 30000 });
    
    // Upload second CV
    await fileInput.setInputFiles('test-cv-2.pdf');
    
    // Wait for second analysis
    await expect(page.getByText('Processing CV...')).toBeVisible();
    await page.waitForSelector('[data-testid="ats-score"]', { timeout: 30000 });
    
    // Check history is updated
    await expect(page.locator('[data-testid="cv-history"]')).toBeVisible();
  });

  test('should show error for invalid file format', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('invalid-file.txt');
    
    // Check for error message
    await expect(page.getByText(/Invalid file format|Please upload a PDF/)).toBeVisible();
  });

  test('should require authentication', async ({ page }) => {
    // Sign out first
    await page.goto('/sign-in');
    await page.click('button:has-text("Sign Out")');
    
    // Try to access CV evaluator
    await page.goto('/cv-evaluator');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByText('Please sign in to access CV evaluator')).toBeVisible();
  });

  test('should refresh analysis data', async ({ page }) => {
    await page.goto('/cv-evaluator');
    
    // Upload CV first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Wait for analysis
    await page.waitForSelector('[data-testid="ats-score"]', { timeout: 30000 });
    
    // Click refresh button
    await page.click('button:has-text("Refresh")');
    
    // Check loading state
    await expect(page.getByText('Loading...')).toBeVisible();
    
    // Check data is refreshed
    await page.waitForSelector('[data-testid="ats-score"]', { timeout: 30000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/cv/upload', route => route.abort());
    
    await page.goto('/cv-evaluator');
    
    // Try to upload CV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-cv.pdf');
    
    // Check error message
    await expect(page.getByText(/Network error|Failed to upload|Upload failed/)).toBeVisible();
  });
});
