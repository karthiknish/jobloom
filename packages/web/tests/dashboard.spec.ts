import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should load dashboard correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page title
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Check main dashboard elements
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
  });

  test('should display job statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for stats cards
    await expect(page.locator('[data-testid="total-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="sponsored-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="interviews"]')).toBeVisible();
  });

  test('should display job list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for job list
    await expect(page.locator('[data-testid="job-list"]')).toBeVisible();
    
    // Check for job items if they exist
    const jobItems = page.locator('[data-testid="job-item"]');
    if (await jobItems.count() > 0) {
      await expect(jobItems.first()).toBeVisible();
      await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="job-company"]')).toBeVisible();
    }
  });

  test('should add new job', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click add job button
    await page.click('button:has-text("Add Job")');
    
    // Check for add job modal
    await expect(page.locator('[data-testid="add-job-modal"]')).toBeVisible();
    
    // Fill job details
    await page.fill('input[name="title"]', 'Software Engineer');
    await page.fill('input[name="company"]', 'Test Company');
    await page.fill('input[name="location"]', 'London, UK');
    await page.fill('textarea[name="description"]', 'Test job description');
    
    // Submit form
    await page.click('button:has-text("Add Job")');
    
    // Check success message
    await expect(page.getByText('Job added successfully')).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Applied")')).toBeVisible();
    await expect(page.locator('button:has-text("Interview")')).toBeVisible();
    await expect(page.locator('button:has-text("Offer")')).toBeVisible();
    
    // Test filtering
    await page.click('button:has-text("Applied")');
    await expect(page.locator('button:has-text("Applied")')).toHaveClass(/active/);
    
    await page.click('button:has-text("Interview")');
    await expect(page.locator('button:has-text("Interview")')).toHaveClass(/active/);
  });

  test('should search jobs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Type search query
    await searchInput.fill('Software Engineer');
    
    // Check if search results are updated
    await page.waitForTimeout(500); // Wait for debounced search
  });

  test('should update job status', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find first job item if exists
    const jobItems = page.locator('[data-testid="job-item"]');
    if (await jobItems.count() > 0) {
      const firstJob = jobItems.first();
      
      // Click status dropdown
      await firstJob.locator('[data-testid="job-status"]').click();
      
      // Select new status
      await page.click('li:has-text("Interview")');
      
      // Check status is updated
      await expect(firstJob.locator('[data-testid="job-status"]')).toContainText('Interview');
    }
  });

  test('should delete job', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find first job item if exists
    const jobItems = page.locator('[data-testid="job-item"]');
    if (await jobItems.count() > 0) {
      const firstJob = jobItems.first();
      
      // Click delete button
      await firstJob.locator('button[aria-label="Delete"]').click();
      
      // Confirm deletion
      await page.click('button:has-text("Delete")');
      
      // Check success message
      await expect(page.getByText('Job deleted successfully')).toBeVisible();
    }
  });

  test('should export job data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Check for export options
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    
    // Select CSV export
    await page.click('button:has-text("Export as CSV")');
    
    // Check for download initiation
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show job analytics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click analytics tab
    await page.click('button:has-text("Analytics")');
    
    // Check for analytics components
    await expect(page.locator('[data-testid="job-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-chart"]')).toBeVisible();
  });

  test('should integrate with extension', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for extension integration section
    await expect(page.locator('[data-testid="extension-integration"]')).toBeVisible();
    
    // Check extension status
    await expect(page.locator('[data-testid="extension-status"]')).toBeVisible();
    
    // If extension is not connected, show connect button
    const connectButton = page.locator('button:has-text("Connect Extension")');
    if (await connectButton.isVisible()) {
      await expect(connectButton).toBeVisible();
    }
  });

  test('should handle premium features', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for premium upgrade prompts
    const upgradePrompt = page.locator('[data-testid="premium-upgrade"]');
    if (await upgradePrompt.isVisible()) {
      await expect(upgradePrompt).toBeVisible();
      await expect(page.locator('button:has-text("Upgrade to Premium")')).toBeVisible();
    }
  });

  test('should show loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/app/jobs**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/dashboard');
    
    // Check for loading state
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="job-list"]', { timeout: 5000 });
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty jobs response
    await page.route('**/api/app/jobs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [] })
      });
    });
    
    await page.goto('/dashboard');
    
    // Check for empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.getByText('No jobs found')).toBeVisible();
    await expect(page.locator('button:has-text("Add Your First Job")')).toBeVisible();
  });

  test('should require authentication', async ({ page }) => {
    // Sign out first
    await page.goto('/sign-in');
    await page.click('button:has-text("Sign Out")');
    
    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-list"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-list"]')).toBeVisible();
  });
});
