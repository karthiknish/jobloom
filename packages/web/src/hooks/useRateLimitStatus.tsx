"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { rateLimitApi } from '@/utils/api/rateLimit';
import { useToast } from '@/hooks/use-toast';

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
  const hasNotifiedError = useRef(false);
  const { toast } = useToast();

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
      hasNotifiedError.current = false;
    } catch (err) {
      console.warn('Failed to fetch rate limit status:', err);
      const message = 'Unable to fetch rate limit status';
      setError(message);
      if (!hasNotifiedError.current) {
        toast({
          variant: "destructive",
          title: "Rate limit status unavailable",
          description: message,
        });
        hasNotifiedError.current = true;
      }
    }
  }, [endpoint, toast]);

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
        toast({
          variant: "destructive",
          title: "Rate limit reached",
          description: "You have hit the rate limit for now. Please retry shortly.",
        });
      } else {
        const message = 'Failed to check rate limit';
        setError(message);
        if (!hasNotifiedError.current) {
          toast({
            variant: "destructive",
            title: "Rate limit check failed",
            description: message,
          });
          hasNotifiedError.current = true;
        }
      }
      return false;
    }
  }, [toast, updateStatus]);

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
