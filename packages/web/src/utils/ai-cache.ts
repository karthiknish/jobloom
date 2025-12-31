/**
 * AI Response Caching Utility
 * 
 * Provides methods to hash content and store/retrieve AI responses
 * from local storage to prevent redundant API calls.
 */

/**
 * Generates a SHA-256 hash of the given content
 */
export const generateContentHash = async (content: any): Promise<string> => {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Retrieves a cached AI response if it exists and hasn't expired
 */
export const getCachedAIResponse = <T>(hash: string): T | null => {
  if (typeof window === 'undefined') return null;
  
  const key = `ai_cache_${hash}`;
  const cached = localStorage.getItem(key);
  
  if (!cached) return null;
  
  try {
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('Failed to parse AI cache entry:', error);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Stores an AI response in local storage with a TTL
 */
export const setCachedAIResponse = <T>(hash: string, data: T, ttlDays = 7): void => {
  if (typeof window === 'undefined') return;
  
  const key = `ai_cache_${hash}`;
  const expiry = Date.now() + (ttlDays * 24 * 60 * 60 * 1000);
  
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiry
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(entry));
    
    // Cleanup old items if storage is getting full
    cleanupOldCacheEntries();
  } catch (error) {
    console.warn('Failed to save AI cache entry:', error);
  }
};

/**
 * Removes expired items from localStorage to prevent bloating
 */
const cleanupOldCacheEntries = (): void => {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ai_cache_')) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached);
          if (now > entry.expiry) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key!);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
