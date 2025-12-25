// Note: Firebase is NOT imported at module level to avoid loading in content scripts
// Content scripts cannot use localStorage and Firebase SDK tries to access it on load
// Use dynamic import in getTokenFromFirebase() instead
import { getEnv } from "./env";

const AUTH_TOKEN_STORAGE_KEY = "hireallAuthToken";
const AUTH_FAILURE_COUNT_KEY = "hireallAuthFailureCount";
const AUTH_LAST_FAILURE_KEY = "hireallAuthLastFailure";
const SESSION_PROOF_STORAGE_KEY = "hireallSessionData";
const TOKEN_SAFETY_BUFFER_MS = 30 * 1000; // subtract 30 seconds to avoid edge expirations
const DEFAULT_TOKEN_TTL_MS = 55 * 60 * 1000; // refresh slightly before Firebase's 60 minute expiry
const MAX_CONSECUTIVE_FAILURES = 3; // Clear stale auth after this many failures
const FAILURE_RESET_INTERVAL_MS = 5 * 60 * 1000; // Reset failure count after 5 minutes

const BACKGROUND_TOKEN_REQUEST_TIMEOUT_MS = 2500;
const HIREALL_TAB_TOKEN_REQUEST_TIMEOUT_MS = 2000;
const HIREALL_TAB_MAX_TABS_TO_TRY = 2;

const EXPECTED_PROJECT_ID =
  getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ||
  getEnv("FIREBASE_PROJECT_ID") ||
  "";

export interface CachedAuthToken {
  token: string;
  expiresAt: number;
  userId?: string;
  userEmail?: string;
  source?: "popup" | "webapp" | "background" | "tab";
  updatedAt: number;
}

export interface SessionProof {
  sessionHash: string;
  expiresAt: number;
  updatedAt: number;
}

interface AuthFailureTracker {
  consecutiveFailures: number;
  lastFailureTime: number;
}

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

function isExtensionPage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.location?.protocol === "chrome-extension:";
  } catch (error) {
    console.warn("Failed to determine protocol for extension page check", error);
    return false;
  }
}

function canAccessTabsApi(): boolean {
  return typeof chrome !== "undefined" && !!chrome.tabs?.query && !!chrome.tabs?.sendMessage;
}

function canMessageBackground(): boolean {
  return typeof chrome !== "undefined" && typeof chrome.runtime?.sendMessage === "function";
}

/**
 * Track authentication failures to detect stale auth state
 */
async function trackAuthFailure(): Promise<AuthFailureTracker> {
  if (!isChromeStorageAvailable()) {
    return { consecutiveFailures: 0, lastFailureTime: 0 };
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_FAILURE_COUNT_KEY, AUTH_LAST_FAILURE_KEY], (result) => {
      const now = Date.now();
      let consecutiveFailures = result[AUTH_FAILURE_COUNT_KEY] || 0;
      const lastFailureTime = result[AUTH_LAST_FAILURE_KEY] || 0;

      // Reset counter if enough time has passed since last failure
      if (now - lastFailureTime > FAILURE_RESET_INTERVAL_MS) {
        consecutiveFailures = 0;
      }

      consecutiveFailures++;

      chrome.storage.local.set({
        [AUTH_FAILURE_COUNT_KEY]: consecutiveFailures,
        [AUTH_LAST_FAILURE_KEY]: now,
      }, () => {
        resolve({ consecutiveFailures, lastFailureTime: now });
      });
    });
  });
}

/**
 * Reset failure counter on successful auth
 */
async function resetAuthFailureCounter(): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.remove([AUTH_FAILURE_COUNT_KEY, AUTH_LAST_FAILURE_KEY], () => {
      resolve();
    });
  });
}

/**
 * Clear stale authentication state from storage when auth is consistently failing
 * This helps recover from situations where userId is stored but token is unavailable
 */
export async function clearStaleAuthState(): Promise<void> {
  console.info("Hireall: Clearing stale authentication state due to repeated failures");
  
  if (!isChromeStorageAvailable()) {
    return;
  }

  return new Promise((resolve) => {
    // Clear from local storage
    chrome.storage.local.remove([
      AUTH_TOKEN_STORAGE_KEY,
      AUTH_FAILURE_COUNT_KEY,
      AUTH_LAST_FAILURE_KEY,
      'hireallUserData',
      'hireallSessionData',
      'hireallLastAuthSync',
      'hireallFirebaseUid'
    ], () => {
      // Also clear from sync storage to fully reset auth state
      chrome.storage.sync.remove(['firebaseUid', 'userId', 'userEmail'], () => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to clear stale auth state:', chrome.runtime.lastError);
        } else {
          console.info('Hireall: Stale auth state cleared successfully');
        }
        resolve();
      });
    });
  });
}

/**
 * Check if we should clear stale auth due to repeated failures
 */
async function shouldClearStaleAuth(): Promise<boolean> {
  if (!isChromeStorageAvailable()) {
    return false;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_FAILURE_COUNT_KEY], (result) => {
      const failures = result[AUTH_FAILURE_COUNT_KEY] || 0;
      resolve(failures >= MAX_CONSECUTIVE_FAILURES);
    });
  });
}

async function readCachedAuthToken(): Promise<CachedAuthToken | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_TOKEN_STORAGE_KEY], (result) => {
      const raw = result?.[AUTH_TOKEN_STORAGE_KEY];
      if (raw && typeof raw === "object" && typeof raw.token === "string") {
        resolve(raw as CachedAuthToken);
      } else {
        resolve(null);
      }
    });
  });
}

async function writeCachedAuthToken(cache: CachedAuthToken | null): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  return new Promise((resolve) => {
    if (!cache) {
      chrome.storage.local.remove([AUTH_TOKEN_STORAGE_KEY], () => resolve());
    } else {
      chrome.storage.local.set({ [AUTH_TOKEN_STORAGE_KEY]: cache }, () => resolve());
    }
  });
}

async function readSessionProof(): Promise<SessionProof | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([SESSION_PROOF_STORAGE_KEY], (result) => {
      const raw = result?.[SESSION_PROOF_STORAGE_KEY];
      if (raw && typeof raw === "object" && typeof raw.sessionHash === "string") {
        resolve(raw as SessionProof);
      } else {
        resolve(null);
      }
    });
  });
}

async function writeSessionProof(proof: SessionProof | null): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  return new Promise((resolve) => {
    if (!proof) {
      chrome.storage.local.remove([SESSION_PROOF_STORAGE_KEY], () => resolve());
    } else {
      chrome.storage.local.set({ [SESSION_PROOF_STORAGE_KEY]: proof }, () => resolve());
    }
  });
}

async function getValidCachedToken(forceRefresh: boolean): Promise<CachedAuthToken | null> {
  if (forceRefresh) {
    return null;
  }

  const cached = await readCachedAuthToken();
  if (!cached) {
    return null;
  }

  // Decode token expiry (Firebase ID tokens are JWTs). If parsing fails, fall back to stored expiry.
  const payload = decodeJwtPayload(cached.token);
  if (payload) {
    const exp = typeof payload.exp === "number" ? payload.exp * 1000 : null;
    if (exp && (!cached.expiresAt || exp < cached.expiresAt)) {
      cached.expiresAt = exp;
    }
    if (!isTokenForProject(payload)) {
      await writeCachedAuthToken(null);
      return null;
    }
  }

  if (!cached.expiresAt || cached.expiresAt - TOKEN_SAFETY_BUFFER_MS <= Date.now()) {
    await writeCachedAuthToken(null);
    return null;
  }

  return cached;
}

export async function cacheAuthToken(params: {
  token: string;
  userId?: string | null;
  userEmail?: string | null;
  source?: CachedAuthToken["source"];
  expiresAt?: number;
  ttlMs?: number;
}): Promise<void> {
  // Check extension context is still valid
  if (!isChromeStorageAvailable() || !chrome.runtime?.id) {
    console.debug("Hireall: Extension context invalidated, skipping auth token cache");
    return;
  }
  
  // Enhanced validation
  if (typeof params.token !== "string" || params.token.length === 0) {
    console.warn("Invalid token provided to cacheAuthToken");
    return;
  }
  
  if (params.token.length < 100) {
    console.warn("Token appears to be too short to be valid");
    return;
  }
  
  if (params.token.length > 2000) {
    console.warn("Token appears to be too long");
    return;
  }
  
  // Validate email format if provided
  if (params.userEmail && typeof params.userEmail === "string") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.userEmail)) {
      console.warn("Invalid email format provided to cacheAuthToken");
      return;
    }
  }
  
  // Validate source
  const validSources: CachedAuthToken["source"][] = ["popup", "webapp", "background", "tab"];
  if (params.source && !validSources.includes(params.source)) {
    console.warn("Invalid source provided to cacheAuthToken");
    return;
  }

  const ttlMs = params.expiresAt
    ? Math.max(params.expiresAt - Date.now(), 10 * 1000)
    : params.ttlMs ?? DEFAULT_TOKEN_TTL_MS;

  const expiresAt = params.expiresAt ?? Date.now() + ttlMs;

  const cache: CachedAuthToken = {
    token: params.token,
    userId: params.userId ?? undefined,
    userEmail: params.userEmail ?? undefined,
    source: params.source,
    expiresAt,
    updatedAt: Date.now(),
  };

  await writeCachedAuthToken(cache);
}

/**
 * Get cached user info from the stored auth token.
 * This returns user info even when Firebase auth.currentUser is null
 * (e.g., when token was acquired from web app with separate auth state).
 */
export async function getCachedUserInfo(): Promise<{
  userId?: string;
  userEmail?: string;
  token?: string;
  isValid: boolean;
} | null> {
  const cached = await readCachedAuthToken();
  if (!cached) {
    return null;
  }

  const isValid = cached.expiresAt && cached.expiresAt > Date.now();
  return {
    userId: cached.userId,
    userEmail: cached.userEmail,
    token: isValid ? cached.token : undefined,
    isValid: !!isValid
  };
}

export async function clearCachedAuthToken(): Promise<void> {
  try {
    // Clear the main auth token
    await writeCachedAuthToken(null);
    
    // Clear any additional auth-related data from storage
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([
          AUTH_TOKEN_STORAGE_KEY,
          'hireallUserData',
          'hireallSessionData',
          'hireallLastAuthSync',
          'hireallFirebaseUid'
        ], () => {
          if (chrome.runtime.lastError) {
            console.warn('Failed to clear some auth data from storage:', chrome.runtime.lastError);
          }
          resolve();
        });
      });
    }
  } catch (error) {
    console.warn('Error during auth token cleanup:', error);
  }
}

export async function getSessionProof(): Promise<SessionProof | null> {
  const proof = await readSessionProof();
  if (!proof) return null;
  if (proof.expiresAt && proof.expiresAt <= Date.now()) {
    await writeSessionProof(null);
    return null;
  }
  return proof;
}

export async function setSessionProof(params: { sessionHash: string; expiresAt: number }): Promise<void> {
  if (!params.sessionHash || params.sessionHash.length < 8) {
    console.warn("Hireall: Invalid session hash provided to setSessionProof");
    return;
  }
  const proof: SessionProof = {
    sessionHash: params.sessionHash,
    expiresAt: params.expiresAt,
    updatedAt: Date.now(),
  };
  await writeSessionProof(proof);
}

export async function clearSessionProof(): Promise<void> {
  await writeSessionProof(null);
}

async function getTokenFromHireallTab(forceRefresh: boolean): Promise<CachedAuthToken | null> {
  if (!canAccessTabsApi()) {
    return null;
  }

  try {
    const queryTabs = await chrome.tabs.query({
      url: [
        "https://hireall.app/*",
        "https://*.hireall.app/*",
        "https://*.vercel.app/*",
        "https://*.netlify.app/*",
        "http://localhost:3000/*"
      ]
    });

    // Only attempt token extraction from actual HireAll web app tabs.
    // Falling back to the active tab can cause script injection attempts on unrelated sites
    // (e.g., LinkedIn), which is noisy and can trigger sandbox/CSP edge cases.
    const candidateTabs = queryTabs
      .slice()
      .sort((a, b) => {
        // Prefer active + fully loaded tabs.
        const aScore = (a?.active ? 2 : 0) + (a?.status === "complete" ? 1 : 0);
        const bScore = (b?.active ? 2 : 0) + (b?.status === "complete" ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, HIREALL_TAB_MAX_TABS_TO_TRY);

    if (!candidateTabs.length) {
      return null;
    }

    for (const tab of candidateTabs) {
      if (!tab?.id) continue;

      // Try multiple methods to get the token
      const response = await new Promise<{ token?: string; userId?: string; userEmail?: string; success?: boolean } | null>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.debug('Hireall: Token request timed out for tab', tab.id);
          resolve(null);
        }, HIREALL_TAB_TOKEN_REQUEST_TIMEOUT_MS);

        // Method 1: Send message to get auth token via content script
        chrome.tabs.sendMessage(tab.id!, { action: "getAuthToken", forceRefresh, target: "webapp-content" }, (resp) => {
          if (chrome.runtime?.lastError) {
            console.debug('Hireall: Content script message failed:', chrome.runtime.lastError.message);
            // Try method 2
            tryGetTokenFromWindow();
            return;
          }
          if (resp?.token) {
            clearTimeout(timeoutId);
            resolve(resp);
            return;
          }
          // Try method 2
          tryGetTokenFromWindow();
        });

        // Method 2: Inject script to access global functions
        function tryGetTokenFromWindow() {
          if (!chrome.scripting?.executeScript) {
            clearTimeout(timeoutId);
            resolve(null);
            return;
          }

          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: () => {
              // Get token from localStorage (populated by ExtensionAuthBridge)
              // Note: getHireallAuthToken is async and can't return Promises from executeScript
              // IMPORTANT: Wrap the entire localStorage access in try-catch
              // In sandboxed contexts, even accessing window.localStorage throws SecurityError
              try {
                const storage = window.localStorage;
                if (!storage) {
                  return null;
                }
                const localToken = storage.getItem('hireall_auth_token');
                const userData = storage.getItem('hireall_user_data');
                
                if (localToken && localToken.length > 100) {
                  let parsed: any = {};
                  try {
                    parsed = userData ? JSON.parse(userData) : {};
                  } catch {
                    // JSON parse failed, use empty object
                  }
                  return {
                    token: localToken,
                    userId: parsed.userId,
                    userEmail: parsed.userEmail,
                    success: true
                  };
                }
              } catch (e) {
                // localStorage may be blocked in sandboxed contexts - this is expected
                // SecurityError is thrown when accessing window.localStorage in sandboxed iframes
              }
              
              return null;
            }
          }, (result) => {
            clearTimeout(timeoutId);
            if (chrome.runtime?.lastError || !result || !result[0]?.result) {
              resolve(null);
              return;
            }
            
            resolve(result[0].result);
          });
        }
      });

      if (response?.token) {
        let expiresAt = Date.now() + DEFAULT_TOKEN_TTL_MS;
        const payload = decodeJwtPayload(response.token);
        if (payload) {
          if (!isTokenForProject(payload)) {
            continue;
          }
          if (typeof payload.exp === 'number') {
            expiresAt = payload.exp * 1000;
          }
        }
        const cache: CachedAuthToken = {
          token: response.token,
          userId: response.userId,
          userEmail: response.userEmail,
          expiresAt,
          source: "tab",
          updatedAt: Date.now(),
        };
        await writeCachedAuthToken(cache);
        return cache;
      }
    }
  } catch (error) {
    console.warn("Failed to get token from Hireall tab:", error);
  }

  return null;
}

async function getTokenFromFirebase(forceRefresh: boolean): Promise<CachedAuthToken | null> {
  if (!isExtensionPage()) {
    return null;
  }

  try {
    // Dynamic import to avoid loading Firebase in content scripts
    // Content scripts run in sandboxed contexts that can't access localStorage
    const { getAuthInstance } = await import("./firebase");
    const auth = getAuthInstance();
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    const payload = decodeJwtPayload(token);
    let expiresAt = Date.now() + DEFAULT_TOKEN_TTL_MS;
    if (payload) {
      if (!isTokenForProject(payload)) {
        return null;
      }
      if (typeof payload.exp === 'number') {
        expiresAt = payload.exp * 1000;
      }
    }
    const cache: CachedAuthToken = {
      token,
      userId: user.uid,
      userEmail: user.email ?? undefined,
      expiresAt,
      source: "popup",
      updatedAt: Date.now(),
    };
    await writeCachedAuthToken(cache);
    return cache;
  } catch (error) {
    console.warn("Failed to get token from Firebase auth instance:", error);
    return null;
  }
}

async function requestTokenFromBackground(forceRefresh: boolean): Promise<CachedAuthToken | null> {
  if (!canMessageBackground()) {
    return null;
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let settled = false;
    try {
      timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.debug(
          `Hireall: Background token request timed out after ${BACKGROUND_TOKEN_REQUEST_TIMEOUT_MS}ms`
        );
        resolve(null);
      }, BACKGROUND_TOKEN_REQUEST_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        { action: "acquireAuthToken", forceRefresh, target: "background" },
        (response) => {
          if (settled) return;
          settled = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          if (chrome.runtime?.lastError) {
            resolve(null);
            return;
          }

          if (response?.token && typeof response.token === "string") {
            let expiresAt = response.expiresAt ?? Date.now() + DEFAULT_TOKEN_TTL_MS;
            const payload = decodeJwtPayload(response.token);
            if (payload) {
              if (!isTokenForProject(payload)) {
                resolve(null);
                return;
              }
              if (typeof payload.exp === 'number') {
                expiresAt = payload.exp * 1000;
              }
            }
            const cache: CachedAuthToken = {
              token: response.token,
              userId: response.userId ?? undefined,
              userEmail: response.userEmail ?? undefined,
              expiresAt,
              source: "background",
              updatedAt: Date.now(),
            };
            writeCachedAuthToken(cache).finally(() => resolve(cache));
            return;
          }

          resolve(null);
        }
      );
    } catch (error) {
      if (!settled && timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.warn("Failed to request token from background:", error);
      resolve(null);
    }
  });
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenForProject(payload: Record<string, any> | null): boolean {
  if (!payload) return false;
  if (!EXPECTED_PROJECT_ID) return true;
  const audMatches = !payload.aud || payload.aud === EXPECTED_PROJECT_ID;
  const issMatches = !payload.iss || typeof payload.iss === 'string'
    ? payload.iss.endsWith(EXPECTED_PROJECT_ID)
    : true;
  return audMatches && issMatches;
}

export async function acquireIdToken(
  forceRefresh = false,
  options?: { skipMessageFallback?: boolean; isAuthenticatedContext?: boolean }
): Promise<string | null> {
  try {
    // Check if we should clear stale auth before attempting
    if (await shouldClearStaleAuth()) {
      console.warn("Hireall: Too many consecutive auth failures detected, clearing stale state");
      await clearStaleAuthState();
      // Return null immediately after clearing - let next attempt start fresh
      return null;
    }

    const cached = await getValidCachedToken(forceRefresh);
    if (cached) {
      console.debug("Hireall: Using cached auth token", {
        source: cached.source,
        expiresIn: Math.round((cached.expiresAt - Date.now()) / 1000) + "s"
      });
      await resetAuthFailureCounter();
      return cached.token;
    }

    console.debug("Hireall: No valid cached token, attempting to acquire fresh token", {
      forceRefresh,
      isExtension: isExtensionPage(),
      canAccessTabs: canAccessTabsApi(),
      canMessageBg: canMessageBackground()
    });

    // Try Firebase auth - ONLY in extension pages (popup, background, options)
    // Content scripts (on LinkedIn, etc.) cannot use Firebase directly due to localStorage sandbox
    if (isExtensionPage()) {
      const firebaseToken = await getTokenFromFirebase(forceRefresh);
      if (firebaseToken) {
        console.debug("Hireall: Acquired token from Firebase auth", {
          userId: firebaseToken.userId,
          source: "firebase"
        });
        await resetAuthFailureCounter();
        return firebaseToken.token;
      }
    } else {
      console.debug("Hireall: Skipping Firebase auth in content script (sandboxed context)");
    }

    // Try background script first (fast path); tab probing can be slow.
    if (!options?.skipMessageFallback) {
      console.debug("Hireall: Attempting to get token from background script");
      const backgroundToken = await requestTokenFromBackground(forceRefresh);
      if (backgroundToken) {
        console.debug("Hireall: Acquired token from background script", {
          userId: backgroundToken.userId,
          source: "background"
        });
        await resetAuthFailureCounter();
        return backgroundToken.token;
      }
      console.debug("Hireall: No token available from background script");
    }

    // Try getting token from HireAll web app tab
    if (canAccessTabsApi()) {
      console.debug("Hireall: Attempting to get token from web app tab");
      const tabToken = await getTokenFromHireallTab(forceRefresh);
      if (tabToken) {
        console.debug("Hireall: Acquired token from Hireall tab", {
          userId: tabToken.userId,
          source: "tab"
        });
        await resetAuthFailureCounter();
        return tabToken.token;
      }
      console.debug("Hireall: No token available from web app tabs");
    }

    // Track this failure if we expected to be authenticated
    if (options?.isAuthenticatedContext) {
      const tracker = await trackAuthFailure();
      console.warn("Hireall: Token acquisition failed in authenticated context", {
        consecutiveFailures: tracker.consecutiveFailures,
        maxFailures: MAX_CONSECUTIVE_FAILURES,
        willClearOnNextFailure: tracker.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES - 1
      });
    } else {
      // User not signed in - expected case, use debug level
      console.debug("Hireall: No auth token available (user may not be signed in)");
    }

    return null;
  } catch (error) {
    console.warn("Hireall: Failed to acquire ID token:", error);
    
    // Track failures on exceptions too
    if (options?.isAuthenticatedContext) {
      await trackAuthFailure();
    }
    
    return null;
  }
}
