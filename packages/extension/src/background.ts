import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "./constants";
import { post } from "./apiClient";
import { checkRateLimit, initRateLimitCleanup } from "./rateLimiter";
import { startRateLimitMonitoring } from "./rateLimitStatus";
import {
  validateMessage,
  validateUrl,
  sanitizeJobData,
  validateJobData,
  SecureStorage,
  ExtensionRateLimiter,
  ExtensionSecurityLogger
} from "./security";

chrome.runtime.onInstalled.addListener(() => {
  console.log("HireallMonorepo extension installed");

  // Ensure web app URL exists for API calls
  chrome.storage.sync.get(["webAppUrl"], (result: { webAppUrl?: string }) => {
    if (!result.webAppUrl) {
      chrome.storage.sync.set({
        webAppUrl: DEFAULT_WEB_APP_URL,
      });
    } else {
      const sanitized = sanitizeBaseUrl(result.webAppUrl);
      if (sanitized !== result.webAppUrl) {
        chrome.storage.sync.set({ webAppUrl: sanitized });
      }
    }
  });

  // Initialize rate limiting cleanup and monitoring
  initRateLimitCleanup();
  startRateLimitMonitoring();
});

// Initialize security components
const messageRateLimiter = new ExtensionRateLimiter(60000, 50); // 50 messages per minute

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

  const resolveWithTab = async (tabId: number): Promise<{ updated: boolean; userId?: string; userEmail?: string }> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "getUserId" }, async (response) => {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || '';
          console.debug(`Failed to get user ID from tab ${tabId}: ${errorMessage}`);
          resolve({ updated: false });
          return;
        }

        const userId = response?.userId ? String(response.userId) : undefined;
        const userEmail = response?.userEmail ? String(response.userEmail) : undefined;

        if (!userId) {
          resolve({ updated: false });
          return;
        }

        await tryUpdateStorage(userId, userEmail);
        resolve({ updated: true, userId, userEmail });
      });
    });
  };

  if (options.userIdOverride) {
    await tryUpdateStorage(options.userIdOverride, options.userEmailOverride);
    return { updated: true, userId: options.userIdOverride, userEmail: options.userEmailOverride };
  }

  if (typeof options.tabId === "number") {
    return resolveWithTab(options.tabId);
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ url: targetPatterns }, async (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        const result = await resolveWithTab(tab.id);
        if (result.updated) {
          resolve(result);
          return;
        }
      }
      resolve({ updated: false });
    });
  });
}

// Handle messages from content script with security validation
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  // Check if extension context is still valid
  if (typeof chrome === "undefined" || !chrome.storage) {
    console.debug("Hireall: Extension context invalidated, cannot process message");
    sendResponse({ error: 'Extension context invalidated' });
    return false;
  }

  // Only process messages that are meant for the background script
  if (request.target && request.target !== 'background') {
    return undefined; // Let other handlers process this message
  }

  // Validate message format
  if (!validateMessage(request)) {
    ExtensionSecurityLogger.logSuspiciousActivity('invalid_message_format', request);
    sendResponse({ error: 'Invalid message format' });
    return;
  }

  // Rate limiting
  const senderId = sender.tab?.id?.toString() || 'unknown';
  if (!messageRateLimiter.isAllowed(senderId)) {
    ExtensionSecurityLogger.logSuspiciousActivity('rate_limit_exceeded', { senderId });
    sendResponse({ error: 'Rate limit exceeded' });
    return;
  }

  if (request.action === "addJob") {
    if (!isLinkedInUrl(request.data?.url)) {
      sendResponse({ error: 'Unsupported job source' });
      return;
    }
    // Validate and sanitize job data
    const validation = validateJobData(request.data);
    if (!validation.valid) {
      ExtensionSecurityLogger.logValidationFailure('job_data', request.data);
      sendResponse({ error: 'Invalid job data', details: validation.errors });
      return;
    }

    const sanitizedData = sanitizeJobData(request.data);
    handleJobData(sanitizedData);
    sendResponse({ success: true });
  } else if (request.action === "jobAddedToBoard") {
    if (!isLinkedInUrl(request.data?.url)) {
      sendResponse({ error: 'Unsupported job source' });
      return;
    }
    // Validate and sanitize job data
    const validation = validateJobData(request.data);
    if (!validation.valid) {
      ExtensionSecurityLogger.logValidationFailure('job_board_data', request.data);
      sendResponse({ error: 'Invalid job data', details: validation.errors });
      return;
    }

    const sanitizedData = sanitizeJobData(request.data);
    handleJobBoardAddition(sanitizedData);
    sendResponse({ success: true });
  } else if (request.action === "getWebAppUrl") {
    // Respond with webAppUrl
    SecureStorage.get<string>("webAppUrl").then(webAppUrl => {
      sendResponse({
        webAppUrl: sanitizeBaseUrl(webAppUrl || DEFAULT_WEB_APP_URL),
      });
    }).catch(error => {
      ExtensionSecurityLogger.log('Error retrieving web app URL', error);
      sendResponse({ error: 'Failed to retrieve web app URL' });
    });
    return true;
  } else if (request.action === "openJobUrl") {
    // Validate URL before opening
    if (request.url && validateUrl(request.url)) {
      chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
    } else {
      ExtensionSecurityLogger.logValidationFailure('job_url', request.url);
      sendResponse({ error: 'Invalid URL' });
    }
  } else if (request.action === "syncAuthState") {
    syncAuthStateFromSite()
      .then((result) => {
        sendResponse({ success: result.updated, userId: result.userId, userEmail: result.userEmail });
      })
      .catch((error) => {
        ExtensionSecurityLogger.log('Failed to sync auth state', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });
    return true;
  } else if (request.action === "extractHireallSession") {
    // Extract session from Hireall web app
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { action: "extractHireallSession" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to extract Hireall session:", chrome.runtime.lastError);
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
            console.log("Hireall session extracted and stored:", response.userId);
            sendResponse({
              success: true,
              userId: response.userId,
              userEmail: response.userEmail,
              isAuthenticated: response.isAuthenticated
            });
          });
        } else {
          sendResponse({ success: false, error: "No session found" });
        }
      });
    } else {
      sendResponse({ success: false, error: "No tab ID available" });
    }
    return true;
  } else if (request.action === "authSuccess") {
    // After web app login, capture Firebase UID and store
    console.log("Authentication successful, capturing Firebase uid");

    const messageData = (request?.data ?? {}) as { userId?: string; userEmail?: string };
    const overrideUid = messageData.userId ?? (typeof request.userId === "string" ? request.userId : undefined);
    const overrideEmail = messageData.userEmail ?? (typeof request.userEmail === "string" ? request.userEmail : undefined);

    const syncPromise = sender.tab?.id
      ? syncAuthStateFromSite({ tabId: sender.tab.id, userIdOverride: overrideUid, userEmailOverride: overrideEmail })
      : overrideUid
        ? syncAuthStateFromSite({ userIdOverride: overrideUid, userEmailOverride: overrideEmail })
        : Promise.resolve({ updated: false, userId: undefined, userEmail: undefined });

    syncPromise
      .then((result) => {
        if (result.updated) {
          console.log("Saved firebaseUid via authSuccess message:", result.userId);
        }

        sendResponse({
          success: true,
          userId: result.userId ?? overrideUid ?? null,
          userEmail: result.userEmail ?? overrideEmail ?? null,
        });
      })
      .catch((error) => {
        console.error("Error syncing auth state from authSuccess", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true;
  }
});

async function handleJobData(jobData: any) {
  // Check rate limit before processing
  const rateCheck = await checkRateLimit("job-add");
  if (!rateCheck.allowed) {
    const retryAfter = rateCheck.retryAfter || Math.ceil((rateCheck.resetIn || 0) / 1000);
    console.warn(
      `Rate limit exceeded for job-add endpoint. Try again in ${retryAfter} seconds.`
    );
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
      console.warn("No Firebase user id present; cannot sync job.");
      return;
    }

    // Generate client ID for rate limiting (local only)
    await getOrCreateClientId();

    try {
      await post("/api/app/jobs", {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        url: jobData.url,
        isSponsored: jobData.isSponsored,
        isRecruitmentAgency: jobData.isRecruitmentAgency || false,
        source: "extension",
        userId: uid,
      });
      console.log("Job data synced successfully");

      // Update local storage stats
      chrome.storage.local.get(["sponsoredJobs", "jobsToday"], (result) => {
        const sponsoredJobs =
          (result.sponsoredJobs || 0) + (jobData.isSponsored ? 1 : 0);
        const jobsToday = (result.jobsToday || 0) + 1;

        chrome.storage.local.set({
          sponsoredJobs,
          jobsToday,
        });
      });
    } catch (e) {
      console.error("Failed to sync job data:", e);
    }
  } catch (error) {
    console.error("Error handling job data:", error);
  }
}

async function handleJobBoardAddition(jobBoardEntry: any) {
  try {
    console.log("Job added to board:", jobBoardEntry);

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
    });

    // Optionally sync analytics to the web app in the future
  } catch (error) {
    console.error("Error handling job board addition:", error);
  }
}

async function getOrCreateClientId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["clientId"], (result) => {
      if (result.clientId) {
        resolve(result.clientId);
      } else {
        const newClientId =
          "bg-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now();
        chrome.storage.local.set({ clientId: newClientId }, () => {
          resolve(newClientId);
        });
      }
    });
  });
}
