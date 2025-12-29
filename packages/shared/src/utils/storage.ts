/**
 * Safe localStorage and JSON utilities
 */

export function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

let localStorageAvailable: boolean | null = null;

export function isLocalStorageAvailable(): boolean {
  if (localStorageAvailable !== null) return localStorageAvailable;
  
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      localStorageAvailable = false;
      return false;
    }
    
    const testKey = "__hireall_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    localStorageAvailable = true;
    return true;
  } catch {
    localStorageAvailable = false;
    return false;
  }
}

export function safeLocalStorageGet(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
