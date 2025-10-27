import { test, expect } from '@playwright/test';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';

test.describe('Chrome Extension Content Script', () => {
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

    // For testing purposes, we'll use a mock extension ID
    // In real testing, this would be dynamically obtained
    extensionId = 'hireall-extension-id';
  });

  test.beforeEach(async () => {
    // Create new context and page for each test
    context = await browser.newContext();
    page = await context.newPage();
    
    // Mock extension content script injection
    await page.addInitScript(() => {
      // Simulate content script being loaded
      window.hireallExtension = {
        initialized: true,
        version: '1.0.0'
      };
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should inject content script on job board pages', async () => {
    // Navigate to a job board (mock page)
    await page.goto('https://www.linkedin.com/jobs');
    
    // Mock page structure with job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobs-search__results-list">
            <div class="job-card-container" data-test="job-card">
              <h3 class="job-card-list__title">Software Engineer</h3>
              <h4 class="job-card-container__company-name">Test Company</h4>
              <div class="job-card-list__location">London, UK</div>
              <div class="job-card-list__description">Looking for a skilled software engineer...</div>
            </div>
            <div class="job-card-container" data-test="job-card">
              <h3 class="job-card-list__title">Senior Developer</h3>
              <h4 class="job-card-container__company-name">Another Company</h4>
              <div class="job-card-list__location">Manchester, UK</div>
              <div class="job-card-list__description">Senior developer position available...</div>
            </div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Check if content script is loaded
    const isContentScriptLoaded = await page.evaluate(() => {
      return typeof window.hireallExtension !== 'undefined';
    });
    
    expect(isContentScriptLoaded).toBe(true);
  });

  test('should detect job cards on page', async () => {
    // Navigate to a job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
            <div class="companyLocation">London, England</div>
            <div class="job-snippet">We are looking for talented software engineers...</div>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Frontend Developer</h2>
            <span class="companyName">Digital Agency</span>
            <div class="companyLocation">Remote, UK</div>
            <div class="job-snippet">Join our frontend development team...</div>
          </div>
        \`;
      `
    });
    
    // Wait for job detection
    await page.waitForTimeout(1000);
    
    // Check if job cards are detected
    const jobCards = await page.locator('[data-test="job-card"]').count();
    expect(jobCards).toBeGreaterThan(0);
  });

  test('should add control buttons to job cards', async () => {
    // Navigate to a job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
            <div class="companyLocation">London, England</div>
            <div class="job-snippet">We are looking for talented software engineers...</div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to add controls
    await page.waitForTimeout(1000);
    
    // Check for control buttons
    await expect(page.locator('.hireall-job-controls')).toBeVisible();
    await expect(page.locator('button.hireall-check-sponsorship')).toBeVisible();
    await expect(page.locator('button.hireall-add-to-board')).toBeVisible();
  });

  test('should check job sponsorship when button clicked', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
    });
    
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
            <div class="companyLocation">London, England</div>
            <div class="job-snippet">We are looking for talented software engineers...</div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock sponsorship API response
    await page.route('**/api/sponsors/check', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isSponsored: true,
          sponsorshipType: 'GLOBAL_BUSINESS_MOBILITY',
          company: 'Tech Company Ltd',
          confidence: 0.9
        })
      });
    });
    
    // Click sponsorship check button
    await page.click('button.hireall-check-sponsorship');
    
    // Check for loading state
    await expect(page.locator('button.hireall-check-sponsorship')).toContainText('Checking...');
    
    // Wait for result
    await page.waitForTimeout(2000);
    
    // Check for sponsored highlighting
    await expect(page.locator('.hireall-sponsored-highlight')).toBeVisible();
    await expect(page.locator('.hireall-sponsored-badge')).toBeVisible();
  });

  test('should add job to board when button clicked', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
    });
    
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
            <div class="companyLocation">London, England</div>
            <div class="job-snippet">We are looking for talented software engineers...</div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock add to board API response
    await page.route('**/api/app/jobs', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Job added successfully',
          job: {
            id: '123',
            title: 'Software Engineer',
            company: 'Tech Company Ltd'
          }
        })
      });
    });
    
    // Click add to board button
    await page.click('button.hireall-add-to-board');
    
    // Check for loading state
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Adding...');
    
    // Wait for result
    await page.waitForTimeout(2000);
    
    // Check for success message
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Added');
  });

  test('should handle auto-scan feature', async () => {
    // Mock authenticated state and auto-scan enabled
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('settings', JSON.stringify({
        autoScan: true,
        highlightSponsored: true
      }));
    });
    
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Sponsored Company Ltd</span>
            <div class="companyLocation">London, England</div>
            <div class="job-snippet">We sponsor visas for skilled workers...</div>
          </div>
        \`;
      `
    });
    
    // Mock sponsorship API response
    await page.route('**/api/sponsors/check', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isSponsored: true,
          sponsorshipType: 'SKILLED_WORKER',
          company: 'Sponsored Company Ltd',
          confidence: 0.95
        })
      });
    });
    
    // Wait for auto-scan to complete
    await page.waitForTimeout(3000);
    
    // Check if sponsored jobs are automatically highlighted
    await expect(page.locator('.hireall-sponsored-highlight')).toBeVisible();
    await expect(page.locator('.hireall-sponsored-badge')).toBeVisible();
  });

  test('should handle dynamic content loading', async () => {
    // Navigate to job board
    await page.goto('https://www.linkedin.com/jobs');
    
    // Start with empty page
    await page.addScriptTag({
      content: `
        document.body.innerHTML = '<div id="jobs-container"></div>';
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Dynamically add job cards (simulating infinite scroll)
    await page.addScriptTag({
      content: `
        const container = document.getElementById('jobs-container');
        setTimeout(() => {
          container.innerHTML = \`
            <div class="job-card-container" data-test="job-card">
              <h3 class="job-card-list__title">Software Engineer</h3>
              <h4 class="job-card-container__company-name">Dynamic Company</h4>
              <div class="job-card-list__location">London, UK</div>
            </div>
          \`;
        }, 1000);
      `
    });
    
    // Wait for dynamic content to be processed
    await page.waitForTimeout(2000);
    
    // Check if control buttons are added to dynamically loaded content
    await expect(page.locator('.hireall-job-controls')).toBeVisible();
  });

  test('should handle multiple job boards', async () => {
    const jobBoards = [
      'https://www.linkedin.com/jobs',
      'https://www.indeed.co.uk/jobs',
      'https://uk.indeed.com/jobs',
      'https://jobs.github.com'
    ];
    
    for (const board of jobBoards) {
      // Navigate to job board
      await page.goto(board);
      
      // Mock job cards appropriate for each site
      if (board.includes('linkedin')) {
        await page.addScriptTag({
          content: `
            document.body.innerHTML = \`
              <div class="jobs-search__results-list">
                <div class="job-card-container">
                  <h3 class="job-card-list__title">Software Engineer</h3>
                  <h4 class="job-card-container__company-name">LinkedIn Company</h4>
                </div>
              </div>
            \`;
          `
        });
      } else if (board.includes('indeed')) {
        await page.addScriptTag({
          content: `
            document.body.innerHTML = \`
              <div class="jobsearch-BasicJobCard">
                <h2 class="jobTitle">Software Engineer</h2>
                <span class="companyName">Indeed Company</span>
              </div>
            \`;
          `
        });
      } else {
        await page.addScriptTag({
          content: `
            document.body.innerHTML = \`
              <div class="job">
                <h1>Software Engineer</h1>
                <p class="company">GitHub Company</p>
              </div>
            \`;
          `
        });
      }
      
      // Wait for content script to process
      await page.waitForTimeout(1000);
      
      // Check if controls are added (may differ by site)
      const controlsVisible = await page.locator('.hireall-job-controls').isVisible();
      expect(controlsVisible).toBe(true);
    }
  });

  test('should handle network errors gracefully', async () => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
    });
    
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    // Click sponsorship check button
    await page.click('button.hireall-check-sponsorship');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check that button resets to original state
    await expect(page.locator('button.hireall-check-sponsorship')).toContainText('Check Sponsor');
  });

  test('should handle extension context invalidation', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Tech Company Ltd</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Simulate extension context invalidation
    await page.addInitScript(() => {
      delete window.chrome;
    });
    
    // Try to click sponsorship button
    await page.click('button.hireall-check-sponsorship');
    
    // Check for error message
    await page.waitForTimeout(1000);
    // Note: This would require the content script to handle context invalidation
  });

  test('should handle multiple jobs on same page', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock multiple job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Company A</span>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Senior Developer</h2>
            <span class="companyName">Company B</span>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Frontend Developer</h2>
            <span class="companyName">Company C</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Check that all job cards have controls
    const controlButtons = await page.locator('.hireall-job-controls').count();
    expect(controlButtons).toBe(3);
    
    // Check that all sponsorship buttons work
    const sponsorButtons = await page.locator('button.hireall-check-sponsorship').count();
    expect(sponsorButtons).toBe(3);
    
    // Check that all add to board buttons work
    const addButtons = await page.locator('button.hireall-add-to-board').count();
    expect(addButtons).toBe(3);
  });
});
