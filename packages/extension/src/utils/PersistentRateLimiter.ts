/**
 * Persistent Rate Limiter using chrome.storage.local
 * 
 * Unlike the in-memory ExtensionRateLimiter, this persists across service worker restarts,
 * preventing attackers from bypassing rate limits by triggering worker restarts.
 */

interface RateLimitEntry {
  timestamps: number[];
  lastUpdated: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

const STORAGE_KEY_PREFIX = 'hireall_ratelimit_';
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES_PER_LIMITER = 100; // Prevent unbounded growth

let cleanupScheduled = false;

/**
 * PersistentRateLimiter - Rate limiting that survives service worker restarts
 * 
 * Uses chrome.storage.local for persistence with automatic cleanup of expired entries.
 * Falls back to in-memory tracking if storage operations fail.
 */
export class PersistentRateLimiter {
  private namespace: string;
  private windowMs: number;
  private maxRequests: number;
  private memoryFallback: Map<string, number[]>;

  constructor(namespace: string, windowMs: number, maxRequests: number) {
    this.namespace = namespace;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.memoryFallback = new Map();
    
    // Schedule periodic cleanup
    this.scheduleCleanup();
  }

  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.namespace}`;
  }

  /**
   * Check if a request is allowed and record it
   */
  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const storageKey = this.getStorageKey();
      const result = await chrome.storage.local.get([storageKey]);
      const store: RateLimitStore = result[storageKey] || {};
      
      // Get existing timestamps for this identifier
      const entry = store[identifier] || { timestamps: [], lastUpdated: now };
      
      // Filter out expired timestamps
      const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
      
      // Check if under limit
      if (validTimestamps.length >= this.maxRequests) {
        return false;
      }
      
      // Add current request
      validTimestamps.push(now);
      
      // Update store
      store[identifier] = {
        timestamps: validTimestamps,
        lastUpdated: now
      };
      
      // Limit entries to prevent unbounded growth
      const keys = Object.keys(store);
      if (keys.length > MAX_ENTRIES_PER_LIMITER) {
        // Remove oldest entries
        const sorted = keys.sort((a, b) => {
          return (store[a]?.lastUpdated || 0) - (store[b]?.lastUpdated || 0);
        });
        const toRemove = sorted.slice(0, keys.length - MAX_ENTRIES_PER_LIMITER);
        for (const key of toRemove) {
          delete store[key];
        }
      }
      
      await chrome.storage.local.set({ [storageKey]: store });
      return true;
      
    } catch (error) {
      // Fall back to in-memory tracking
      console.warn('PersistentRateLimiter: Storage failed, using memory fallback', error);
      return this.isAllowedMemory(identifier, now, windowStart);
    }
  }

  /**
   * Synchronous check - uses memory fallback for immediate response
   * Use this for performance-critical paths, but prefer isAllowed() for accuracy
   */
  isAllowedSync(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    return this.isAllowedMemory(identifier, now, windowStart);
  }

  private isAllowedMemory(identifier: string, now: number, windowStart: number): boolean {
    const timestamps = this.memoryFallback.get(identifier) || [];
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.memoryFallback.set(identifier, validTimestamps);
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const storageKey = this.getStorageKey();
      const result = await chrome.storage.local.get([storageKey]);
      const store: RateLimitStore = result[storageKey] || {};
      const entry = store[identifier] || { timestamps: [], lastUpdated: now };
      const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
      return Math.max(0, this.maxRequests - validTimestamps.length);
    } catch {
      const timestamps = this.memoryFallback.get(identifier) || [];
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      return Math.max(0, this.maxRequests - validTimestamps.length);
    }
  }

  /**
   * Get time until rate limit resets (in ms)
   */
  async getResetTime(identifier: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const storageKey = this.getStorageKey();
      const result = await chrome.storage.local.get([storageKey]);
      const store: RateLimitStore = result[storageKey] || {};
      const entry = store[identifier] || { timestamps: [], lastUpdated: now };
      const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
      
      if (validTimestamps.length === 0) return 0;
      
      const oldest = Math.min(...validTimestamps);
      return Math.max(0, oldest + this.windowMs - now);
    } catch {
      return this.windowMs;
    }
  }

  /**
   * Clear rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    this.memoryFallback.delete(identifier);
    
    try {
      const storageKey = this.getStorageKey();
      const result = await chrome.storage.local.get([storageKey]);
      const store: RateLimitStore = result[storageKey] || {};
      delete store[identifier];
      await chrome.storage.local.set({ [storageKey]: store });
    } catch (error) {
      console.warn('PersistentRateLimiter: Failed to reset', error);
    }
  }

  /**
   * Clear all rate limits for this limiter
   */
  async resetAll(): Promise<void> {
    this.memoryFallback.clear();
    
    try {
      const storageKey = this.getStorageKey();
      await chrome.storage.local.remove([storageKey]);
    } catch (error) {
      console.warn('PersistentRateLimiter: Failed to reset all', error);
    }
  }

  /**
   * Schedule periodic cleanup of expired entries
   */
  private scheduleCleanup(): void {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    
    // Use chrome alarms for reliable scheduling in MV3
    if (chrome.alarms) {
      chrome.alarms.create('ratelimit-cleanup', {
        periodInMinutes: CLEANUP_INTERVAL_MS / 60000
      });
      
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'ratelimit-cleanup') {
          this.cleanup();
        }
      });
    }
  }

  /**
   * Clean up expired entries from storage
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    try {
      const storageKey = this.getStorageKey();
      const result = await chrome.storage.local.get([storageKey]);
      const store: RateLimitStore = result[storageKey] || {};
      
      let modified = false;
      for (const [identifier, entry] of Object.entries(store)) {
        const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
        
        if (validTimestamps.length === 0) {
          delete store[identifier];
          modified = true;
        } else if (validTimestamps.length !== entry.timestamps.length) {
          store[identifier] = {
            timestamps: validTimestamps,
            lastUpdated: now
          };
          modified = true;
        }
      }
      
      if (modified) {
        await chrome.storage.local.set({ [storageKey]: store });
      }
    } catch (error) {
      console.warn('PersistentRateLimiter: Cleanup failed', error);
    }
    
    // Clean memory fallback
    for (const [identifier, timestamps] of this.memoryFallback) {
      const valid = timestamps.filter(ts => ts > windowStart);
      if (valid.length === 0) {
        this.memoryFallback.delete(identifier);
      } else {
        this.memoryFallback.set(identifier, valid);
      }
    }
  }
}

/**
 * Create a persistent rate limiter with sensible defaults
 */
export function createPersistentRateLimiter(
  namespace: string,
  windowMs: number,
  maxRequests: number
): PersistentRateLimiter {
  return new PersistentRateLimiter(namespace, windowMs, maxRequests);
}

/**
 * Clear all rate limit data from storage
 * Useful during extension install/update
 */
export async function clearAllRateLimitData(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(result).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
    
    // Also clear any rate limit alarms
    if (chrome.alarms) {
      await chrome.alarms.clear('ratelimit-cleanup');
    }
  } catch (error) {
    console.warn('Failed to clear rate limit data', error);
  }
}
