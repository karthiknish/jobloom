"use client";

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateLimitIndicatorProps {
  maxRequests: number;
  remaining: number;
  resetIn: number;
  className?: string;
  compact?: boolean;
}

export function RateLimitIndicator({
  maxRequests,
  remaining,
  resetIn,
  className,
  compact = false,
}: RateLimitIndicatorProps) {
  const [timeUntilReset, setTimeUntilReset] = useState(resetIn);
  const percentage = Math.max(0, Math.min(100, (remaining / maxRequests) * 100));
  
  useEffect(() => {
    if (resetIn > 0) {
      const interval = setInterval(() => {
        setTimeUntilReset((prev) => Math.max(0, prev - 1000));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [resetIn]);

  const getStatusColor = () => {
    if (percentage === 0) return 'text-destructive';
    if (percentage < 20) return 'text-orange-600';
    if (percentage < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (percentage === 0) return AlertTriangle;
    if (percentage < 20) return Clock;
    return Zap;
  };

  const formatTime = (ms: number) => {
    if (ms === 0) return 'Ready';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  const Icon = getStatusIcon();

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/50 backdrop-blur-sm",
        className
      )}>
        <Icon className={cn("h-4 w-4", getStatusColor())} />
        <span className={cn("text-sm font-medium", getStatusColor())}>
          {remaining}/{maxRequests}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(timeUntilReset)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border bg-background/50 backdrop-blur-sm space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", getStatusColor())} />
          <h3 className="font-semibold">Rate Limit</h3>
        </div>
        <div className={cn("text-sm font-medium", getStatusColor())}>
          {remaining}/{maxRequests}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percentage === 0
                ? "bg-destructive"
                : percentage < 20
                ? "bg-orange-500"
                : percentage < 50
                ? "bg-yellow-500"
                : "bg-green-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {percentage === 0
            ? "Limit reached"
            : `${Math.round(percentage)}% available`}
        </span>
        <span className="text-muted-foreground">
          {timeUntilReset > 0
            ? `Resets in ${formatTime(timeUntilReset)}`
            : "No limit"}
        </span>
      </div>

      {/* Additional info for low remaining requests */}
      {percentage < 20 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500" />
          <span>
            {percentage === 0
              ? "Rate limit reached. Please wait before making more requests."
              : "Approaching rate limit. Consider spacing out your requests."}
          </span>
        </div>
      )}
    </div>
  );
}

export function PremiumRateLimitBadge({
  plan,
  maxRequests,
  className,
}: {
  plan: 'free' | 'premium' | 'admin';
  maxRequests: number;
  className?: string;
}) {
  const getPlanColor = () => {
    switch (plan) {
      case 'premium':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getPlanIcon = () => {
    switch (plan) {
      case 'premium':
        return Zap;
      case 'admin':
        return Shield;
      default:
        return Clock;
    }
  };

  const Icon = getPlanIcon();

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
      getPlanColor(),
      className
    )}>
      <Icon className="h-3 w-3" />
      <span>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
      <span className="opacity-80">{maxRequests}/min</span>
    </div>
  );
}
