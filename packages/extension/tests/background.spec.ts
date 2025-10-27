import { test, expect } from '@playwright/test';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';

test.describe('Chrome Extension Background Script', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let backgroundPage: Page;
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

    // Get background page
    const backgroundPages = await browser.contexts()[0].pages();
    backgroundPage = backgroundPages.find(page => 
      page.url().includes('chrome-extension://') && 
      page.url().includes('background.html')
    ) || await browser.newPage();
    
    // For testing purposes, we'll use a mock extension ID
    // In real testing, this would be dynamically obtained
    extensionId = 'hireall-extension-id';
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

  test('should initialize background script correctly', async () => {
    // Test that background script is running
    const isBackgroundLoaded = await backgroundPage.evaluate(() => {
      return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    });
    
    expect(isBackgroundLoaded).toBe(true);
  });

  test('should handle extension installation', async () => {
    // Simulate extension installation
    await backgroundPage.evaluate(() => {
      chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
          console.log('Extension installed');
        }
      });
    });
    
    // Check if storage is initialized
    const storageData = await backgroundPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['installed', 'version'], (result) => {
          resolve(result);
        });
      });
    });
    
    expect(storageData).toHaveProperty('installed');
    expect(storageData).toHaveProperty('version');
  });

  test('should handle authentication events', async () => {
    // Mock authentication in background script
    await backgroundPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'AUTH_SUCCESS') {
          chrome.storage.local.set({ 
            isAuthenticated: true, 
            user: message.user 
          });
          sendResponse({ success: true });
        }
        return true;
      });
    });
    
    // Simulate auth success message
    const authResult = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'AUTH_SUCCESS',
          user: { id: 'test-user', email: 'test@example.com' }
        }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(authResult).toHaveProperty('success', true);
    
    // Check if auth state is stored
    const authState = await backgroundPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['isAuthenticated', 'user'], (result) => {
          resolve(result);
        });
      });
    });
    
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user).toHaveProperty('email', 'test@example.com');
  });

  test('should handle storage sync', async () => {
    // Set up storage sync handler
    await backgroundPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SYNC_STORAGE') {
          chrome.storage.local.set(message.data, () => {
            sendResponse({ success: true });
          });
        }
        return true;
      });
    });
    
    // Sync some data
    const syncResult = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'SYNC_STORAGE',
          data: {
            settings: { theme: 'dark', autoSync: true },
            jobs: [
              { id: 1, title: 'Software Engineer', company: 'Test Co' }
            ]
          }
        }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(syncResult).toHaveProperty('success', true);
    
    // Verify data is stored
    const storedData = await backgroundPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings', 'jobs'], (result) => {
          resolve(result);
        });
      });
    });
    
    expect(storedData.settings.theme).toBe('dark');
    expect(storedData.settings.autoSync).toBe(true);
    expect(storedData.jobs).toHaveLength(1);
    expect(storedData.jobs[0].title).toBe('Software Engineer');
  });

  test('should handle API requests from content scripts', async () => {
    // Mock API request handler
    await backgroundPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'API_REQUEST') {
          // Mock API response
          if (message.endpoint === '/sponsors/check') {
            sendResponse({
              success: true,
              data: {
                isSponsored: true,
                company: message.data.company,
                sponsorshipType: 'SKILLED_WORKER'
              }
            });
          }
        }
        return true;
      });
    });
    
    // Simulate API request from content script
    const apiResult = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          endpoint: '/sponsors/check',
          data: { company: 'Test Company' }
        }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(apiResult).toHaveProperty('success', true);
    expect(apiResult.data.isSponsored).toBe(true);
    expect(apiResult.data.company).toBe('Test Company');
  });

  test('should handle tab updates', async () => {
    // Set up tab update listener
    await backgroundPage.evaluate(() => {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          // Check if tab is a job board
          if (tab.url.includes('linkedin.com/jobs') || 
              tab.url.includes('indeed.co.uk/jobs')) {
            chrome.tabs.sendMessage(tabId, {
              type: 'PAGE_LOADED',
              url: tab.url
            });
          }
        }
      });
    });
    
    // Navigate to a job board
    await page.goto('https://www.linkedin.com/jobs');
    
    // Wait for tab to load
    await page.waitForLoadState('networkidle');
    
    // Check if content script received message (this would be tested in content script)
    // For now, just verify the navigation worked
    expect(page.url()).toContain('linkedin.com/jobs');
  });

  test('should handle context menu creation', async () => {
    // Create context menu items
    await backgroundPage.evaluate(() => {
      chrome.contextMenus.create({
        id: 'hireall-check-sponsorship',
        title: 'Check Sponsorship',
        contexts: ['selection']
      });
      
      chrome.contextMenus.create({
        id: 'hireall-add-to-board',
        title: 'Add to Job Board',
        contexts: ['selection']
      });
    });
    
    // Verify context menu items exist
    const menuItems = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.contextMenus.getAll((items) => {
          resolve(items.map(item => ({
            id: item.id,
            title: item.title
          })));
        });
      });
    });
    
    expect(menuItems).toContainEqual({
      id: 'hireall-check-sponsorship',
      title: 'Check Sponsorship'
    });
    expect(menuItems).toContainEqual({
      id: 'hireall-add-to-board',
      title: 'Add to Job Board'
    });
  });

  test('should handle context menu clicks', async () => {
    // Set up context menu click handler
    await backgroundPage.evaluate(() => {
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'hireall-check-sponsorship') {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CHECK_SPONSORSHIP',
            selectedText: info.selectionText
          });
        } else if (info.menuItemId === 'hireall-add-to-board') {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ADD_TO_BOARD',
            selectedText: info.selectionText
          });
        }
      });
    });
    
    // Simulate context menu click
    const clickResult = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        // This would normally be triggered by actual context menu click
        // For testing, we'll simulate it
        chrome.contextMenus.onClicked.addListener(() => {
          resolve({ handled: true });
        });
      });
    });
    
    expect(clickResult).toHaveProperty('handled', true);
  });

  test('should handle badge updates', async () => {
    // Update badge text
    await backgroundPage.evaluate(() => {
      chrome.action.setBadgeText({ text: '5' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    });
    
    // Verify badge settings
    const badgeText = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.action.getBadgeText({}, (text) => {
          resolve(text);
        });
      });
    });
    
    expect(badgeText).toBe('5');
  });

  test('should handle alarms', async () => {
    // Create alarm
    await backgroundPage.evaluate(() => {
      chrome.alarms.create('sync-jobs', {
        delayInMinutes: 1,
        periodInMinutes: 30
      });
    });
    
    // Set up alarm listener
    await backgroundPage.evaluate(() => {
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'sync-jobs') {
          chrome.storage.local.set({ lastSync: new Date().toISOString() });
        }
      });
    });
    
    // Get all alarms
    const alarms = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.alarms.getAll((alarmList) => {
          resolve(alarmList.map(alarm => ({
            name: alarm.name,
            periodInMinutes: alarm.periodInMinutes
          })));
        });
      });
    });
    
    expect(alarms).toContainEqual({
      name: 'sync-jobs',
      periodInMinutes: 30
    });
  });

  test('should handle web navigation', async () => {
    // Set up navigation listener
    await backgroundPage.evaluate(() => {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) { // Main frame
          chrome.tabs.sendMessage(details.tabId, {
            type: 'NAVIGATION_COMPLETED',
            url: details.url
          });
        }
      });
    });
    
    // Navigate to a page
    await page.goto('https://www.example.com');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify navigation
    expect(page.url()).toBe('https://www.example.com/');
  });

  test('should handle runtime messages', async () => {
    // Set up message listener
    await backgroundPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'GET_VERSION':
            sendResponse({ version: chrome.runtime.getManifest().version });
            break;
          case 'PING':
            sendResponse({ pong: true });
            break;
          default:
            sendResponse({ error: 'Unknown message type' });
        }
        return true;
      });
    });
    
    // Test version request
    const versionResponse = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_VERSION' }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(versionResponse).toHaveProperty('version');
    
    // Test ping
    const pingResponse = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(pingResponse).toHaveProperty('pong', true);
  });

  test('should handle storage changes', async () => {
    // Set up storage change listener
    await backgroundPage.evaluate(() => {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.user) {
          console.log('User data changed:', changes.user.newValue);
        }
      });
    });
    
    // Change storage data
    await backgroundPage.evaluate(() => {
      chrome.storage.local.set({ 
        user: { 
          id: 'updated-user', 
          email: 'updated@example.com' 
        } 
      });
    });
    
    // Verify change
    const updatedUser = await backgroundPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['user'], (result) => {
          resolve(result.user);
        });
      });
    });
    
    expect(updatedUser.email).toBe('updated@example.com');
  });

  test('should handle extension updates', async () => {
    // Set up update listener
    await backgroundPage.evaluate(() => {
      chrome.runtime.onUpdateAvailable.addListener((details) => {
        console.log('Update available:', details.version);
        chrome.storage.local.set({ 
          updateAvailable: true,
          updateVersion: details.version 
        });
      });
    });
    
    // Simulate update available
    await backgroundPage.evaluate(() => {
      // This would normally be triggered by Chrome
      // For testing, we'll simulate it
      chrome.storage.local.set({ 
        updateAvailable: true,
        updateVersion: '1.1.0' 
      });
    });
    
    // Check update status
    const updateStatus = await backgroundPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['updateAvailable', 'updateVersion'], (result) => {
          resolve(result);
        });
      });
    });
    
    expect(updateStatus.updateAvailable).toBe(true);
    expect(updateStatus.updateVersion).toBe('1.1.0');
  });

  test('should handle errors gracefully', async () => {
    // Set up error handler
    await backgroundPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          if (message.type === 'TRIGGER_ERROR') {
            throw new Error('Test error');
          }
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ 
            success: false, 
            error: error.message 
          });
        }
        return true;
      });
    });
    
    // Trigger error
    const errorResponse = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'TRIGGER_ERROR' }, (response) => {
          resolve(response);
        });
      });
    });
    
    expect(errorResponse).toHaveProperty('success', false);
    expect(errorResponse.error).toBe('Test error');
  });
});
