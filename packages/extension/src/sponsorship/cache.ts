/**
 * Unified Sponsorship Cache
 * 
 * Provides centralized caching with TTL support for sponsorship lookups.
 * Used by both sponsorship/lookup.ts and SponsorshipManager.ts to prevent
 * duplicate API calls and ensure consistent cache behavior.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SponsorshipCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * Check if a key exists in cache (even if null value)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get from cache or fetch if not present.
   * Deduplicates concurrent requests for the same key.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = CACHE_TTL_MS
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null || this.has(key)) {
      console.debug(`[SponsorshipCache] Cache hit for ${key}`);
      return cached as T;
    }

    // Check if fetch is already in progress
    if (this.inFlight.has(key)) {
      console.debug(`[SponsorshipCache] Deduplicating request for ${key}`);
      return this.inFlight.get(key) as Promise<T>;
    }

    // Execute fetch with deduplication
    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Remove a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache size for debugging
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get number of in-flight requests
   */
  get inFlightCount(): number {
    return this.inFlight.size;
  }
}

// Export singleton instance
export const sponsorshipCache = new SponsorshipCache();

// Export for SOC code caching (separate namespace)
export const socCodeCache = new SponsorshipCache();
