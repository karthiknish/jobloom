// Type declarations for Chrome extension APIs
declare global {
  var chrome: any;
}

// Constants for the extension
export const DEFAULT_WEB_APP_URL =
  process.env.WEB_APP_URL || "https://hireall.app";

// OAuth Configuration
export const OAUTH_CONFIG = {
  scopes: ["openid", "email", "profile"],
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  get redirectUrl(): string {
    // Lazy evaluation to avoid calling chrome.identity during module initialization
    return typeof chrome !== 'undefined' && chrome.identity
      ? chrome.identity.getRedirectURL()
      : 'chrome-extension://invalid/redirect';
  },
};
