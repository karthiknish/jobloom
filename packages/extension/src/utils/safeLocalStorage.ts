import { 
  isLocalStorageAvailable as sharedIsLocalStorageAvailable,
  safeLocalStorageGet as sharedGet,
  safeLocalStorageSet as sharedSet,
  safeLocalStorageRemove as sharedRemove
} from "@hireall/shared";

/**
 * Safely get an item from localStorage
 * Returns null if localStorage is not accessible (e.g., in sandboxed contexts)
 */
export const safeLocalStorageGet = sharedGet;

/**
 * Safely set an item in localStorage
 * Silently fails if localStorage is not accessible
 */
export const safeLocalStorageSet = sharedSet;

/**
 * Safely remove an item from localStorage
 * Silently fails if localStorage is not accessible
 */
export const safeLocalStorageRemove = sharedRemove;

/**
 * Check if localStorage is accessible in the current context
 */
export const isLocalStorageAvailable = sharedIsLocalStorageAvailable;
