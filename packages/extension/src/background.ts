import { DEFAULT_WEB_APP_URL } from "./constants";
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
        webAppUrl: process.env.WEB_APP_URL || DEFAULT_WEB_APP_URL,
      });
    }
  });

  // Initialize rate limiting cleanup and monitoring
  initRateLimitCleanup();
  startRateLimitMonitoring();
});

// Initialize security components
const messageRateLimiter = new ExtensionRateLimiter(60000, 50); // 50 messages per minute

// Handle messages from content script with security validation
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
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
    SecureStorage.get("webAppUrl").then(webAppUrl => {
      sendResponse({
        webAppUrl: webAppUrl || DEFAULT_WEB_APP_URL,
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
  } else if (request.action === "authSuccess") {
    // After web app login, capture Firebase UID and store
    console.log("Authentication successful, capturing Firebase uid");
    if (sender.tab && sender.tab.id) {
      try {
        chrome.tabs.sendMessage(
          sender.tab.id,
          { action: "getUserId" },
          (res) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Could not retrieve userId:",
                chrome.runtime.lastError.message
              );
              return;
            }
            const uid = res && res.userId ? String(res.userId) : null;
            if (!uid) return;
            chrome.storage.sync.set({ firebaseUid: uid }, () => {
              console.log("Saved firebaseUid:", uid);
            });
          }
        );
      } catch (e) {
        console.error("Error requesting userId", e);
      }
    }
  }
});

async function handleJobData(jobData: any) {
  // Check rate limit before processing
  const rateCheck = checkRateLimit("job-add");
  if (!rateCheck.allowed) {
    console.warn(
      `Rate limit exceeded for job-add endpoint. Try again in ${Math.ceil(
        (rateCheck.resetIn || 0) / 1000
      )} seconds.`
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
