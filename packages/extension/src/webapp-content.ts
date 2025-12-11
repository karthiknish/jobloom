/// <reference types="chrome" />

import { ExtensionSecurityLogger } from "./security";
import { put } from "./apiClient";
import { ExtensionMessageHandler } from "./components/ExtensionMessageHandler";
import { cacheAuthToken, clearCachedAuthToken } from "./authToken";

// Content script for the web app to handle authentication communication
let authSuccessSent = false; // Prevent duplicate auth success messages
let authCheckInterval: number | null = null;
let lastUserId: string | null = null;

interface UserInfo {
  userId: string | null;
  userEmail: string | null;
}

interface HireallSessionInfo {
  sessionToken: string | null;
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
}

function extractUserInfo(): UserInfo {
  let userId: string | null = null;
  let userEmail: string | null = null;

  const firebaseUser = (window as any).__firebase_user;
  if (firebaseUser) {
    if (firebaseUser.id) {
      userId = String(firebaseUser.id);
    }
    if (firebaseUser.email) {
      userEmail = String(firebaseUser.email);
    }
  }

  if (!userId) {
    try {
      const stored = localStorage.getItem("__firebase_user");
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.id) {
          userId = String(data.id);
        }
        if (data?.email) {
          userEmail = String(data.email);
        }
      }
    } catch (error) {
      ExtensionSecurityLogger.log('Error parsing Firebase user data', error);
    }
  }

  if (!userId) {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === '__firebase_user' && value) {
          const data = JSON.parse(decodeURIComponent(value));
          if (data?.id) {
            userId = String(data.id);
          }
          if (data?.email) {
            userEmail = String(data.email);
          }
          break;
        }
      }
    } catch (error) {
      ExtensionSecurityLogger.log('Error parsing Firebase user cookie', error);
    }
  }

  if (!userEmail) {
    // Attempt DOM fallback for email if available
    const emailEl = document.querySelector('[data-user-email]');
    const rawEmail = emailEl?.getAttribute('data-user-email');
    if (rawEmail && rawEmail.includes('@')) {
      userEmail = rawEmail;
    }
  }

  return { userId, userEmail };
}

/**
 * Extract full Hireall session information including session token
 */
function extractHireallSession(): HireallSessionInfo {
  const result: HireallSessionInfo = {
    sessionToken: null,
    userId: null,
    userEmail: null,
    isAuthenticated: false
  };

  try {
    // Extract session token from cookies
    const sessionCookie = getCookie("__session");
    if (sessionCookie) {
      result.sessionToken = sessionCookie;
      result.isAuthenticated = true;
    }

    // Extract user information using existing logic
    const userInfo = extractUserInfo();
    result.userId = userInfo.userId;
    result.userEmail = userInfo.userEmail;

    // Additional check: if we have a session token but no user info,
    // try to extract from other sources
    if (result.sessionToken && !result.userId) {
      // Check for user data in sessionStorage
      const sessionUserData = sessionStorage.getItem('hireall_user');
      if (sessionUserData) {
        try {
          const userData = JSON.parse(sessionUserData);
          if (userData.id) result.userId = userData.id;
          if (userData.email) result.userEmail = userData.email;
        } catch (e) {
          console.debug('Failed to parse Hireall user data from sessionStorage');
        }
      }

      // Check for user data in localStorage
      const localUserData = localStorage.getItem('hireall_user');
      if (localUserData) {
        try {
          const userData = JSON.parse(localUserData);
          if (userData.id && !result.userId) result.userId = userData.id;
          if (userData.email && !result.userEmail) result.userEmail = userData.email;
        } catch (e) {
          console.debug('Failed to parse Hireall user data from localStorage');
        }
      }
    }

  } catch (error) {
    ExtensionSecurityLogger.log('Error extracting Hireall session', error);
  }

  return result;
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if extension context is still valid
  if (typeof chrome === "undefined" || !chrome.storage) {
    console.debug("Hireall: Extension context invalidated, cannot process message");
    sendResponse({ error: 'Extension context invalidated' });
    return false;
  }

  // Only process messages that are meant for the webapp content script
  // Accept messages with no target OR target === 'webapp-content'
  if (request.target && request.target !== 'webapp-content' && request.target !== 'content') {
    return undefined; // Let other handlers process this message
  }

  console.debug('Hireall webapp-content: Received message', request.action);

  // Only allow specific actions
  if (request.action === "getUserId") {
    try {
      const info = extractUserInfo();
      if (!info.userId) {
        // Method 4: Fallback DOM attribute (sanitize input)
        const el = document.querySelector("[data-user-id]");
        if (el) {
          const rawUserId = el.getAttribute("data-user-id");
          if (rawUserId && typeof rawUserId === 'string' && rawUserId.length < 100) {
            info.userId = rawUserId;
          }
        }
      }

      sendResponse({ userId: info.userId, userEmail: info.userEmail });
      return true; // Keep the message channel open for async response
    } catch (error) {
      ExtensionSecurityLogger.log('Error retrieving user ID', error);
      sendResponse({ userId: null, userEmail: null, error: 'Failed to retrieve user ID' });
      return true;
    }
  }

  // Extract full Hireall session information
  if (request.action === "extractHireallSession") {
    try {
      const sessionInfo = extractHireallSession();
      sendResponse({
        sessionToken: sessionInfo.sessionToken,
        userId: sessionInfo.userId,
        userEmail: sessionInfo.userEmail,
        isAuthenticated: sessionInfo.isAuthenticated
      });
      return true; // Keep the message channel open for async response
    } catch (error) {
      ExtensionSecurityLogger.log('Error extracting Hireall session', error);
      sendResponse({
        sessionToken: null,
        userId: null,
        userEmail: null,
        isAuthenticated: false,
        error: 'Failed to extract session'
      });
      return true;
    }
  }

  // Additional action to get auth token
  if (request.action === "getAuthToken") {
    try {
      // Try the new auth bridge first
      if (typeof (window as any).getHireallAuthToken === 'function') {
        const shouldForceRefresh = request?.forceRefresh === true;
        (window as any).getHireallAuthToken(shouldForceRefresh)
          .then(async (authResponse: any) => {
            if (authResponse.success && authResponse.token) {
              try {
                await cacheAuthToken({
                  token: authResponse.token,
                  userId: authResponse.userId,
                  userEmail: authResponse.userEmail,
                  source: "webapp"
                });
              } catch (cacheError) {
                ExtensionSecurityLogger.log('Error caching auth token', cacheError);
              }
              sendResponse({ 
                token: authResponse.token, 
                userId: authResponse.userId,
                userEmail: authResponse.userEmail
              });
            } else {
              sendResponse({ token: null, error: authResponse.error || 'No authenticated user' });
            }
          })
          .catch((error: any) => {
            ExtensionSecurityLogger.log('Error getting auth token from bridge', error);
            // Fallback to old method
            fallbackGetAuthToken(request, sendResponse);
          });
        return true; // Async response
      } else {
        // Fallback to old method
        fallbackGetAuthToken(request, sendResponse);
        return true;
      }
    } catch (error) {
      ExtensionSecurityLogger.log('Error in getAuthToken', error);
      sendResponse({ token: null, error: 'Failed to get auth token' });
      return true;
    }
  }

  // Log suspicious activity
  ExtensionSecurityLogger.logSuspiciousActivity('unknown_message_action', request.action);
  return false;
});

// Fallback function for getting auth token using old method
function fallbackGetAuthToken(request: any, sendResponse: (response: any) => void) {
  try {
    // Try multiple sources for Firebase auth
    const auth = (window as any).__firebase_auth || (window as any).firebase?.auth?.();
    
    if (auth && auth.currentUser) {
      const shouldForceRefresh = request?.forceRefresh === true;
      auth.currentUser
        .getIdToken(shouldForceRefresh)
        .then(async (token: string) => {
          if (!token) {
            sendResponse({ token: null, error: 'Token was empty' });
            return;
          }
          
          try {
            await cacheAuthToken({
              token,
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email ?? undefined,
              source: "webapp"
            });
          } catch (cacheError) {
            ExtensionSecurityLogger.log('Error caching auth token', cacheError);
          }
          
          console.debug('Hireall: Got token via fallback method, length:', token.length);
          sendResponse({ 
            token, 
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            success: true 
          });
        })
        .catch((error: any) => {
          ExtensionSecurityLogger.log('Error getting auth token', error);
          
          // Try localStorage as last resort
          tryLocalStorageToken(sendResponse);
        });
    } else {
      // No auth object - try localStorage
      tryLocalStorageToken(sendResponse);
    }
  } catch (error) {
    ExtensionSecurityLogger.log('Error in fallback getAuthToken', error);
    tryLocalStorageToken(sendResponse);
  }
}

// Last resort token retrieval from localStorage
function tryLocalStorageToken(sendResponse: (response: any) => void) {
  try {
    const localToken = localStorage.getItem('hireall_auth_token');
    const userData = localStorage.getItem('hireall_user_data');
    
    if (localToken && localToken.length > 100) {
      let userId, userEmail;
      try {
        const parsed = userData ? JSON.parse(userData) : {};
        userId = parsed.userId;
        userEmail = parsed.userEmail;
      } catch (e) {
        // Ignore parse errors
      }
      
      console.debug('Hireall: Using token from localStorage');
      sendResponse({ token: localToken, userId, userEmail, success: true, source: 'localStorage' });
      return;
    }
    
    sendResponse({ token: null, error: 'No authenticated user found' });
  } catch (e) {
    sendResponse({ token: null, error: 'Failed to get auth token from any source' });
  }
}

// Optimized auth success detection with debouncing
async function notifyAuthSuccess(userId: string): Promise<void> {
  if (authSuccessSent || lastUserId === userId) {
    return; // Already sent or same user
  }

  authSuccessSent = true;
  lastUserId = userId;

  const { userEmail } = extractUserInfo();
  let token: string | undefined;

  try {
    const auth = (window as any).__firebase_auth;
    if (auth?.currentUser) {
      token = await auth.currentUser.getIdToken(true);
      if (token) {
        await cacheAuthToken({
          token,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email ?? undefined,
          source: "webapp"
        });
      }
    }
  } catch (error) {
    ExtensionSecurityLogger.log('Error retrieving auth token for authSuccess', error);
  }

  console.log("Authentication successful, notifying extension with userId:", userId);

  ExtensionMessageHandler.sendMessage("authSuccess", { userId, userEmail, token }, 2).catch((error) => {
    console.debug("Auth success notification failed; extension context may be invalid", error);
    // Reset flag on failure so we can try again
    authSuccessSent = false;
  });

  // Also persist directly to storage
  chrome.storage.sync.set({ 
    userId,
    firebaseUid: userId // Set both for compatibility
  }).catch((error) => {
    console.debug("Failed to persist user auth data to storage", error);
  });
}

// Single URL change observer with debouncing
let urlCheckTimeout: number | null = null;
const observer = new MutationObserver(() => {
  if (urlCheckTimeout) {
    clearTimeout(urlCheckTimeout);
  }

  urlCheckTimeout = window.setTimeout(() => {
    const url = location.href;
    // Only check for auth success on relevant pages
    if (url.includes("/dashboard") || url.includes("/account") || url.includes("/sign-in")) {
      checkForAuthSuccess();
    }
  }, 500); // Debounce URL checks
});

observer.observe(document, { subtree: true, childList: true });

// Listen for messages from the web app
window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;

  // Handle auth bridge messages (support multiple legacy/new message types)
  const messageType = (event as any)?.data?.type;
  if (
    messageType === "HIREALL_USER_AUTH" ||
    messageType === "HIREDALL_AUTH_RESPONSE" ||
    messageType === "HIREDALL_AUTH_STATE_CHANGED" ||
    messageType === "HIREALL_AUTH_STATE_CHANGED"
  ) {
    console.log("[WebApp Content] Received auth message from web app:", messageType);

    // Some web-side events explicitly indicate logout
    if ((event as any)?.data?.isAuthenticated === false) {
      clearCachedAuthToken().catch(() => undefined);
      try {
        chrome.storage.sync.remove(["firebaseUid", "userId", "userEmail", "sessionToken"], () => {
          if (chrome.runtime?.lastError) {
            ExtensionSecurityLogger.log(
              "Failed to clear auth storage on auth-state logout",
              chrome.runtime.lastError.message
            );
          }
        });
      } catch {
        // ignore
      }

      // Notify background script so it can clear its cached token too
      try {
        chrome.runtime.sendMessage({
          type: "AUTH_STATE_CHANGED",
          payload: {
            isAuthenticated: false,
            source: "webapp_content",
          },
        });
      } catch {
        // ignore
      }

      return;
    }

    if ((event as any)?.data?.token && (event as any)?.data?.userId) {
      const token = String((event as any).data.token);
      const userId = String((event as any).data.userId);
      const userEmail = (event as any)?.data?.userEmail ? String((event as any).data.userEmail) : undefined;

      cacheAuthToken({
        token,
        userId,
        userEmail,
        source: "webapp",
      })
        .then(() => {
          // Notify background script about the auth state
          chrome.runtime.sendMessage({
            type: "AUTH_STATE_CHANGED",
            payload: {
              isAuthenticated: true,
              userId,
              email: userEmail,
              token,
              source: "webapp_content",
            },
          });

          console.log("[WebApp Content] Auth state synced from web app");
        })
        .catch((error) => {
          console.error("[WebApp Content] Failed to cache auth token:", error);
        });
    }
  }

  if (event.data.type === "HIREALL_FORCE_SYNC") {
    console.log('[WebApp Content] Force sync requested');
    
    // Get fresh token from web app and notify background
    if (typeof (window as any).getHireallAuthToken === 'function') {
      (window as any).getHireallAuthToken(true)
        .then((authResponse: any) => {
          if (authResponse.success && authResponse.token) {
            chrome.runtime.sendMessage({
              type: 'FORCE_SYNC_REQUEST',
              payload: {
                token: authResponse.token,
                userId: event.data.userId,
                userEmail: authResponse.userEmail,
                timestamp: Date.now()
              }
            });
          }
        })
        .catch((error: any) => {
          console.error('[WebApp Content] Failed to get token for force sync:', error);
        });
    }
  }

  // Handle Firebase authentication success message
  if (event.data.type === "FIREBASE_AUTH_SUCCESS") {
    setTimeout(() => {
      let userId: string | null = null;
      if ((window as any).__firebase_user?.id) {
        userId = String((window as any).__firebase_user.id);
      } else {
        try {
          const s = localStorage.getItem("__firebase_user");
          if (s) userId = JSON.parse(s)?.id ?? null;
        } catch (parseError) {
          ExtensionSecurityLogger.log('Error parsing Firebase user data for auth success message', parseError);
        }
      }

      if (userId) {
  void notifyAuthSuccess(userId);
      }
    }, 1000);
  }

  // Handle Firebase authentication logout message
  if (event.data.type === "FIREBASE_AUTH_LOGOUT") {
    console.log("Received logout message from web app");
    clearCachedAuthToken().catch(() => undefined);
    // Clear auth data from chrome storage
    chrome.storage.sync.remove(["firebaseUid", "userId"], () => {
      if (chrome.runtime?.lastError) {
        ExtensionSecurityLogger.log('Failed to clear auth storage on logout', chrome.runtime.lastError.message);
      } else {
        console.log("Cleared auth storage on logout");
      }
    });

    // Notify background so it can clear cached token
    try {
      chrome.runtime.sendMessage({
        type: "AUTH_STATE_CHANGED",
        payload: {
          isAuthenticated: false,
          source: "webapp_content",
        },
      });
    } catch {
      // ignore
    }
  }

  if (event.data.type === "HIREALL_EXTENSION_UPDATE_PREFS") {
    try {
      const payload = event.data.payload ?? {};
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        const updates: Record<string, boolean> = {};
        if (typeof payload.enableSponsorshipChecks === "boolean") {
          updates.enableSponsorshipChecks = payload.enableSponsorshipChecks;
        }

        if (Object.keys(updates).length > 0) {
          chrome.storage.sync.set(updates, () => {
            if (chrome.runtime?.lastError) {
              ExtensionSecurityLogger.log('Failed to persist extension preferences', chrome.runtime.lastError.message);
            }
          });
        }
      }
    } catch (error) {
      ExtensionSecurityLogger.log('Error handling extension preferences update', error);
    }
    return;
  }

  // Web page requests the extension to send settings to web (for syncing)
  if (event.data.type === "HIREALL_REQUEST_SETTINGS_SYNC") {
    try {
      // Read extension settings and relay to background for upload if needed
      chrome.storage.sync.get([
        "webAppUrl",
        "defaultKeywords",
        "defaultConnectionLevel",
        "autoConnectLimit",
        "autoMessage",
        "connectionMessage",
        "firebaseUid",
        "userId",
      ], async (res) => {
        const uid = res.firebaseUid || res.userId;
        if (!uid) return;
        const body = {
          defaultKeywords: res.defaultKeywords,
          defaultConnectionLevel: res.defaultConnectionLevel,
          autoConnectLimit: res.autoConnectLimit,
          autoMessage: res.autoMessage,
          connectionMessage: res.connectionMessage,
        };
        try {
          await put(`/api/app/users/${encodeURIComponent(uid)}/settings`, body);
        } catch (syncError) {
          ExtensionSecurityLogger.log('Failed to sync web settings from extension', syncError);
        }
      });
    } catch (settingsError) {
      ExtensionSecurityLogger.log('Error preparing settings sync payload', settingsError);
    }
  }
});

// Optimized auth checking function
function checkForAuthSuccess(): Promise<void> {
  return new Promise((resolve) => {
    const { userId } = extractUserInfo();

    if (userId) {
  void notifyAuthSuccess(userId);
    }

    resolve();
  });
}

// Single initialization check with reduced polling
function initializeAuthDetection() {
  // Initial check
  checkForAuthSuccess();

  // Reduced polling frequency - only check every 2 seconds instead of every 500ms
  authCheckInterval = window.setInterval(() => {
    checkForAuthSuccess();
  }, 2000);

  // Stop polling after 30 seconds to avoid unnecessary checks
  setTimeout(() => {
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
  }, 30000);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAuthDetection);
} else {
  initializeAuthDetection();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }
  if (urlCheckTimeout) {
    clearTimeout(urlCheckTimeout);
  }
  observer.disconnect();
});
