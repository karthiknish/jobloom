/**
 * Safe localStorage wrapper that handles CSP/sandbox restrictions
 * Use instead of direct localStorage access in content scripts
 */

/**
 * Safely get an item from localStorage
 * Returns null if localStorage is not accessible (e.g., in sandboxed contexts)
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * Silently fails if localStorage is not accessible
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * Silently fails if localStorage is not accessible
 */
export function safeLocalStorageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    // localStorage may be blocked by CSP or in sandboxed contexts
    return false;
  }
}

/**
 * Check if localStorage is accessible in the current context
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__hireall_ls_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
