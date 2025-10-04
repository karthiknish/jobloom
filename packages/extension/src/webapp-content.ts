/// <reference types="chrome" />

import { ExtensionSecurityLogger } from "./security";

// Content script for the web app to handle authentication communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only allow specific actions
  if (request.action === "getUserId") {
    try {
      // Try to get user ID from various sources
      let userId: string | null = null;

      // Method 1: Firebase signal on window from app provider
      if ((window as any).__firebase_user?.id) {
        userId = String((window as any).__firebase_user.id);
      }

      // Method 2: Check localStorage for firebase user (with error handling)
      if (!userId) {
        try {
          const firebaseUser = localStorage.getItem("__firebase_user");
          if (firebaseUser) {
            const data = JSON.parse(firebaseUser);
            userId = data?.id ? String(data.id) : null;
          }
        } catch (error) {
          ExtensionSecurityLogger.log('Error parsing Firebase user data', error);
        }
      }

      // Method 3: Check for cookie-based auth
      if (!userId) {
        try {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === '__firebase_user' && value) {
              const data = JSON.parse(decodeURIComponent(value));
              userId = data?.id ? String(data.id) : null;
              break;
            }
          }
        } catch (error) {
          ExtensionSecurityLogger.log('Error parsing Firebase user cookie', error);
        }
      }

      // Method 4: Fallback DOM attribute (sanitize input)
      if (!userId) {
        const el = document.querySelector("[data-user-id]");
        if (el) {
          const rawUserId = el.getAttribute("data-user-id");
          if (rawUserId && typeof rawUserId === 'string' && rawUserId.length < 100) {
            userId = rawUserId;
          }
        }
      }

      sendResponse({ userId });
      return true; // Keep the message channel open for async response
    } catch (error) {
      ExtensionSecurityLogger.log('Error retrieving user ID', error);
      sendResponse({ userId: null, error: 'Failed to retrieve user ID' });
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

// Also try to detect successful authentication by monitoring URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;

    // If we're on a dashboard or account page, try to get user ID and notify extension
    if (url.includes("/dashboard") || url.includes("/account")) {
      setTimeout(() => {
        // Give the page time to load user data
        chrome.runtime
          .sendMessage({
            action: "authSuccess",
            url: url,
          })
          .catch((error) => {
            console.debug("Auth success notification failed; extension context may be invalid", error);
          });
      }, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from the web app
window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;

  // Handle Firebase authentication success message
  if (event.data.type === "FIREBASE_AUTH_SUCCESS") {
    // Try to get user ID and notify extension
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
        chrome.runtime.sendMessage({ action: "authSuccess", userId });
        // Also persist directly
        chrome.storage.sync.set({ userId });
      }
    }, 1000);
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
        const base = (res.webAppUrl || window.location.origin).replace(/\/$/, "");
        const body = {
          defaultKeywords: res.defaultKeywords,
          defaultConnectionLevel: res.defaultConnectionLevel,
          autoConnectLimit: res.autoConnectLimit,
          autoMessage: res.autoMessage,
          connectionMessage: res.connectionMessage,
          autofillProfile: res.autofillProfile,
        };
        try {
          await fetch(`${base}/api/app/users/${encodeURIComponent(uid)}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch (syncError) {
          ExtensionSecurityLogger.log('Failed to sync web settings from extension', syncError);
        }
      });
    } catch (settingsError) {
      ExtensionSecurityLogger.log('Error preparing settings sync payload', settingsError);
    }
  }
});

// After existing listener for onMessage, add auto-detection

// --- Auto-detect Firebase user and notify background ---
function trySendUserId() {
  let userId: string | null = null;
  const w: any = window;
  if (w.__firebase_user?.id) {
    userId = String(w.__firebase_user.id);
  } else {
    try {
      const s = localStorage.getItem("__firebase_user");
      if (s) userId = JSON.parse(s)?.id ?? null;
    } catch (parseError) {
      ExtensionSecurityLogger.log('Error parsing Firebase user data during auto-sync', parseError);
    }
  }
  if (userId) {
    chrome.runtime.sendMessage({ action: "authSuccess", userId });
    // Also persist directly
    chrome.storage.sync.set({ userId });
    return true;
  }
  return false;
}

// initial attempt after load
setTimeout(() => {
  if (!trySendUserId()) {
    // fallback polling for 5s
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (trySendUserId() || attempts > 10) {
        clearInterval(interval);
      }
    }, 500);
  }
}, 1000);
