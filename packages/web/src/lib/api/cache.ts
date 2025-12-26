/**
 * In-Memory Cache with TTL and LRU Eviction
 * 
 * Features:
 * - Time-to-live (TTL) for automatic expiration
 * - LRU (Least Recently Used) eviction when max size reached
 * - Stale-while-revalidate pattern support
 * - Cache statistics for monitoring
 */

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
  staleAt?: number;
}

interface CacheConfig {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum number of entries */
  maxSize: number;
  /** Stale-while-revalidate window in ms (optional) */
  staleWhileRevalidate?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  evictions: number;
  size: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  staleWhileRevalidate: 60 * 1000, // 1 minute
};

/**
 * Generic cache class with TTL and LRU eviction
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    evictions: 0,
    size: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return undefined;
    }

    // Check if stale (but still valid for stale-while-revalidate)
    if (entry.staleAt && now > entry.staleAt) {
      this.stats.staleHits++;
    } else {
      this.stats.hits++;
    }

    // Update last accessed for LRU
    entry.lastAccessed = now;
    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }
    
    return true;
  }

  /**
   * Check if entry is stale (past stale time but before expiry)
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || !entry.staleAt) return false;
    
    const now = Date.now();
    return now > entry.staleAt && now <= entry.expiresAt;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const actualTTL = ttl ?? this.config.defaultTTL;
    
    // Evict LRU entries if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + actualTTL,
      lastAccessed: now,
      staleAt: this.config.staleWhileRevalidate 
        ? now + actualTTL - this.config.staleWhileRevalidate 
        : undefined,
    };

    if (!this.cache.has(key)) {
      this.stats.size++;
    }
    
    this.cache.set(key, entry);
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.size--;
    }
    return existed;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Clear expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }
    
    this.stats.size -= pruned;
    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size--;
    }
  }
}

// ============================================================================
// CACHE INSTANCES FOR DIFFERENT USE CASES
// ============================================================================

/** Cache for API responses (5 min TTL) */
export const apiCache = new Cache({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 500,
  staleWhileRevalidate: 60 * 1000,
});

/** Cache for user data (10 min TTL) */
export const userCache = new Cache({
  defaultTTL: 10 * 60 * 1000,
  maxSize: 200,
});

/** Cache for expensive computations (30 min TTL) */
export const computeCache = new Cache({
  defaultTTL: 30 * 60 * 1000,
  maxSize: 100,
});

/** Cache for SOC codes/sponsor data (1 hour TTL) */
export const referenceCache = new Cache({
  defaultTTL: 60 * 60 * 1000,
  maxSize: 1000,
});

// ============================================================================
// WRAPPER FUNCTIONS
// ============================================================================

interface CacheOptions {
  /** Cache key */
  key: string;
  /** TTL in milliseconds */
  ttl?: number;
  /** Which cache instance to use */
  cache?: Cache;
  /** Force refresh even if cached */
  forceRefresh?: boolean;
}

/**
 * Wrapper to cache expensive async operations
 * 
 * @example
 * const result = await withCache(
 *   { key: `user:${userId}`, ttl: 5 * 60 * 1000 },
 *   () => fetchUserFromDatabase(userId)
 * );
 */
export async function withCache<T>(
  options: CacheOptions,
  fn: () => Promise<T>
): Promise<T> {
  const cache = options.cache ?? apiCache;
  const { key, ttl, forceRefresh } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached as T;
    }
  }

  // Execute function and cache result
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

/**
 * Stale-while-revalidate pattern
 * Returns cached value immediately if available, refreshes in background
 */
export async function withSWR<T>(
  options: CacheOptions,
  fn: () => Promise<T>
): Promise<T> {
  const cache = options.cache ?? apiCache;
  const { key, ttl } = options;

  const cached = cache.get(key);
  
  // If we have a cached value
  if (cached !== undefined) {
    // If stale, refresh in background
    if (cache.isStale(key)) {
      fn().then(result => {
        cache.set(key, result, ttl);
      }).catch(err => {
        console.error(`[Cache SWR] Background refresh failed for ${key}:`, err);
      });
    }
    return cached as T;
  }

  // No cached value, fetch synchronously
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

/**
 * Create a cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * Invalidate cache entries by prefix
 */
export function invalidateByPrefix(prefix: string, cache: Cache = apiCache): number {
  let invalidated = 0;
  // Note: This is O(n), use sparingly
  for (const key of (cache as any).cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      invalidated++;
    }
  }
  return invalidated;
}
