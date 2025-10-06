/// <reference types="chrome" />

import { ExtensionSecurityLogger } from "./security";
import { put } from "./apiClient";
import { ExtensionMessageHandler } from "./components/ExtensionMessageHandler";

// Content script for the web app to handle authentication communication
let authSuccessSent = false; // Prevent duplicate auth success messages
let authCheckInterval: number | null = null;
let lastUserId: string | null = null;

interface UserInfo {
  userId: string | null;
  userEmail: string | null;
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

  // Additional action to get auth token
  if (request.action === "getAuthToken") {
    try {
      const auth = (window as any).__firebase_auth;
      if (auth && auth.currentUser) {
        auth.currentUser.getIdToken(true).then((token: string) => {
          sendResponse({ token, userId: auth.currentUser.uid });
        }).catch((error: any) => {
          ExtensionSecurityLogger.log('Error getting auth token', error);
          sendResponse({ token: null, error: 'Failed to get auth token' });
        });
        return true; // Async response
      } else {
        sendResponse({ token: null, error: 'No authenticated user' });
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

// Optimized auth success detection with debouncing
function notifyAuthSuccess(userId: string) {
  if (authSuccessSent || lastUserId === userId) {
    return; // Already sent or same user
  }

  authSuccessSent = true;
  lastUserId = userId;

  const { userEmail } = extractUserInfo();

  console.log("Authentication successful, notifying extension with userId:", userId);

  ExtensionMessageHandler.sendMessage("authSuccess", { userId, userEmail }).catch((error) => {
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
        notifyAuthSuccess(userId);
      }
    }, 1000);
  }

  // Handle Firebase authentication logout message
  if (event.data.type === "FIREBASE_AUTH_LOGOUT") {
    console.log("Received logout message from web app");
    // Clear auth data from chrome storage
    chrome.storage.sync.remove(["firebaseUid", "userId"], () => {
      if (chrome.runtime?.lastError) {
        ExtensionSecurityLogger.log('Failed to clear auth storage on logout', chrome.runtime.lastError.message);
      } else {
        console.log("Cleared auth storage on logout");
      }
    });
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
  if (event.data.type === "JOBLOOM_REQUEST_SETTINGS_SYNC") {
    try {
      // Read extension settings and relay to background for upload if needed
      chrome.storage.sync.get([
        "webAppUrl",
        "defaultKeywords",
        "defaultConnectionLevel",
        "autoConnectLimit",
        "autoMessage",
        "connectionMessage",
        "autofillProfile",
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
          autofillProfile: res.autofillProfile,
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
      notifyAuthSuccess(userId);
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
