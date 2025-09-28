// Rate limiting status utilities for the extension
import { checkRateLimit, getRateLimitStatus, getTimeUntilReset } from './rateLimiter';

// Rate limit status display utilities
export interface RateLimitDisplayInfo {
  endpoint: string;
  remaining: number;
  resetIn: number;
  maxRequests: number;
  percentageUsed: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

/**
 * Get comprehensive rate limit information for display
 */
export function getRateLimitDisplayInfo(endpoint: string): RateLimitDisplayInfo {
  const status = getRateLimitStatus(endpoint);
  const percentageUsed = ((status.maxRequests - status.remaining) / status.maxRequests) * 100;

  return {
    endpoint,
    remaining: status.remaining,
    resetIn: status.resetIn,
    maxRequests: status.maxRequests,
    percentageUsed,
    isNearLimit: percentageUsed >= 80,
    isAtLimit: status.remaining === 0,
  };
}

/**
 * Get all rate limit statuses for monitoring
 */
export function getAllRateLimitStatuses(): Record<string, RateLimitDisplayInfo> {
  const endpoints = ['job-add', 'sponsor-lookup', 'user-settings', 'general'];

  const statuses: Record<string, RateLimitDisplayInfo> = {};
  endpoints.forEach(endpoint => {
    statuses[endpoint] = getRateLimitDisplayInfo(endpoint);
  });

  return statuses;
}

/**
 * Check if any rate limits are close to being exceeded
 */
export function checkRateLimitWarnings(): string[] {
  const warnings: string[] = [];
  const statuses = getAllRateLimitStatuses();

  Object.entries(statuses).forEach(([endpoint, status]) => {
    if (status.isNearLimit && !status.isAtLimit) {
      const resetInMinutes = Math.ceil(status.resetIn / 60000);
      warnings.push(
        `${endpoint}: ${status.remaining} requests remaining. Resets in ${resetInMinutes} minutes.`
      );
    } else if (status.isAtLimit) {
      const resetInMinutes = Math.ceil(status.resetIn / 60000);
      warnings.push(
        `${endpoint}: Rate limit exceeded. Resets in ${resetInMinutes} minutes.`
      );
    }
  });

  return warnings;
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Get user-friendly rate limit message
 */
export function getRateLimitMessage(endpoint: string): string {
  const status = getRateLimitStatus(endpoint);

  if (status.remaining === 0) {
    return `Rate limit reached for ${endpoint}. Please wait ${formatTimeRemaining(status.resetIn)} before trying again.`;
  } else if (status.remaining <= 5) {
    return `Warning: Only ${status.remaining} ${endpoint} requests remaining. Limit resets in ${formatTimeRemaining(status.resetIn)}.`;
  }

  return `${status.remaining} ${endpoint} requests remaining.`;
}

/**
 * Create a rate limit notification for the user
 */
export function createRateLimitNotification(endpoint: string): {
  title: string;
  message: string;
  iconUrl: string;
  type: 'warning' | 'error';
} {
  const status = getRateLimitStatus(endpoint);
  const isAtLimit = status.remaining === 0;

  return {
    title: isAtLimit ? 'Rate Limit Reached' : 'Rate Limit Warning',
    message: getRateLimitMessage(endpoint),
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    type: isAtLimit ? 'error' : 'warning',
  };
}

/**
 * Show rate limit notification to user
 */
export function showRateLimitNotification(endpoint: string): void {
  const notification = createRateLimitNotification(endpoint);

  chrome.notifications.create(`rate-limit-${endpoint}-${Date.now()}`, {
    type: 'basic',
    iconUrl: notification.iconUrl,
    title: notification.title,
    message: notification.message,
    priority: notification.type === 'error' ? 2 : 1,
    requireInteraction: false,
  });
}

/**
 * Monitor rate limits and show notifications when needed
 */
export function startRateLimitMonitoring(): void {
  // Check every 30 seconds for rate limit warnings
  setInterval(() => {
    const warnings = checkRateLimitWarnings();

    warnings.forEach(warning => {
      console.warn('Rate limit warning:', warning);
      // Only show notification if it's a new warning
      if (!document.querySelector(`[data-rate-limit-warning="${warning}"]`)) {
        showRateLimitNotification('general');
      }
    });
  }, 30000);
}
