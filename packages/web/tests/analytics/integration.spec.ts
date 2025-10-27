import { test, expect } from '@playwright/test';

// Type declarations for the window object
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[][];
    mockAnalyticsService?: {
      events: Array<{
        name: string;
        parameters: Record<string, any>;
        timestamp: number;
      }>;
      logEvent: (name: string, parameters: Record<string, any>) => void;
      logUserEngagement: (eventType: string, data: Record<string, any>) => void;
      clearEvents: () => void;
      getEvents: () => Array<{
        name: string;
        parameters: Record<string, any>;
        timestamp: number;
      }>;
    };
  }
}

test.describe('Analytics Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock analytics service for testing
    await page.addInitScript(() => {
      // Mock Firebase analytics
      window.gtag = window.gtag || function() {
        (window.dataLayer = window.dataLayer || []).push(Array.from(arguments));
      };
      
      window.dataLayer = window.dataLayer || [];
      
      // Mock analytics service methods
      window.mockAnalyticsService = {
        events: [],
        logEvent: function(name: string, parameters: Record<string, any>) {
          this.events.push({ name, parameters, timestamp: Date.now() });
          console.log('Analytics Event:', { name, parameters });
        },
        logUserEngagement: function(eventType: string, data: Record<string, any>) {
          this.events.push({ name: 'user_engagement', parameters: { event_type: eventType, ...data }, timestamp: Date.now() });
          console.log('User Engagement:', { eventType, data });
        },
        clearEvents: function() {
          this.events = [];
        },
        getEvents: function() {
          return this.events;
        }
      };
    });
  });

  test('should track page views on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if analytics events were tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event: any) => event.name === 'page_view')).toBeTruthy();
  });

  test('should track job search interactions', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to jobs page
    await page.getByRole('link', { name: /jobs/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Perform a job search
    await page.getByPlaceholder(/search jobs/i).fill('Software Engineer');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check if search was tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'job_searched')).toBeTruthy();
  });

  test('should track job detail views', async ({ page }) => {
    await page.goto('/jobs');
    
    // Click on a job listing
    await page.getByRole('link', { name: /software engineer/i }).first().click();
    await page.waitForLoadState('networkidle');
    
    // Check if job view was tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'job_viewed')).toBeTruthy();
  });

  test('should track user engagement events', async ({ page }) => {
    await page.goto('/');
    
    // Click on main CTA button
    await page.getByRole('button', { name: /get started/i }).click();
    await page.waitForTimeout(500);
    
    // Check if engagement was tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'user_engagement')).toBeTruthy();
  });

  test('should track CV upload interactions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to CV section
    await page.getByRole('link', { name: /resume|cv/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Upload a CV file (mock)
    const fileInput = page.getByLabel(/upload cv|upload resume/i);
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles('test-cv.pdf');
      await page.waitForTimeout(1000);
      
      // Check if upload was tracked
      const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
      
      expect(events.some((event: any) => event.name === 'cv_uploaded')).toBeTruthy();
    }
  });

  test('should track dashboard interactions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on different dashboard tabs
    await page.getByRole('tab', { name: /applications/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByRole('tab', { name: /profile/i }).click();
    await page.waitForTimeout(500);
    
    // Check if dashboard views were tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'dashboard_viewed')).toBeTruthy();
  });

  test('should handle analytics errors gracefully', async ({ page }) => {
    // Mock analytics service to throw errors
    await page.addInitScript(() => {
      if (window.mockAnalyticsService) {
        window.mockAnalyticsService.logEvent = function() {
          throw new Error('Analytics service unavailable');
        };
      }
    });
    
    await page.goto('/');
    
    // Page should still load despite analytics errors
    await expect(page.getByText('Find Your Dream Job')).toBeVisible();
    
    // No events should be tracked due to error
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    expect(events.length).toBe(0);
  });

  test('should respect user privacy settings', async ({ page }) => {
    // Mock privacy settings to disable analytics
    await page.addInitScript(() => {
      localStorage.setItem('analytics-consent', 'false');
      if (window.mockAnalyticsService) {
        window.mockAnalyticsService.logEvent = function() {
          // Should not be called when analytics is disabled
          throw new Error('Analytics should be disabled');
        };
      }
    });
    
    await page.goto('/');
    
    // Page should still load
    await expect(page.getByText('Find Your Dream Job')).toBeVisible();
    
    // No exceptions should be thrown
    await page.waitForTimeout(1000);
  });

  test('should track form submissions', async ({ page }) => {
    await page.goto('/contact');
    
    // Fill out contact form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('Test message');
    
    // Submit form
    await page.getByRole('button', { name: /send|submit/i }).click();
    await page.waitForTimeout(1000);
    
    // Check if form submission was tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'form_submitted')).toBeTruthy();
  });

  test('should track authentication events', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt login
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForTimeout(1000);
    
    // Check if login attempt was tracked
    const events = await page.evaluate(() => window.mockAnalyticsService?.getEvents() || []);
    
    expect(events.some((event: any) => event.name === 'login_attempted')).toBeTruthy();
  });
});
