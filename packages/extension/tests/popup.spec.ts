import { test, expect } from '@playwright/test';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';

test.describe('Chrome Extension Popup', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch browser with extension
    browser = await chromium.launch({
      headless: false, // Extensions require headful mode
      args: [
        `--disable-extensions-except=${process.cwd()}/packages/extension/dist`,
        `--load-extension=${process.cwd()}/packages/extension/dist`
      ]
    });

    // Get extension ID
    const backgroundPage = await browser.newPage();
    await backgroundPage.goto('chrome://extensions/');
    
    // Extract extension ID (this would need to be automated or mocked)
    // For now, we'll assume a known extension ID
    extensionId = 'hireall-extension-id'; // This would be dynamically obtained
    
    await backgroundPage.close();
  });

  test.beforeEach(async () => {
    // Create new context and page for each test
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should load popup correctly', async () => {
    // Open extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Check if popup loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for main elements
    await expect(page.locator('[data-testid="popup-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tabs"]')).toBeVisible();
  });

  test('should show sign in form when not authenticated', async () => {
    // Mock unauthenticated state
    await page.addInitScript(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Check for sign in form
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should show dashboard when authenticated', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Check for dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="jobs-list"]')).toBeVisible();
  });

  test('should navigate between tabs', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Check tabs are visible
    await expect(page.locator('button[data-tab="dashboard"]')).toBeVisible();
    await expect(page.locator('button[data-tab="jobs"]')).toBeVisible();
    await expect(page.locator('button[data-tab="settings"]')).toBeVisible();
    
    // Test tab navigation
    await page.click('button[data-tab="dashboard"]');
    await expect(page.locator('[data-testid="dashboard-tab"]')).toBeVisible();
    
    await page.click('button[data-tab="jobs"]');
    await expect(page.locator('[data-testid="jobs-tab"]')).toBeVisible();
    
    await page.click('button[data-tab="settings"]');
    await expect(page.locator('[data-testid="settings-tab"]')).toBeVisible();
  });

  test('should handle sign in with email and password', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Fill sign in form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    
    // Check for loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Mock successful sign in response
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      });
    });
    
    // Check for successful sign in
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle sign in errors', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Fill sign in form with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Mock failed sign in response
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      });
    });
    
    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should handle sign up', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Switch to sign up tab
    await page.click('button:has-text("Sign Up")');
    
    // Fill sign up form
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'newpassword123');
    await page.click('button:has-text("Sign Up")');
    
    // Mock successful sign up response
    await page.route('**/api/auth/signup', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            name: 'New User'
          }
        })
      });
    });
    
    // Check for successful sign up
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });
  });

  test('should load jobs list', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Mock jobs API response
    await page.route('**/api/app/jobs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [
            {
              id: '1',
              title: 'Software Engineer',
              company: 'Test Company',
              location: 'London, UK',
              status: 'applied',
              postedDate: '2024-01-01'
            },
            {
              id: '2',
              title: 'Senior Developer',
              company: 'Another Company',
              location: 'Manchester, UK',
              status: 'interview',
              postedDate: '2024-01-02'
            }
          ]
        })
      });
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Navigate to jobs tab
    await page.click('button[data-tab="jobs"]');
    
    // Check for jobs
    await expect(page.locator('[data-testid="job-item"]')).toHaveCount(2);
    await expect(page.getByText('Software Engineer')).toBeVisible();
    await expect(page.getByText('Senior Developer')).toBeVisible();
  });

  test('should filter jobs by status', async () => {
    // Mock authenticated state and jobs
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.route('**/api/app/jobs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [
            {
              id: '1',
              title: 'Software Engineer',
              company: 'Test Company',
              location: 'London, UK',
              status: 'applied',
              postedDate: '2024-01-01'
            },
            {
              id: '2',
              title: 'Senior Developer',
              company: 'Another Company',
              location: 'Manchester, UK',
              status: 'interview',
              postedDate: '2024-01-02'
            }
          ]
        })
      });
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button[data-tab="jobs"]');
    
    // Filter by 'applied' status
    await page.click('button[data-filter="applied"]');
    
    // Should show only applied jobs
    await expect(page.locator('[data-testid="job-item"]')).toHaveCount(1);
    await expect(page.getByText('Software Engineer')).toBeVisible();
    await expect(page.getByText('Senior Developer')).not.toBeVisible();
    
    // Filter by 'interview' status
    await page.click('button[data-filter="interview"]');
    
    // Should show only interview jobs
    await expect(page.locator('[data-testid="job-item"]')).toHaveCount(1);
    await expect(page.getByText('Senior Developer')).toBeVisible();
    await expect(page.getByText('Software Engineer')).not.toBeVisible();
  });

  test('should add new job', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button[data-tab="jobs"]');
    
    // Click add job button
    await page.click('button:has-text("Add Job")');
    
    // Check for add job form
    await expect(page.locator('[data-testid="add-job-form"]')).toBeVisible();
    
    // Fill job details
    await page.fill('input[name="title"]', 'Frontend Developer');
    await page.fill('input[name="company"]', 'Tech Company');
    await page.fill('input[name="location"]', 'Remote');
    
    // Mock API response
    await page.route('**/api/app/jobs', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          job: {
            id: '3',
            title: 'Frontend Developer',
            company: 'Tech Company',
            location: 'Remote',
            status: 'saved'
          }
        })
      });
    });
    
    // Submit form
    await page.click('button:has-text("Add Job")');
    
    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.getByText('Job added successfully')).toBeVisible();
  });

  test('should update job status', async () => {
    // Mock authenticated state and jobs
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.route('**/api/app/jobs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [
            {
              id: '1',
              title: 'Software Engineer',
              company: 'Test Company',
              location: 'London, UK',
              status: 'applied',
              postedDate: '2024-01-01'
            }
          ]
        })
      });
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button[data-tab="jobs"]');
    
    // Mock update API response
    await page.route('**/api/app/jobs/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job: {
            id: '1',
            title: 'Software Engineer',
            company: 'Test Company',
            location: 'London, UK',
            status: 'interview'
          }
        })
      });
    });
    
    // Click status dropdown for first job
    await page.click('[data-testid="job-status"]');
    
    // Select new status
    await page.click('li:has-text("Interview")');
    
    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should handle settings', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Navigate to settings tab
    await page.click('button[data-tab="settings"]');
    
    // Check for settings options
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
    await expect(page.locator('input[name="webAppUrl"]')).toBeVisible();
    await expect(page.locator('input[name="autoSync"]')).toBeVisible();
    await expect(page.locator('input[name="notifications"]')).toBeVisible();
    
    // Update settings
    await page.fill('input[name="webAppUrl"]', 'https://app.hireall.com');
    await page.check('input[name="autoSync"]');
    await page.check('input[name="notifications"]');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.getByText('Settings saved')).toBeVisible();
  });

  test('should handle sign out', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Click sign out button
    await page.click('button:has-text("Sign Out")');
    
    // Should redirect to sign in form
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
    
    // Check that auth data is cleared
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(authToken).toBeNull();
  });

  test('should handle network errors', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Try to load jobs
    await page.click('button[data-tab="jobs"]');
    
    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.getByText(/Network error|Connection failed/)).toBeVisible();
  });

  test('should handle loading states', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Mock slow API response
    await page.route('**/api/app/jobs**', route => {
      setTimeout(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [] })
      }), 2000);
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button[data-tab="jobs"]');
    
    // Check for loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle empty states', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Mock empty jobs response
    await page.route('**/api/app/jobs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [] })
      });
    });
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button[data-tab="jobs"]');
    
    // Check for empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.getByText('No jobs found')).toBeVisible();
    await expect(page.locator('button:has-text("Add Your First Job")')).toBeVisible();
  });
});
