
type CachedUser = {
  data: Record<string, any> | null;
  expiresAt: number;
};

export const userCache = new Map<string, CachedUser>();
export const DEFAULT_CACHE_TTL_MS = 60_000;
export const MAX_CACHE_SIZE = 1000;

// Clean up cache periodically
export function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (value.expiresAt < now) {
      userCache.delete(key);
    }
  }
  
  // If still too large, remove oldest entries
  if (userCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(userCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => userCache.delete(key));
  }
}

export function clearUserAuthCache(uid?: string): void {
  if (uid) {
    userCache.delete(uid);
    return;
  }
  userCache.clear();
}

/**
 * Get the current cache statistics
 */
export function getAuthCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: userCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
