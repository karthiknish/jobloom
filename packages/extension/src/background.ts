import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "./constants";
import { post } from "./apiClient";
import { checkRateLimit, initRateLimitCleanup, fetchSubscriptionStatus } from "./rateLimiter";
import type { SubscriptionStatus } from "./rateLimiter";
import { startRateLimitMonitoring } from "./rateLimitStatus";
import { cacheAuthToken, acquireIdToken, clearCachedAuthToken } from "./authToken";
import {
  validateMessage,
  validateUrl,
  sanitizeJobData,
  validateJobData,
  SecureStorage,
  ExtensionRateLimiter,
  ExtensionSecurityLogger
} from "./security";

// Import logging utility
import { logger, log } from "./utils/logger";

chrome.runtime.onInstalled.addListener(() => {
  log.extension("Extension installed");

  // Ensure web app URL exists for API calls - reset localhost to production
  chrome.storage.sync.get(["webAppUrl"], (result: { webAppUrl?: string }) => {
    const currentUrl = result.webAppUrl || '';
    const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
    
    if (!result.webAppUrl || isLocalhost) {
      logger.info("Background", "Setting default web app URL", { 
        url: DEFAULT_WEB_APP_URL,
        previousUrl: result.webAppUrl,
        wasLocalhost: isLocalhost
      });
      chrome.storage.sync.set({
        webAppUrl: DEFAULT_WEB_APP_URL,
      });
    } else {
      const sanitized = sanitizeBaseUrl(result.webAppUrl);
      if (sanitized !== result.webAppUrl) {
        logger.info("Background", "Sanitizing web app URL", {
          original: result.webAppUrl,
          sanitized
        });
        chrome.storage.sync.set({ webAppUrl: sanitized });
      }
    }
  });

  // Initialize rate limiting cleanup and monitoring
  initRateLimitCleanup();
  startRateLimitMonitoring();
  logger.info("Background", "Rate limiting and monitoring initialized");
});

// Initialize security components
const messageRateLimiter = new ExtensionRateLimiter(60000, 50); // 50 messages per minute
const authRateLimiter = new ExtensionRateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
const apiProxyRateLimiter = new ExtensionRateLimiter(60000, 400); // higher limit for API proxying

function isAllowedProxyUrl(url: string, baseUrl: string): boolean {
  try {
    const requestUrl = new URL(url);
    const base = new URL(sanitizeBaseUrl(baseUrl));

    // Only allow requests to the configured API origin.
    if (requestUrl.origin !== base.origin) return false;

    // Only allow API routes.
    return requestUrl.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

async function fetchWithTimeoutInBackground(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Enhanced authentication rate limiting
function checkAuthRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const isAllowed = authRateLimiter.isAllowed(identifier);
  
  if (!isAllowed) {
    // Calculate retry after time (when the window resets)
    const retryAfter = Math.ceil(authRateLimiter['windowMs'] / 1000); // Convert to seconds
    
    logger.warn("Background", "Auth rate limit exceeded", {
      identifier,
      retryAfter
    });
    
    return {
      allowed: false,
      retryAfter
    };
  }
  
  return { allowed: true };
}

function isLinkedInUrl(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("linkedin.com") && parsed.pathname.startsWith("/jobs/");
  } catch (error) {
    return false;
  }
}

async function syncAuthStateFromSite(options: { tabId?: number; userIdOverride?: string; userEmailOverride?: string } = {}): Promise<{ updated: boolean; userId?: string; userEmail?: string }> {
  logger.debug("Background", "Syncing auth state from site", {
    hasTabId: !!options.tabId,
    hasUserIdOverride: !!options.userIdOverride
  });

  const targetPatterns = [
    "https://hireall.app/*",
    "https://*.hireall.app/*",
    "https://*.vercel.app/*",
    "https://*.netlify.app/*",
  ];

  const tryUpdateStorage = (userId: string, userEmail?: string | null) => {
    return new Promise<void>((resolve) => {
      const payload: Record<string, string> = {
        firebaseUid: userId,
        userId,
      };
      if (userEmail) {
        payload.userEmail = userEmail;
      }
      chrome.storage.sync.set(payload, () => resolve());
    });
  };

  const cacheTokenFromTab = async (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "getAuthToken" }, async (tokenResponse) => {
        if (chrome.runtime.lastError) {
          resolve();
          return;
        }

        if (tokenResponse?.token && typeof tokenResponse.token === "string") {
          try {
            await cacheAuthToken({
              token: tokenResponse.token,
              userId: tokenResponse.userId,
              source: "background"
            });
          } catch (error) {
            logger.warn("Background", "Failed to cache auth token from tab", {
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        resolve();
      });
    });
  };

  const resolveWithTab = async (tabId: number): Promise<{ updated: boolean; userId?: string; userEmail?: string }> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "getUserId" }, async (response) => {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || '';
          logger.debug("Background", `Failed to get user ID from tab ${tabId}`, {
            error: errorMessage
          });
          resolve({ updated: false });
          return;
        }

        const userId = response?.userId ? String(response.userId) : undefined;
        const userEmail = response?.userEmail ? String(response.userEmail) : undefined;

        if (!userId) {
          logger.debug("Background", `No user ID found in tab ${tabId}`);
          resolve({ updated: false });
          return;
        }

        logger.info("Background", "Updating auth state from tab", {
          tabId,
          userId,
          hasEmail: !!userEmail
        });

        await tryUpdateStorage(userId, userEmail);
        await cacheTokenFromTab(tabId);
        resolve({ updated: true, userId, userEmail });
      });
    });
  };

  if (options.userIdOverride) {
    logger.info("Background", "Using user ID override", {
      userId: options.userIdOverride,
      hasEmail: !!options.userEmailOverride
    });
    await tryUpdateStorage(options.userIdOverride, options.userEmailOverride);
    return { updated: true, userId: options.userIdOverride, userEmail: options.userEmailOverride };
  }

  if (typeof options.tabId === "number") {
    return resolveWithTab(options.tabId);
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ url: targetPatterns }, async (tabs) => {
      logger.debug("Background", `Found ${tabs.length} matching tabs for auth sync`);

      for (const tab of tabs) {
        if (!tab.id) continue;
        const result = await resolveWithTab(tab.id);
        if (result.updated) {
          resolve(result);
          return;
        }
      }
      logger.debug("Background", "No valid auth state found in any tabs");
      resolve({ updated: false });
    });
  });
}

// Handle messages from content script with security validation.
// IMPORTANT: MV3 requires returning `true` synchronously to keep the message port open.
// Do not mark this listener as `async`.
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  const startTime = Date.now();
  const senderId = sender.tab?.id?.toString() || 'unknown';

  logger.debug("Background", "Received message", {
    action: request?.action || request?.type,
    senderId,
    hasData: !!request?.data || !!request?.payload
  });

  // Check if extension context is still valid
  if (typeof chrome === "undefined" || !chrome.storage) {
    logger.error("Background", "Extension context invalidated, cannot process message");
    sendResponse({ error: 'Extension context invalidated' });
    return false;
  }

  // Handle AUTH_STATE_CHANGED from content scripts (uses 'type' instead of 'action')
  if (request.type === 'AUTH_STATE_CHANGED' && request.payload) {
    logger.info("Background", "Auth state changed received", {
      isAuthenticated: request.payload.isAuthenticated,
      hasUserId: !!request.payload.userId,
      source: request.payload.source
    });

    void (async () => {
      if (request.payload.isAuthenticated === false) {
        try {
          await clearCachedAuthToken();
        } catch (error) {
          logger.warn("Background", "Failed to clear cached auth token on logout", {
            error: error instanceof Error ? error.message : String(error)
          });
        }

        await new Promise<void>((resolve) => {
          chrome.storage.sync.remove(["firebaseUid", "userId", "userEmail", "sessionToken"], () => {
            if (chrome.runtime.lastError) {
              logger.warn("Background", "Failed to clear sync auth identifiers on logout", {
                error: chrome.runtime.lastError.message
              });
            }
            resolve();
          });
        });

        sendResponse({ success: true });
        return;
      }

      if (request.payload.isAuthenticated && request.payload.token) {
        try {
          await cacheAuthToken({
            token: request.payload.token,
            userId: request.payload.userId,
            userEmail: request.payload.email,
            source: "background"
          });

          // Also store userId in sync storage for other components
          if (request.payload.userId) {
            await chrome.storage.sync.set({
              firebaseUid: request.payload.userId,
              userId: request.payload.userId,
              userEmail: request.payload.email
            });
          }

          logger.info("Background", "Auth state cached successfully");
        } catch (error) {
          logger.warn("Background", "Failed to cache auth state", {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      sendResponse({ success: true });
    })();

    return true;
  }

  // Handle FORCE_SYNC_REQUEST from content scripts
  if (request.type === 'FORCE_SYNC_REQUEST' && request.payload) {
    logger.info("Background", "Force sync request received");

    void (async () => {
      if (request.payload.token) {
        try {
          await cacheAuthToken({
            token: request.payload.token,
            userId: request.payload.userId,
            userEmail: request.payload.userEmail,
            source: "background"
          });
          logger.info("Background", "Force sync completed");
        } catch (error) {
          logger.warn("Background", "Force sync failed", {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      sendResponse({ success: true });
    })();

    return true;
  }

  // Only process messages that are meant for the background script
  if (request.target && request.target !== 'background') {
    logger.debug("Background", "Message not for background script", {
      target: request.target
    });
    return undefined; // Let other handlers process this message
  }

  // Validate message format
  if (!validateMessage(request)) {
    ExtensionSecurityLogger.logSuspiciousActivity('invalid_message_format', request);
    logger.warn("Background", "Invalid message format", { action: request?.action });
    sendResponse({ error: 'Invalid message format' });
    return;
  }

  // Rate limiting
  if (request?.action === 'apiProxy') {
    if (!apiProxyRateLimiter.isAllowed(senderId)) {
      ExtensionSecurityLogger.logSuspiciousActivity('api_proxy_rate_limit_exceeded', { senderId });
      logger.warn('Background', 'API proxy rate limit exceeded', { senderId });
      sendResponse({ success: false, error: 'Rate limit exceeded' });
      return;
    }
  } else if (!messageRateLimiter.isAllowed(senderId)) {
    ExtensionSecurityLogger.logSuspiciousActivity('rate_limit_exceeded', { senderId });
    logger.warn("Background", "Rate limit exceeded", { senderId });
    sendResponse({ error: 'Rate limit exceeded' });
    return;
  }

  if (request.action === "addJob") {
    if (!isLinkedInUrl(request.data?.url)) {
      logger.warn("Background", "Unsupported job source for addJob", {
        url: request.data?.url
      });
      sendResponse({ error: 'Unsupported job source' });
      return;
    }
    // Validate and sanitize job data
    const validation = validateJobData(request.data);
    if (!validation.valid) {
      ExtensionSecurityLogger.logValidationFailure('job_data', request.data);
      logger.warn("Background", "Invalid job data for addJob", {
        errors: validation.errors,
        company: request.data?.company
      });
      sendResponse({ error: 'Invalid job data', details: validation.errors });
      return;
    }

    const sanitizedData = sanitizeJobData(request.data);
    logger.info("Background", "Processing addJob request", {
      company: sanitizedData.company,
      title: sanitizedData.title,
      url: sanitizedData.url
    });

    handleJobData(sanitizedData);
    sendResponse({ success: true });
  } else if (request.action === "jobAddedToBoard") {
    if (!isLinkedInUrl(request.data?.url)) {
      logger.warn("Background", "Unsupported job source for jobAddedToBoard", {
        url: request.data?.url
      });
      sendResponse({ error: 'Unsupported job source' });
      return;
    }
    // Validate and sanitize job data
    const validation = validateJobData(request.data);
    if (!validation.valid) {
      ExtensionSecurityLogger.logValidationFailure('job_board_data', request.data);
      logger.warn("Background", "Invalid job data for jobAddedToBoard", {
        errors: validation.errors,
        company: request.data?.company
      });
      sendResponse({ error: 'Invalid job data', details: validation.errors });
      return;
    }

    const sanitizedData = sanitizeJobData(request.data);
    logger.info("Background", "Processing jobAddedToBoard request", {
      company: sanitizedData.company,
      title: sanitizedData.title,
      url: sanitizedData.url
    });

    handleJobBoardAddition(sanitizedData);
    sendResponse({ success: true });
  } else if (request.action === "getWebAppUrl") {
    // Respond with webAppUrl
    SecureStorage.get<string>("webAppUrl").then(webAppUrl => {
      const finalUrl = sanitizeBaseUrl(webAppUrl || DEFAULT_WEB_APP_URL);
      logger.debug("Background", "Retrieved web app URL", { url: finalUrl });
      sendResponse({
        webAppUrl: finalUrl,
      });
    }).catch(error => {
      ExtensionSecurityLogger.log('Error retrieving web app URL', error);
      logger.error("Background", "Failed to retrieve web app URL", {
        error: error instanceof Error ? error.message : String(error)
      });
      sendResponse({ error: 'Failed to retrieve web app URL' });
    });
    return true;
  } else if (request.action === "fetchSubscriptionStatus") {
    logger.debug("Background", "Fetching subscription status on behalf of content script");
    fetchSubscriptionStatus()
      .then((status: SubscriptionStatus | null) => {
        logger.debug("Background", "Subscription status retrieved", {
          hasStatus: !!status,
          plan: status?.plan || status?.subscription?.plan
        });
        sendResponse({ success: true, status });
      })
      .catch((error: unknown) => {
        ExtensionSecurityLogger.log('Failed to fetch subscription status proxy', error);
        logger.error("Background", "Subscription status proxy failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });
    return true;
  } else if (request.action === "apiProxy") {
    console.log('[Hireall:BG] apiProxy message received', {
      url: request.data?.url,
      method: request.data?.method,
      requestId: request.data?.requestId,
    });

    void (async () => {
      try {
        const data = request.data ?? {};
        const url = typeof data.url === 'string' ? data.url : '';
        const method = typeof data.method === 'string' ? data.method : 'GET';
        const headers = (data.headers && typeof data.headers === 'object') ? data.headers : {};
        const body = typeof data.body === 'string' ? data.body : undefined;
        const timeoutMs = typeof data.timeoutMs === 'number' && Number.isFinite(data.timeoutMs)
          ? Math.max(1000, Math.min(120000, data.timeoutMs))
          : 30000;
        const requestId = typeof data.requestId === 'string' ? data.requestId : undefined;

        const storage = await chrome.storage.sync.get(['webAppUrl']);
        const configuredBase = typeof storage?.webAppUrl === 'string' ? storage.webAppUrl : DEFAULT_WEB_APP_URL;

        if (!url || !isAllowedProxyUrl(url, configuredBase)) {
          logger.warn('Background', 'Blocked apiProxy request (invalid/forbidden URL)', {
            requestId,
            url,
            configuredBase: sanitizeBaseUrl(configuredBase),
            senderId,
          });
          sendResponse({ success: false, error: 'Forbidden URL' });
          return;
        }

        logger.debug('Background', 'Proxying API request', {
          requestId,
          method,
          url,
          timeoutMs,
          senderId,
        });

        console.log('[Hireall:BG] apiProxy starting fetch', { requestId, method, url, timeoutMs });

        const res = await fetchWithTimeoutInBackground(url, {
          method,
          headers,
          body,
          // Keep behavior consistent with client: include cookies when present.
          credentials: 'include',
        }, timeoutMs);

        console.log('[Hireall:BG] apiProxy fetch completed', { requestId, status: res.status });

        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        // Serialize headers for message passing.
        const headerObj: Record<string, string> = {};
        try {
          res.headers.forEach((value, key) => {
            headerObj[key] = value;
          });
        } catch {
          // ignore
        }

        console.log('[Hireall:BG] apiProxy sending success response', { reqId: requestId, status: res.status, bodyLength: text.length });
        sendResponse({
          success: true,
          status: res.status,
          statusText: res.statusText,
          headers: headerObj,
          contentType,
          bodyText: text,
        });
      } catch (error: any) {
        console.error('[Hireall:BG] apiProxy error', { error: error instanceof Error ? error.message : String(error) });
        logger.warn('Background', 'apiProxy failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
    return true;
  } else if (request.action === "openJobUrl") {
    // Validate URL before opening
    if (request.url && validateUrl(request.url)) {
      logger.info("Background", "Opening job URL", { url: request.url });
      chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
    } else {
      ExtensionSecurityLogger.logValidationFailure('job_url', request.url);
      logger.warn("Background", "Invalid URL for openJobUrl", { url: request.url });
      sendResponse({ error: 'Invalid URL' });
    }
  } else if (request.action === "syncAuthState") {
    logger.debug("Background", "Syncing auth state");
    syncAuthStateFromSite()
      .then((result) => {
        logger.info("Background", "Auth state sync completed", {
          success: result.updated,
          hasUserId: !!result.userId
        });
        sendResponse({ success: result.updated, userId: result.userId, userEmail: result.userEmail });
      })
      .catch((error) => {
        ExtensionSecurityLogger.log('Failed to sync auth state', error);
        logger.error("Background", "Auth state sync failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });
    return true;
  } else if (request.action === "extractHireallSession") {
    // Extract session from Hireall web app
    if (sender.tab?.id) {
      logger.debug("Background", "Extracting Hireall session", { tabId: sender.tab.id });
      chrome.tabs.sendMessage(sender.tab.id, { action: "extractHireallSession" }, (response) => {
        if (chrome.runtime.lastError) {
          logger.error("Background", "Failed to extract Hireall session", {
            error: chrome.runtime.lastError.message
          });
          sendResponse({ success: false, error: "Failed to extract session" });
          return;
        }

        if (response && response.sessionToken) {
          // Store the session token and user info
          const payload: Record<string, string> = {
            sessionToken: response.sessionToken,
          };

          if (response.userId) payload.firebaseUid = response.userId;
          if (response.userEmail) payload.userEmail = response.userEmail;

          chrome.storage.sync.set(payload, () => {
            logger.info("Background", "Hireall session extracted and stored", {
              userId: response.userId,
              hasEmail: !!response.userEmail
            });
            sendResponse({
              success: true,
              userId: response.userId,
              userEmail: response.userEmail,
              isAuthenticated: response.isAuthenticated
            });
          });
        } else {
          logger.debug("Background", "No session found in Hireall web app");
          sendResponse({ success: false, error: "No session found" });
        }
      });
    } else {
      logger.warn("Background", "No tab ID available for session extraction");
      sendResponse({ success: false, error: "No tab ID available" });
    }
    return true;
  } else if (request.action === "googleSignIn") {
    // Run OAuth from background so the popup closing doesn't interrupt the flow.
    const authIdentifier = sender.tab?.id?.toString() || sender.id || 'popup';
    const rateLimitCheck = checkAuthRateLimit(authIdentifier);

    if (!rateLimitCheck.allowed) {
      sendResponse({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: rateLimitCheck.retryAfter,
      });
      return true;
    }

    // Respond immediately to avoid MV3 message port timeouts during OAuth.
    // The actual result will be persisted (storage) and broadcast via AUTH_STATE_CHANGED.
    sendResponse({ success: true, started: true });

    void (async () => {
      try {
        // Dynamic import keeps the background bundle smaller and avoids eager Firebase init.
        const { signInWithGoogle, getAuthInstance } = await import('./firebase');

        const user = await signInWithGoogle();

        // Ensure token is minted and cached for API usage.
        const token = await user.getIdToken();
        await cacheAuthToken({
          token,
          userId: user.uid,
          userEmail: user.email ?? undefined,
          source: 'background',
        });

        // Store identifiers for other extension components.
        if (chrome.storage?.sync) {
          await chrome.storage.sync.set({
            firebaseUid: user.uid,
            userId: user.uid,
            userEmail: user.email,
          });
        }

        // Also write Firebase state into local storage, useful for debugging.
        if (chrome.storage?.local) {
          await chrome.storage.local.set({
            hireallLastGoogleSignInError: null,
            hireallLastGoogleSignInAt: Date.now(),
          });
        }

        // Touch auth instance to encourage persistence initialization.
        void getAuthInstance();

        // Broadcast so any open extension pages can react.
        try {
          chrome.runtime.sendMessage({
            type: 'AUTH_STATE_CHANGED',
            payload: {
              isAuthenticated: true,
              userId: user.uid,
              email: user.email,
              token,
              source: 'background_google_signin',
            },
          });
        } catch {
          // Ignore broadcast failures.
        }
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Background', 'Google sign-in failed (background)', { message });

        if (chrome.storage?.local) {
          await chrome.storage.local.set({
            hireallLastGoogleSignInError: { message, at: Date.now() },
          });
        }

      }
    })();

    return true;
  } else if (request.action === "acquireAuthToken") {
    const forceRefresh = request.forceRefresh === true;

    // First try the standard acquireIdToken (uses cache, then Firebase auth.currentUser)
    acquireIdToken(forceRefresh, { skipMessageFallback: true })
      .then(async (token) => {
        if (token) {
          // Token found, return it with user info
          chrome.storage.sync.get(["firebaseUid", "userId", "userEmail"], (storage) => {
            if (chrome.runtime?.lastError) {
              logger.warn("Background", "Failed to read user info for auth token response", {
                error: chrome.runtime.lastError.message
              });
            }

            const userId = storage?.firebaseUid || storage?.userId || null;
            const userEmail = storage?.userEmail || null;
            sendResponse({ success: true, token, userId, userEmail });
          });
          return;
        }

        // No token from cache or currentUser - try waiting for Firebase auth to restore
        logger.debug("Background", "No immediate token, waiting for Firebase auth state...");
        try {
          const { waitForAuthState } = await import('./firebase');
          const user = await waitForAuthState();
          
          if (user) {
            logger.debug("Background", "Firebase auth state restored, getting token", { uid: user.uid });
            const freshToken = await user.getIdToken(forceRefresh);
            
            // Cache the token for future use
            await cacheAuthToken({
              token: freshToken,
              userId: user.uid,
              userEmail: user.email ?? undefined,
              source: 'background',
            });

            sendResponse({ success: true, token: freshToken, userId: user.uid, userEmail: user.email });
          } else {
            logger.debug("Background", "No Firebase user after waiting for auth state");
            sendResponse({ success: false, error: "No token available" });
          }
        } catch (waitError) {
          logger.warn("Background", "Failed to wait for Firebase auth state", {
            error: waitError instanceof Error ? waitError.message : String(waitError)
          });
          sendResponse({ success: false, error: "No token available" });
        }
      })
      .catch((error) => {
        logger.error("Background", "Failed to acquire auth token for requester", {
          error: error instanceof Error ? error.message : String(error)
        });
        sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      });

    return true;
  } else if (request.action === "authSuccess") {
    // After web app login, capture Firebase UID and store
    logger.info("Background", "Authentication successful, capturing Firebase UID");

    // Apply authentication rate limiting
    const authIdentifier = sender.tab?.id?.toString() || sender.id || 'unknown';
    const rateLimitCheck = checkAuthRateLimit(authIdentifier);
    
    if (!rateLimitCheck.allowed) {
      logger.warn("Background", "Authentication rate limit exceeded", {
        authIdentifier,
        retryAfter: rateLimitCheck.retryAfter
      });
      sendResponse({ 
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: rateLimitCheck.retryAfter 
      });
      return;
    }

  const messageData = (request?.data ?? {}) as { userId?: string; userEmail?: string; token?: string };
    const overrideUid = messageData.userId ?? (typeof request.userId === "string" ? request.userId : undefined);
    const overrideEmail = messageData.userEmail ?? (typeof request.userEmail === "string" ? request.userEmail : undefined);

    logger.debug("Background", "Auth success data", {
      hasOverrideUid: !!overrideUid,
      hasOverrideEmail: !!overrideEmail,
      hasTabId: !!sender.tab?.id
    });

    const syncPromise = sender.tab?.id
      ? syncAuthStateFromSite({ tabId: sender.tab.id, userIdOverride: overrideUid, userEmailOverride: overrideEmail })
      : overrideUid
        ? syncAuthStateFromSite({ userIdOverride: overrideUid, userEmailOverride: overrideEmail })
        : Promise.resolve({ updated: false, userId: undefined, userEmail: undefined });

    syncPromise
      .then((result) => {
        const resolvedUserId = result.userId ?? overrideUid ?? undefined;
        const resolvedEmail = result.userEmail ?? overrideEmail ?? undefined;

        if (typeof messageData.token === "string" && messageData.token.length > 0) {
          cacheAuthToken({
            token: messageData.token,
            userId: resolvedUserId,
            userEmail: resolvedEmail,
            source: "background"
          }).catch((error) => {
            logger.warn("Background", "Failed to cache auth token from authSuccess", {
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }

        if (result.updated) {
          logger.info("Background", "Saved firebaseUid via authSuccess message", {
            userId: result.userId
          });
        }

        sendResponse({
          success: true,
          userId: resolvedUserId ?? null,
          userEmail: resolvedEmail ?? null,
        });
      })
      .catch((error) => {
        logger.error("Background", "Error syncing auth state from authSuccess", {
          error: error instanceof Error ? error.message : String(error)
        });
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true;
  } else {
    logger.warn("Background", "Unhandled message action", {
      action: request?.action,
      senderId
    });
    sendResponse({ error: 'Unknown action' });
  }

  // Log total processing time
  const processingTime = Date.now() - startTime;
  logger.debug("Background", "Message processing completed", {
    action: request?.action,
    processingTime,
    senderId
  });
});

async function handleJobData(jobData: any) {
  logger.info("Background", "Handling job data", {
    title: jobData.title,
    company: jobData.company,
    isSponsored: jobData.isSponsored
  });

  // Check rate limit before processing
  const rateCheck = await checkRateLimit("job-add");
  if (!rateCheck.allowed) {
    const retryAfter = rateCheck.retryAfter || Math.ceil((rateCheck.resetIn || 0) / 1000);
    logger.warn("Background", "Rate limit exceeded for job-add", {
      retryAfter,
      resetIn: rateCheck.resetIn
    });
    return;
  }

  try {
    // Get web app URL and user id from storage
    const result = await chrome.storage.sync.get([
      "webAppUrl",
      "firebaseUid",
      "userId",
    ]) as { webAppUrl?: string; firebaseUid?: string; userId?: string };
    const uid = result.firebaseUid || result.userId;
    if (!uid) {
      logger.warn("Background", "No Firebase user ID present, cannot sync job");
      return;
    }

    // Generate client ID for rate limiting (local only)
    await getOrCreateClientId();

    try {
      log.time("Background", "job-api-call");
      await post("/api/app/jobs", {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        url: jobData.url,
        isSponsored: jobData.isSponsored,
        source: "extension",
        userId: uid,
      });
      log.timeEnd("Background", "job-api-call");

      logger.info("Background", "Job data synced successfully", {
        title: jobData.title,
        company: jobData.company
      });

      // Update local storage stats
      chrome.storage.local.get(["sponsoredJobs", "jobsToday"], (result) => {
        const sponsoredJobs =
          (result.sponsoredJobs || 0) + (jobData.isSponsored ? 1 : 0);
        const jobsToday = (result.jobsToday || 0) + 1;

        chrome.storage.local.set({
          sponsoredJobs,
          jobsToday,
        });

        logger.debug("Background", "Updated job statistics", {
          sponsoredJobs,
          jobsToday
        });
      });
    } catch (e) {
      logger.error("Background", "Failed to sync job data", {
        error: e instanceof Error ? e.message : String(e),
        title: jobData.title,
        company: jobData.company
      });
    }
  } catch (error) {
    logger.error("Background", "Error handling job data", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleJobBoardAddition(jobBoardEntry: any) {
  try {
    logger.info("Background", "Job added to board", {
      title: jobBoardEntry.title,
      company: jobBoardEntry.company,
      url: jobBoardEntry.url
    });

    // Update local stats
    chrome.storage.local.get(["jobBoardStats"], (result: { jobBoardStats?: any }) => {
      const stats = result.jobBoardStats || {
        totalAdded: 0,
        addedToday: 0,
        lastResetDate: new Date().toDateString(),
      };

      // Reset daily count if it's a new day
      const today = new Date().toDateString();
      if (stats.lastResetDate !== today) {
        stats.addedToday = 0;
        stats.lastResetDate = today;
      }

      stats.totalAdded++;
      stats.addedToday++;

      chrome.storage.local.set({ jobBoardStats: stats });

      logger.debug("Background", "Updated job board statistics", {
        totalAdded: stats.totalAdded,
        addedToday: stats.addedToday
      });
    });

    // Optionally sync analytics to the web app in the future
  } catch (error) {
    logger.error("Background", "Error handling job board addition", {
      error: error instanceof Error ? error.message : String(error),
      title: jobBoardEntry?.title,
      company: jobBoardEntry?.company
    });
  }
}

async function getOrCreateClientId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["clientId"], (result) => {
      if (result.clientId) {
        logger.debug("Background", "Using existing client ID", { clientId: result.clientId });
        resolve(result.clientId);
      } else {
        const newClientId =
          "bg-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now();
        chrome.storage.local.set({ clientId: newClientId }, () => {
          logger.debug("Background", "Created new client ID", { clientId: newClientId });
          resolve(newClientId);
        });
      }
    });
  });
}
