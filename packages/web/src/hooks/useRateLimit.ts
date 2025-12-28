"use client";

import { useState, useCallback, useMemo } from 'react';
import { showError } from '@/components/ui/Toast';
import { ClientRateLimiter, RateLimitConfig } from '../lib/rateLimiter';
import { RATE_LIMITS } from '@hireall/shared';

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000,
  endpoint: 'general'
};

export function useRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = useMemo(() => {
    // If endpoint is provided and exists in RATE_LIMITS, use that config
    if (config.endpoint && RATE_LIMITS[config.endpoint]) {
      return { ...RATE_LIMITS[config.endpoint], ...config };
    }
    // Otherwise use default config with provided overrides
    return { ...DEFAULT_CONFIG, ...config };
  }, [config]);
  
  // Create a client rate limiter instance for this endpoint
  const [rateLimiter] = useState(() => new ClientRateLimiter(finalConfig.endpoint || 'default', finalConfig));
  
  const [rateLimitState, setRateLimitState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isLimited: false,
        remaining: finalConfig.maxRequests,
        resetTime: 0
      };
    }
    
    const result = rateLimiter.checkRateLimit();
    return {
      isLimited: !result.allowed,
      remaining: result.remaining || finalConfig.maxRequests,
      resetTime: result.resetIn || 0
    };
  });

  const checkRateLimit = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    
    const result = rateLimiter.checkRateLimit();
    const status = {
      isLimited: !result.allowed,
      remaining: result.remaining || 0,
      resetTime: result.resetIn || 0
    };
    setRateLimitState(status);
    
    if (status.isLimited) {
      const timeUntilReset = Math.ceil(status.resetTime / 1000);
      showError(`Too many requests. Please wait ${timeUntilReset} seconds before trying again.`);
      return false;
    }
    
    return true;
  }, [rateLimiter]);

  const getRemainingRequests = useCallback((): number => {
    if (typeof window === 'undefined') return finalConfig.maxRequests;
    return rateLimiter.getRemainingRequests();
  }, [rateLimiter, finalConfig.maxRequests]);

  const getTimeUntilReset = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    return rateLimiter.getTimeUntilReset();
  }, [rateLimiter]);

  const resetRateLimit = useCallback(() => {
    if (typeof window === 'undefined') return;
    rateLimiter.reset();
    const status = {
      isLimited: false,
      remaining: finalConfig.maxRequests,
      resetTime: 0
    };
    setRateLimitState(status);
  }, [rateLimiter, finalConfig.maxRequests]);

  return {
    checkRateLimit,
    getRemainingRequests,
    getTimeUntilReset,
    resetRateLimit,
    isLimited: rateLimitState.isLimited,
    remaining: rateLimitState.remaining
  };
}