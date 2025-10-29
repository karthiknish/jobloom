import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "./constants";
import { post } from "./apiClient";
import { checkRateLimit, initRateLimitCleanup, fetchSubscriptionStatus } from "./rateLimiter";
import type { SubscriptionStatus } from "./rateLimiter";
import { startRateLimitMonitoring } from "./rateLimitStatus";
import { cacheAuthToken, acquireIdToken } from "./authToken";
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

  // Ensure web app URL exists for API calls
  chrome.storage.sync.get(["webAppUrl"], (result: { webAppUrl?: string }) => {
    if (!result.webAppUrl) {
      logger.info("Background", "Setting default web app URL", { url: DEFAULT_WEB_APP_URL });
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

// Enhanced authentication rate limiting
async function checkAuthRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
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

// Handle messages from content script with security validation
chrome.runtime.onMessage.addListener(async (request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  const startTime = Date.now();
  const senderId = sender.tab?.id?.toString() || 'unknown';

  logger.debug("Background", "Received message", {
    action: request?.action,
    senderId,
    hasData: !!request?.data
  });

  // Check if extension context is still valid
  if (typeof chrome === "undefined" || !chrome.storage) {
    logger.error("Background", "Extension context invalidated, cannot process message");
    sendResponse({ error: 'Extension context invalidated' });
    return false;
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
  if (!messageRateLimiter.isAllowed(senderId)) {
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
  } else if (request.action === "acquireAuthToken") {
    const forceRefresh = request.forceRefresh === true;

    acquireIdToken(forceRefresh, { skipMessageFallback: true })
      .then((token) => {
        if (!token) {
          sendResponse({ success: false, error: "No token available" });
          return;
        }

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
    const rateLimitCheck = await checkAuthRateLimit(authIdentifier);
    
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
