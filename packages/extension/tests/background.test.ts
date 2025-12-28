/// <reference types="jest" />

// Mocks from setup.ts are already in place
// We need to mock other internal dependencies that background.ts imports

jest.mock('../src/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

jest.mock('../src/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, resetIn: 0 }),
  initRateLimitCleanup: jest.fn(),
  fetchSubscriptionStatus: jest.fn(),
}));

jest.mock('../src/rateLimitStatus', () => ({
  startRateLimitMonitoring: jest.fn(),
}));

jest.mock('../src/authToken', () => ({
  cacheAuthToken: jest.fn(),
  acquireIdToken: jest.fn(),
  clearCachedAuthToken: jest.fn(),
}));

jest.mock('../src/firebase', () => ({
  signInWithGoogle: jest.fn(),
  getAuthInstance: jest.fn(),
  waitForAuthState: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  log: {
    extension: jest.fn(),
  }
}));

// Mock security components specifically
jest.mock('../src/security', () => ({
  validateMessage: jest.fn(() => true),
  validateUrl: jest.fn(() => true),
  sanitizeJobData: jest.fn((data) => data),
  validateJobData: jest.fn(() => ({ valid: true, errors: [] })),
  SecureStorage: {
    get: jest.fn(),
    set: jest.fn(),
  },
  ExtensionRateLimiter: jest.fn().mockImplementation(() => ({
    isAllowed: jest.fn(() => true),
  })),
  ExtensionSecurityLogger: {
    logSuspiciousActivity: jest.fn(),
    logValidationFailure: jest.fn(),
    log: jest.fn(),
  }
}));

// Better storage mock to handle both callback and promise
const createStorageMock = () => {
  const data: Record<string, any> = {};
  return {
    get: jest.fn((keys: any, cb?: any) => {
      const result: Record<string, any> = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach(k => result[k] = data[k]);
      if (typeof cb === 'function') {
        cb(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items: any, cb?: any) => {
      Object.assign(data, items);
      if (typeof cb === 'function') {
        cb();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys: any, cb?: any) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach(k => delete data[k]);
      if (typeof cb === 'function') {
        cb();
      }
      return Promise.resolve();
    }),
    clear: jest.fn((cb?: any) => {
      Object.keys(data).forEach(k => delete data[k]);
      if (typeof cb === 'function') {
        cb();
      }
      return Promise.resolve();
    }),
    _data: data
  };
};

const syncMock = createStorageMock();
const localMock = createStorageMock();

// Override the global chrome mock early
(global as any).chrome.storage.sync = syncMock;
(global as any).chrome.storage.local = localMock;

// Now try to require it
try {
  require('../src/background');
} catch (error) {
  console.error('Failed to load background.ts:', error);
}

describe('Extension Background Script', () => {
  let messageListener: any;
  let installedListener: any;

  beforeAll(() => {
    // Capture the listeners from the global chrome mock (defined in setup.ts)
    const onMessageMock = (chrome.runtime.onMessage.addListener as jest.Mock);
    const onInstalledMock = (chrome.runtime.onInstalled.addListener as jest.Mock);

    if (onMessageMock.mock.calls.length > 0) {
      messageListener = onMessageMock.mock.calls[0][0];
    }
    if (onInstalledMock.mock.calls.length > 0) {
      installedListener = onInstalledMock.mock.calls[0][0];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage data
    Object.keys(syncMock._data).forEach(k => delete syncMock._data[k]);
    Object.keys(localMock._data).forEach(k => delete localMock._data[k]);
  });

  it('should have registered listeners', () => {
    expect(messageListener).toBeDefined();
    expect(installedListener).toBeDefined();
  });

  describe('AUTH_STATE_CHANGED', () => {
    const mockSendResponse = jest.fn();

    it('should clear cache on logout', async () => {
      const message = {
        type: 'AUTH_STATE_CHANGED',
        payload: { isAuthenticated: false }
      };

      const result = messageListener(message, {}, mockSendResponse);
      expect(result).toBe(true);

      // Wait for async
      await new Promise(resolve => setTimeout(resolve, 10));

      const { clearCachedAuthToken } = require('../src/authToken');
      expect(clearCachedAuthToken).toHaveBeenCalled();
      expect(syncMock.remove).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should cache token on login', async () => {
      const message = {
        type: 'AUTH_STATE_CHANGED',
        payload: {
          isAuthenticated: true,
          token: 'test-token',
          userId: 'user-123'
        }
      };

      messageListener(message, {}, mockSendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      const { cacheAuthToken } = require('../src/authToken');
      expect(cacheAuthToken).toHaveBeenCalled();
      expect(syncMock.set).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123'
      }));
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('apiProxy', () => {
    const mockSendResponse = jest.fn();

    it('should block forbidden URLs', async () => {
      await syncMock.set({ webAppUrl: 'https://hireall.app' });
      
      const message = {
        action: 'apiProxy',
        data: { url: 'https://malicious.com/api/test' }
      };

      messageListener(message, { tab: { id: 1 } }, mockSendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSendResponse).toHaveBeenCalledWith({ success: false, error: 'Forbidden URL' });
    });

    it('should allow valid API URLs and perform fetch', async () => {
      await syncMock.set({ webAppUrl: 'https://hireall.app' });
      
      const message = {
        action: 'apiProxy',
        data: { 
          url: 'https://hireall.app/api/jobs',
          method: 'GET',
          requestId: 'req-1'
        }
      };

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve('{"jobs": []}')
      });

      messageListener(message, { tab: { id: 1 } }, mockSendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSendResponse).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        status: 200,
        bodyText: '{"jobs": []}'
      }));
    });
  });

  describe('SESSION_PROOF_FAILED', () => {
    const mockSendResponse = jest.fn();

    it('should set recovery state and badge', async () => {
      const message = {
        type: 'SESSION_PROOF_FAILED',
        payload: { message: 'Expired' }
      };

      messageListener(message, {}, mockSendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
      expect(localMock.set).toHaveBeenCalledWith(expect.objectContaining({
        hireallSessionRecovery: expect.objectContaining({ needed: true })
      }));
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Job Handlers', () => {
    const mockSendResponse = jest.fn();

    it('should handle addJob with valid LinkedIn URL', async () => {
      const message = {
        action: 'addJob',
        data: { 
          url: 'https://www.linkedin.com/jobs/view/123',
          company: 'Test Co',
          title: 'Engineer'
        }
      };

      messageListener(message, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should reject addJob with invalid URL', async () => {
      const message = {
        action: 'addJob',
        data: { url: 'https://google.com' }
      };

      messageListener(message, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Unsupported job source' });
    });
  });

  describe('googleSignIn', () => {
    const mockSendResponse = jest.fn();

    it('should start sign-in and return success immediately', async () => {
      const message = { action: 'googleSignIn' };
      
      const result = messageListener(message, { tab: { id: 1 } }, mockSendResponse);
      
      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true, started: true });
      
      // Wait for async oauth flow
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const { signInWithGoogle } = require('../src/firebase');
      expect(signInWithGoogle).toHaveBeenCalled();
    });
  });
});
