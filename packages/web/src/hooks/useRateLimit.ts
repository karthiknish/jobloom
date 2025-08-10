"use client";

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface RateLimitState {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  lastRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  endpoint: 'default'
};

export function useRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const storageKey = `rateLimit_${finalConfig.endpoint}`;
  
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() => {
    if (typeof window === 'undefined') return {
      isLimited: false,
      remaining: finalConfig.maxRequests,
      resetTime: 0,
      lastRequest: 0
    };

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // Check if window has expired
      if (now - parsed.lastRequest > finalConfig.windowMs) {
        return {
          isLimited: false,
          remaining: finalConfig.maxRequests,
          resetTime: now + finalConfig.windowMs,
          lastRequest: now
        };
      }
      
      return parsed;
    }
    
    return {
      isLimited: false,
      remaining: finalConfig.maxRequests,
      resetTime: Date.now() + finalConfig.windowMs,
      lastRequest: 0
    };
  });

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset if window has passed
    if (now - rateLimitState.lastRequest > finalConfig.windowMs) {
      const newState = {
        isLimited: false,
        remaining: finalConfig.maxRequests - 1,
        resetTime: now + finalConfig.windowMs,
        lastRequest: now
      };
      setRateLimitState(newState);
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return true;
    }
    
    // Check if we have remaining requests
    if (rateLimitState.remaining <= 0) {
      const timeUntilReset = rateLimitState.resetTime - now;
      toast.error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      return false;
    }
    
    // Decrement remaining requests
    const newState = {
      ...rateLimitState,
      remaining: rateLimitState.remaining - 1,
      lastRequest: now,
      isLimited: rateLimitState.remaining - 1 <= 0
    };
    
    setRateLimitState(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
    
    return true;
  }, [rateLimitState, finalConfig, storageKey]);

  const getRemainingRequests = useCallback((): number => {
    const now = Date.now();
    
    // Reset if window has passed
    if (now - rateLimitState.lastRequest > finalConfig.windowMs) {
      return finalConfig.maxRequests;
    }
    
    return rateLimitState.remaining;
  }, [rateLimitState, finalConfig]);

  const getTimeUntilReset = useCallback((): number => {
    const now = Date.now();
    return Math.max(0, rateLimitState.resetTime - now);
  }, [rateLimitState]);

  const resetRateLimit = useCallback(() => {
    const now = Date.now();
    const newState = {
      isLimited: false,
      remaining: finalConfig.maxRequests,
      resetTime: now + finalConfig.windowMs,
      lastRequest: 0
    };
    setRateLimitState(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
  }, [finalConfig, storageKey]);

  return {
    checkRateLimit,
    getRemainingRequests,
    getTimeUntilReset,
    resetRateLimit,
    isLimited: rateLimitState.isLimited,
    remaining: rateLimitState.remaining
  };
}