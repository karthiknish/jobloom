// Type declarations for Chrome extension APIs
// In TypeScript modules we can just rely on @types/chrome; no need to redeclare 'chrome' variable.
// Removed problematic global augmentation.

// Constants for the extension
export const DEFAULT_WEB_APP_URL =
  process.env.WEB_APP_URL || "https://hireall.app";

// OAuth Configuration
// OAuth configuration removed - using Firebase Authentication directly inside the extension popup.
