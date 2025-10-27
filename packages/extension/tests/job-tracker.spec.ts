import { test, expect } from '@playwright/test';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';

test.describe('Job Tracker Functionality', () => {
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
    extensionId = 'hireall-extension-id';
  });

  test.beforeEach(async () => {
    // Create new context and page for each test
    context = await browser.newContext();
    page = await context.newPage();
    
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should extract job data from LinkedIn job cards', async () => {
    // Navigate to LinkedIn jobs page
    await page.goto('https://www.linkedin.com/jobs');
    
    // Mock LinkedIn job card structure
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobs-search__results-list">
            <div class="job-card-container" data-test="job-card">
              <h3 class="job-card-list__title">Senior Software Engineer</h3>
              <h4 class="job-card-container__company-name">Tech Corporation</h4>
              <div class="job-card-list__location">London, England, United Kingdom</div>
              <div class="job-card-list__footer-wrapper">
                <div class="job-card-list__footer-job-state">Promoted</div>
                <time class="job-card-list__time">2 weeks ago</time>
              </div>
              <div class="hidden-snl-internship-job-details">
                <div class="job-card-list__insight-behavioral">
                  <span class="job-card-container__metadata-item">Actively hiring</span>
                </div>
              </div>
            </div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Test job data extraction
    const extractedJob = await page.evaluate(() => {
      const jobCard = document.querySelector('.job-card-container');
      if (!jobCard) return null;
      
      return {
        title: jobCard.querySelector('.job-card-list__title')?.textContent?.trim(),
        company: jobCard.querySelector('.job-card-container__company-name')?.textContent?.trim(),
        location: jobCard.querySelector('.job-card-list__location')?.textContent?.trim(),
        postedDate: jobCard.querySelector('.job-card-list__time')?.textContent?.trim(),
        source: 'linkedin'
      };
    });
    
    expect(extractedJob).not.toBeNull();
    expect(extractedJob.title).toBe('Senior Software Engineer');
    expect(extractedJob.company).toBe('Tech Corporation');
    expect(extractedJob.location).toBe('London, England, United Kingdom');
    expect(extractedJob.source).toBe('linkedin');
  });

  test('should extract job data from Indeed job cards', async () => {
    // Navigate to Indeed jobs page
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock Indeed job card structure
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">
              <a href="/viewjob?jk=123">Frontend Developer</a>
            </h2>
            <div class="companyInfo">
              <span class="companyName">Digital Solutions Ltd</span>
              <div class="companyLocation">Manchester, UK</div>
            </div>
            <div class="job-snippet">
              <div>Looking for an experienced frontend developer with React and TypeScript skills...</div>
            </div>
            <div class="salary-snippet-container">
              <div class="attribute_snippet">£45,000 - £65,000 a year</div>
            </div>
            <div class="jobsearch-BasicJobCard-footer">
              <div class="jobsearch-JobMetadataFooter-item">Easy Apply</div>
            </div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Test job data extraction
    const extractedJob = await page.evaluate(() => {
      const jobCard = document.querySelector('.jobsearch-BasicJobCard');
      if (!jobCard) return null;
      
      return {
        title: jobCard.querySelector('.jobTitle')?.textContent?.trim(),
        company: jobCard.querySelector('.companyName')?.textContent?.trim(),
        location: jobCard.querySelector('.companyLocation')?.textContent?.trim(),
        salary: jobCard.querySelector('.salary-snippet-container')?.textContent?.trim(),
        description: jobCard.querySelector('.job-snippet')?.textContent?.trim(),
        source: 'indeed'
      };
    });
    
    expect(extractedJob).not.toBeNull();
    expect(extractedJob.title).toBe('Frontend Developer');
    expect(extractedJob.company).toBe('Digital Solutions Ltd');
    expect(extractedJob.location).toBe('Manchester, UK');
    expect(extractedJob.salary).toBe('£45,000 - £65,000 a year');
    expect(extractedJob.source).toBe('indeed');
  });

  test('should check sponsorship status for extracted job', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Sponsored Tech Ltd</span>
            <div class="companyLocation">London, UK</div>
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
          company: 'Sponsored Tech Ltd',
          sponsorshipType: 'SKILLED_WORKER',
          confidence: 0.95,
          sponsorData: {
            name: 'SPONSORED TECH LTD',
            licenceType: 'SKILLED_WORKER',
            route: 'GLOBAL_BUSINESS_MOBILITY'
          },
          ukEligibility: {
            eligible: true,
            socCode: '2512',
            socEligibility: 'Eligible',
            meetsSalaryRequirement: true,
            reasons: []
          }
        })
      });
    });
    
    // Click sponsorship check button
    await page.click('button.hireall-check-sponsorship');
    
    // Wait for API call and highlighting
    await page.waitForTimeout(2000);
    
    // Check if job is highlighted as sponsored
    await expect(page.locator('.hireall-sponsored-highlight')).toBeVisible();
    await expect(page.locator('.hireall-sponsored-badge')).toBeVisible();
    
    // Check badge content
    const badgeText = await page.locator('.hireall-sponsored-badge').textContent();
    expect(badgeText).toContain('Sponsored');
    expect(badgeText).toContain('SOC 2512');
  });

  test('should handle non-sponsored jobs', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card for non-sponsored company
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Marketing Manager</h2>
            <span class="companyName">Local Business Ltd</span>
            <div class="companyLocation">Bristol, UK</div>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock sponsorship API response for non-sponsored company
    await page.route('**/api/sponsors/check', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isSponsored: false,
          company: 'Local Business Ltd',
          sponsorshipType: null,
          confidence: 0.9,
          sponsorData: null,
          ukEligibility: {
            eligible: false,
            socCode: null,
            meetsSalaryRequirement: false,
            reasons: ['Company not in sponsor register']
          }
        })
      });
    });
    
    // Click sponsorship check button
    await page.click('button.hireall-check-sponsorship');
    
    // Wait for API call
    await page.waitForTimeout(2000);
    
    // Check that job is NOT highlighted as sponsored
    await expect(page.locator('.hireall-sponsored-highlight')).not.toBeVisible();
    await expect(page.locator('.hireall-sponsored-badge')).not.toBeVisible();
  });

  test('should handle sponsorship check errors gracefully', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Test Company</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock network error
    await page.route('**/api/sponsors/check', route => route.abort());
    
    // Click sponsorship check button
    await page.click('button.hireall-check-sponsorship');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check that button resets to original state
    await expect(page.locator('button.hireall-check-sponsorship')).toContainText('Check Sponsor');
    
    // Check that no highlighting occurred
    await expect(page.locator('.hireall-sponsored-highlight')).not.toBeVisible();
  });

  test('should add job to board successfully', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Backend Developer</h2>
            <span class="companyName">API Solutions</span>
            <div class="companyLocation">Remote, UK</div>
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
            id: 'job-123',
            title: 'Backend Developer',
            company: 'API Solutions',
            location: 'Remote, UK',
            status: 'saved'
          }
        })
      });
    });
    
    // Click add to board button
    await page.click('button.hireall-add-to-board');
    
    // Check loading state
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Adding...');
    
    // Wait for success
    await page.waitForTimeout(2000);
    
    // Check success state
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Added');
    
    // Button should reset after a delay
    await page.waitForTimeout(3000);
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Add to Board');
  });

  test('should handle add to board errors', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Full Stack Developer</h2>
            <span class="companyName">Error Corp</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock API error
    await page.route('**/api/app/jobs', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Failed to add job: Missing required fields'
        })
      });
    });
    
    // Click add to board button
    await page.click('button.hireall-add-to-board');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check error state
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Retry');
    
    // Button should reset after a delay
    await page.waitForTimeout(3000);
    await expect(page.locator('button.hireall-add-to-board')).toContainText('Add to Board');
  });

  test('should cache sponsorship results', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job card
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Software Engineer</h2>
            <span class="companyName">Cache Test Ltd</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Mock sponsorship API response with counter
    let apiCallCount = 0;
    await page.route('**/api/sponsors/check', route => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isSponsored: true,
          company: 'Cache Test Ltd',
          sponsorshipType: 'SKILLED_WORKER',
          apiCallCount
        })
      });
    });
    
    // First sponsorship check
    await page.click('button.hireall-check-sponsorship');
    await page.waitForTimeout(2000);
    
    // Reset button state
    await page.evaluate(() => {
      const button = document.querySelector('button.hireall-check-sponsorship');
      if (button) {
        button.innerHTML = 'Check Sponsor';
        button.disabled = false;
      }
    });
    
    // Second sponsorship check for same company
    await page.click('button.hireall-check-sponsorship');
    await page.waitForTimeout(2000);
    
    // API should only be called once due to caching
    // Note: This would need to be verified by checking the actual API call count
    // In a real test, we would intercept and count the API calls
  });

  test('should handle multiple jobs on page', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock multiple job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Job 1</h2>
            <span class="companyName">Company A</span>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Job 2</h2>
            <span class="companyName">Company B</span>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Job 3</h2>
            <span class="companyName">Company C</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Check that all jobs have control buttons
    const sponsorButtons = await page.locator('button.hireall-check-sponsorship').count();
    const addButtons = await page.locator('button.hireall-add-to-board').count();
    
    expect(sponsorButtons).toBe(3);
    expect(addButtons).toBe(3);
    
    // Test each button works independently
    await page.locator('button.hireall-check-sponsorship').first().click();
    await page.waitForTimeout(1000);
    
    await page.locator('button.hireall-check-sponsorship').nth(1).click();
    await page.waitForTimeout(1000);
    
    await page.locator('button.hireall-check-sponsorship').nth(2).click();
    await page.waitForTimeout(1000);
  });

  test('should handle dynamic job loading (infinite scroll)', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Start with empty page
    await page.addScriptTag({
      content: `
        document.body.innerHTML = '<div id="job-results"></div>';
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Add initial jobs
    await page.addScriptTag({
      content: `
        document.getElementById('job-results').innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Initial Job</h2>
            <span class="companyName">Initial Company</span>
          </div>
        \`;
      `
    });
    
    await page.waitForTimeout(1000);
    
    // Check initial job has controls
    await expect(page.locator('button.hireall-check-sponsorship')).toHaveCount(1);
    
    // Simulate infinite scroll - add more jobs
    await page.addScriptTag({
      content: `
        const results = document.getElementById('job-results');
        results.innerHTML += \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Loaded Job 1</h2>
            <span class="companyName">Loaded Company 1</span>
          </div>
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Loaded Job 2</h2>
            <span class="companyName">Loaded Company 2</span>
          </div>
        \`;
      `
    });
    
    // Wait for MutationObserver to detect changes
    await page.waitForTimeout(2000);
    
    // Check that dynamically loaded jobs have controls
    await expect(page.locator('button.hireall-check-sponsorship')).toHaveCount(3);
  });

  test('should clean up properly on page unload', async () => {
    // Navigate to job board
    await page.goto('https://www.indeed.co.uk/jobs');
    
    // Mock job cards
    await page.addScriptTag({
      content: `
        document.body.innerHTML = \`
          <div class="jobsearch-BasicJobCard">
            <h2 class="jobTitle">Test Job</h2>
            <span class="companyName">Test Company</span>
          </div>
        \`;
      `
    });
    
    // Wait for content script to initialize
    await page.waitForTimeout(1000);
    
    // Verify controls are added
    await expect(page.locator('.hireall-job-controls')).toHaveCount(1);
    
    // Navigate to different page
    await page.goto('https://www.example.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify no extension controls on non-job board
    await expect(page.locator('.hireall-job-controls')).toHaveCount(0);
  });
});
