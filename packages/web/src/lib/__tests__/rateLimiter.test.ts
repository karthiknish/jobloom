import { ClientRateLimiter, checkServerRateLimit } from '../rateLimiter';
import { TIERED_RATE_LIMITS } from '@hireall/shared';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/safeBrowserStorage';
import { SecurityLogger } from '@/utils/security';

jest.mock('@/utils/safeBrowserStorage');
jest.mock('@/utils/security');

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the server-side store (since it's a module-level variable)
    // In a real scenario we might need to expose a cleanup function for tests
  });

  describe('ClientRateLimiter', () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    const limiter = new ClientRateLimiter('test-endpoint', config);

    it('should allow requests within the limit', () => {
      (safeLocalStorageGet as jest.Mock).mockReturnValue(null);
      
      const result = limiter.checkRateLimit();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(safeLocalStorageSet).toHaveBeenCalled();
    });

    it('should block requests exceeding the limit', () => {
      const now = Date.now();
      const state = JSON.stringify({
        count: 2,
        resetTime: now + 500,
        lastRequest: now
      });
      (safeLocalStorageGet as jest.Mock).mockReturnValue(state);

      const result = limiter.checkRateLimit();
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after windowMs', () => {
      const past = Date.now() - 2000;
      const state = JSON.stringify({
        count: 5,
        resetTime: past + 500,
        lastRequest: past
      });
      (safeLocalStorageGet as jest.Mock).mockReturnValue(state);

      const result = limiter.checkRateLimit();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('ServerRateLimit', () => {
    const identifier = 'user-123';
    const endpoint = 'job-add';

    it('should allow requests for free tier', () => {
      const result = checkServerRateLimit(identifier, endpoint, {}, 'free');
      expect(result.allowed).toBe(true);
      expect(result.maxRequests).toBe(TIERED_RATE_LIMITS[endpoint].free.maxRequests);
    });

    it('should respect premium tier limits', () => {
      const result = checkServerRateLimit(identifier + '-prem', endpoint, {}, 'premium');
      expect(result.allowed).toBe(true);
      expect(result.maxRequests).toBe(TIERED_RATE_LIMITS[endpoint].premium.maxRequests);
    });

    it('should block burst activity', () => {
      // TIERED_RATE_LIMITS['job-add'].free.maxRequests is 10
      // Burst threshold multiplier is 0.5 (so 5 requests)
      
      // Simulate 5 rapid requests
      for (let i = 0; i < 5; i++) {
        checkServerRateLimit('burst-user', endpoint, {}, 'free');
      }

      const result = checkServerRateLimit('burst-user', endpoint, {}, 'free');
      expect(result.allowed).toBe(false);
      expect(result.abuseDetected).toBe(true);
      expect(SecurityLogger.logSecurityEvent).toHaveBeenCalled();
    });
  });
});
