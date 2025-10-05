// Rate limiting status utilities for the extension
import { getRateLimitStatus, RATE_LIMITS } from './rateLimiter';

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

export interface RateLimitWarning {
  endpoint: string;
  message: string;
  level: 'warning' | 'error';
  resetIn: number;
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
  const endpoints = Object.keys(RATE_LIMITS);

  const statuses: Record<string, RateLimitDisplayInfo> = {};
  endpoints.forEach(endpoint => {
    statuses[endpoint] = getRateLimitDisplayInfo(endpoint);
  });

  return statuses;
}

/**
 * Check if any rate limits are close to being exceeded
 */
export async function checkRateLimitWarnings(): Promise<RateLimitWarning[]> {
  const warnings: RateLimitWarning[] = [];
  
  // Get statuses for all endpoints
  const endpoints = Object.keys(RATE_LIMITS);
  
  for (const endpoint of endpoints) {
    try {
      const status = getRateLimitStatus(endpoint);
      const percentageUsed = ((status.maxRequests - status.remaining) / status.maxRequests) * 100;
      const isNearLimit = percentageUsed >= 80;
      const isAtLimit = status.remaining === 0;

      if (isAtLimit) {
        warnings.push({
          endpoint,
          level: 'error',
          message: getRateLimitMessage(endpoint),
          resetIn: status.resetIn,
        });
      } else if (isNearLimit) {
        warnings.push({
          endpoint,
          level: 'warning',
          message: getRateLimitMessage(endpoint),
          resetIn: status.resetIn,
        });
      }
    } catch (error) {
      console.warn(`Failed to check rate limit status for ${endpoint}:`, error);
    }
  }

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
export function createRateLimitNotification(
  endpoint: string,
  message: string,
  level: 'warning' | 'error'
): {
  title: string;
  message: string;
  iconUrl: string;
  type: 'warning' | 'error';
} {
  return {
    title: level === 'error' ? 'Rate Limit Reached' : 'Rate Limit Warning',
    message,
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    type: level,
  };
}

/**
 * Show rate limit notification to user
 */
export function showRateLimitNotification(endpoint: string, message: string, level: 'warning' | 'error'): void {
  const notification = createRateLimitNotification(endpoint, message, level);

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
const displayedWarnings = new Map<string, number>();
let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

export function startRateLimitMonitoring(): void {
  if (monitorIntervalId !== null) {
    return;
  }

  monitorIntervalId = setInterval(() => {
    void (async () => {
      const warnings = await checkRateLimitWarnings();
      const now = Date.now();

      warnings.forEach((warning) => {
        const key = `${warning.endpoint}:${warning.level}`;
        const expiresAt = now + Math.max(warning.resetIn, 15000);

        if ((displayedWarnings.get(key) ?? 0) > now) {
          return;
        }

        console.warn('Rate limit warning:', warning.message);
        showRateLimitNotification(warning.endpoint, warning.message, warning.level);
        displayedWarnings.set(key, expiresAt);
      });

      // Clean up expired warning markers
      for (const [key, expiry] of displayedWarnings.entries()) {
        if (expiry <= now) {
          displayedWarnings.delete(key);
        }
      }
    })();
  }, 30000);
  
  // Ensure interval keeps running in background contexts
  if (typeof monitorIntervalId === 'number') {
    (globalThis as unknown as { __hireallRateLimitMonitor?: number }).__hireallRateLimitMonitor = monitorIntervalId;
  }
}
