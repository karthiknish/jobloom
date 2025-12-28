/// <reference types="jest" />
import { checkRateLimit, resetRateLimitState, getCurrentUserTier } from '../src/rateLimiter';
import { post } from '../src/apiClient';

// Mock apiClient
jest.mock('../src/apiClient', () => ({
  post: jest.fn(),
}));

// Mock getCurrentUserTier
jest.mock('../src/rateLimiter', () => {
  const original = jest.requireActual('../src/rateLimiter');
  return {
    ...original,
    getCurrentUserTier: jest.fn(() => Promise.resolve('free')),
  };
});

describe('Extension RateLimiter', () => {
  const mockPost = post as jest.Mock;
  const mockGetTier = getCurrentUserTier as jest.Mock;
  let now = 1000000;

  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimitState();
    mockGetTier.mockResolvedValue('free');
    
    // Mock Date.now()
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    
    // Mock chrome.storage.local.get to avoid warnings
    (global as any).chrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const result = { userTier: 'free', tierCheckTime: Date.now() };
      if (typeof keys === 'function') return keys(result);
      if (cb) cb(result);
      return Promise.resolve(result);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should allow a single request and call the server', async () => {
    mockPost.mockResolvedValue({ allowed: true, remaining: 29 });

    const result = await checkRateLimit('general');
    expect(result.allowed).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/api/rate-limit-check', { endpoint: 'general' }, true, expect.any(Object));
  });

  it('should block requests locally if burst limit is exceeded', async () => {
    mockPost.mockResolvedValue({ allowed: true, remaining: 25 });

    // Configuration for 'general' free tier is 30/min. 
    // Burst limit is 50% = 15 requests in 5 seconds.
    
    // Simulate 15 rapid requests (burst limit)
    for (let i = 0; i < 15; i++) {
      const resp = await checkRateLimit('general');
      expect(resp.allowed).toBe(true);
      now += 10; // Advance time slightly
    }
    
    expect(mockPost).toHaveBeenCalledTimes(15);
    
    // 16th request should be blocked locally
    const result = await checkRateLimit('general');
    expect(result.allowed).toBe(false);
    expect(result.resetIn).toBeLessThanOrEqual(5000);
    expect(mockPost).toHaveBeenCalledTimes(15);
  });

  it('should block requests locally if window limit is exceeded', async () => {
    mockPost.mockResolvedValue({ allowed: true, remaining: 0 });

    // Configuration for 'ai-resume' free tier is 3/min.
    // Burst limit is 50% = 2.
    
    await checkRateLimit('ai-resume');
    await checkRateLimit('ai-resume');
    
    expect(mockPost).toHaveBeenCalledTimes(2);
    
    // 3rd request should be blocked by burst limit (2 in 5s)
    const result = await checkRateLimit('ai-resume');
    expect(result.allowed).toBe(false);
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('should implement lockout after repeated violations', async () => {
    mockPost.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 60 });

    // Violate 5 times (ABUSE_VIOLATION_THRESHOLD)
    for (let i = 0; i < 5; i++) {
       await checkRateLimit('lockout-test');
    }

    // 6th request should be locked out for 15 minutes
    const result = await checkRateLimit('lockout-test');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(600); // 15 mins = 900s
    expect(mockPost).toHaveBeenCalledTimes(5); // Should not even try the 6th
  });

  it('should fallback to local state if server check fails', async () => {
    mockPost.mockRejectedValue(new Error('Server Down'));

    const result = await checkRateLimit('fallback-test');
    expect(result.allowed).toBe(true); // Recovery mode
    expect(result.remaining).toBeGreaterThan(0);
  });
});
