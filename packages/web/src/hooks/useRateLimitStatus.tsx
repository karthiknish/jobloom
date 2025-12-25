"use client";

import { useState, useEffect, useCallback } from 'react';
import { rateLimitApi } from '@/utils/api/rateLimit';

export interface RateLimitStatus {
  remaining: number;
  maxRequests: number;
  resetIn: number;
  endpoint: string;
  isLimited: boolean;
  tier: 'free' | 'premium' | 'admin';
}

export function useRateLimitStatus(endpoint: string = 'general') {
  const [status, setStatus] = useState<RateLimitStatus>({
    remaining: 100,
    maxRequests: 100,
    resetIn: 0,
    endpoint,
    isLimited: false,
    tier: 'free',
  });
  
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async () => {
    try {
      // Get rate limit status from server using apiClient
      const data = await rateLimitApi.getStatus();
      
      setStatus(prev => ({
        ...prev,
        ...data,
        isLimited: data.remaining === 0,
      }));
      setError(null);
    } catch (err) {
      console.warn('Failed to fetch rate limit status:', err);
      setError('Unable to fetch rate limit status');
    }
  }, [endpoint]);

  useEffect(() => {
    // Update status immediately
    updateStatus();

    // Set up interval for regular updates
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, [updateStatus]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    try {
      // Make a test request to check current rate limit
      await rateLimitApi.check(endpoint);

      // Update status on successful request
      await updateStatus();
      return true;
    } catch (err: any) {
      console.warn('Rate limit check failed:', err);
      
      if (err.statusCode === 429) {
        setStatus(prev => ({
          ...prev,
          isLimited: true,
          resetIn: err.details?.resetIn || 0,
          retryAfter: err.details?.retryAfter,
        }));
      } else {
        setError('Failed to check rate limit');
      }
      return false;
    }
  }, [updateStatus]);

  const resetStatus = useCallback(() => {
    setStatus({
      remaining: 100,
      maxRequests: 100,
      resetIn: 0,
      endpoint,
      isLimited: false,
      tier: 'free',
    });
    setError(null);
  }, [endpoint]);

  return {
    status,
    error,
    updateStatus,
    checkLimit,
    resetStatus,
  };
}
