/**
 * Safe localStorage wrapper that handles CSP/sandbox restrictions
 * Use instead of direct localStorage access in content scripts
 */

// Cached result of localStorage availability check
let localStorageAvailable: boolean | null = null;

/**
 * Check if localStorage is accessible (cached result)
 * In sandboxed contexts, even typeof localStorage can throw SecurityError
 */
function checkLocalStorageAvailable(): boolean {
  if (localStorageAvailable !== null) {
    return localStorageAvailable;
  }
  
  try {
    // Check if we're in a context where window doesn't exist
    if (typeof window === 'undefined') {
      localStorageAvailable = false;
      return false;
    }
    
    // In sandboxed iframes, accessing window.localStorage throws SecurityError
    // We must wrap the entire access in try-catch, not just the operation
    const storage = window.localStorage;
    if (!storage) {
      localStorageAvailable = false;
      return false;
    }
    
    const testKey = '__hireall_ls_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    localStorageAvailable = true;
    return true;
  } catch {
    // SecurityError or any other error means localStorage is not available
    localStorageAvailable = false;
    return false;
  }
}

/**
 * Safely get an item from localStorage
 * Returns null if localStorage is not accessible (e.g., in sandboxed contexts)
 */
export function safeLocalStorageGet(key: string): string | null {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  
  try {
    return window.localStorage.getItem(key);
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    localStorageAvailable = false;
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * Silently fails if localStorage is not accessible
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!checkLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    localStorageAvailable = false;
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * Silently fails if localStorage is not accessible
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (!checkLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    localStorageAvailable = false;
    return false;
  }
}

/**
 * Check if localStorage is accessible in the current context
 */
export function isLocalStorageAvailable(): boolean {
  return checkLocalStorageAvailable();
}
