import { DEFAULT_WEB_APP_URL } from "./constants";
// Rate limiting configuration
const RATE_LIMITS = {
  addJob: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  general: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
};

// Rate limiting state
const rateLimitState = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(endpoint: string): boolean {
  const config =
    RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.general;
  const now = Date.now();
  const state = rateLimitState.get(endpoint);

  if (!state || now > state.resetTime) {
    // Reset or initialize
    rateLimitState.set(endpoint, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (state.count >= config.maxRequests) {
    console.warn(
      `Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil((state.resetTime - now) / 1000)} seconds.`,
    );
    return false;
  }

  state.count++;
  return true;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("JobloomMonorepo extension installed");

  // Ensure web app URL exists for API calls
  chrome.storage.sync.get(["webAppUrl"], (result) => {
    if (!result.webAppUrl) {
      chrome.storage.sync.set({
  webAppUrl: process.env.WEB_APP_URL || DEFAULT_WEB_APP_URL,
      });
    }
  });

  // Initialize rate limiting cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [endpoint, state] of rateLimitState.entries()) {
      if (now > state.resetTime) {
        rateLimitState.delete(endpoint);
      }
    }
  }, 60000); // Cleanup every minute
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addJob") {
    // Store job data and sync with web API
    handleJobData(request.data);
  } else if (request.action === "jobAddedToBoard") {
    // Handle job board analytics
    handleJobBoardAddition(request.data);
  } else if (request.action === "getWebAppUrl") {
    // Respond with webAppUrl
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      sendResponse({
        webAppUrl: result.webAppUrl,
      });
    });
    return true;
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
  if (!checkRateLimit("addJob")) {
    console.warn("Rate limit exceeded for adding jobs. Skipping request.");
    return;
  }

  try {
    // Get web app URL and user id from storage
    const result = await chrome.storage.sync.get([
      "webAppUrl",
      "firebaseUid",
      "userId",
    ]);
    const baseUrl = (
      result.webAppUrl ||
  process.env.WEB_APP_URL ||
  DEFAULT_WEB_APP_URL
    ).replace(/\/$/, "");
    const uid = result.firebaseUid || result.userId;
    if (!uid) {
      console.warn("No Firebase user id present; cannot sync job.");
      return;
    }

    // Generate client ID for rate limiting (local only)
    await getOrCreateClientId();

    // Create job in web API
  const response = await fetch(`${baseUrl}/api/app/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        url: jobData.url,
        isSponsored: jobData.isSponsored,
        isRecruitmentAgency: jobData.isRecruitmentAgency || false,
        source: "extension",
        userId: uid,
      }),
    });

    if (response.ok) {
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
    } else {
      const errorText = await response.text();
      console.error("Failed to sync job data:", errorText);
    }
  } catch (error) {
    console.error("Error handling job data:", error);
  }
}

async function handleJobBoardAddition(jobBoardEntry: any) {
  try {
    console.log("Job added to board:", jobBoardEntry);

    // Update local stats
    chrome.storage.local.get(["jobBoardStats"], (result) => {
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
