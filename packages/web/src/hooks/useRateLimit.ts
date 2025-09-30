"use client";

import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ClientRateLimiter } from '../lib/rateLimiter';

interface RateLimitConfig {
  endpoint: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  endpoint: 'default'
};

export function useRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // Create a client rate limiter instance for this endpoint
  const [rateLimiter] = useState(() => new ClientRateLimiter(finalConfig.endpoint));
  
  const [rateLimitState, setRateLimitState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isLimited: false,
        remaining: 10,
        resetTime: 0
      };
    }
    
    return rateLimiter.getStatus();
  });

  const checkRateLimit = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    
    const result = rateLimiter.checkLimit();
    setRateLimitState(rateLimiter.getStatus());
    
    if (result.isLimited) {
      const timeUntilReset = Math.ceil(result.resetTime / 1000);
      toast.error(`${result.errorMsg} Try again in ${timeUntilReset} seconds.`);
      return false;
    }
    
    return true;
  }, [rateLimiter]);

  const getRemainingRequests = useCallback((): number => {
    if (typeof window === 'undefined') return 10;
    return rateLimiter.getStatus().remaining;
  }, [rateLimiter]);

  const getTimeUntilReset = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    return rateLimiter.getStatus().resetTime;
  }, [rateLimiter]);

  const resetRateLimit = useCallback(() => {
    if (typeof window === 'undefined') return;
    rateLimiter.resetLimit();
    setRateLimitState(rateLimiter.getStatus());
  }, [rateLimiter]);

  return {
    checkRateLimit,
    getRemainingRequests,
    getTimeUntilReset,
    resetRateLimit,
    isLimited: rateLimitState.isLimited,
    remaining: rateLimitState.remaining
  };
}