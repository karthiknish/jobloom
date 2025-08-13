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

  // Set default Convex URL if not already set
  chrome.storage.sync.get(["convexUrl"], (result) => {
    if (!result.convexUrl) {
      chrome.storage.sync.set({
        convexUrl: process.env.CONVEX_URL || "https://rare-chihuahua-615.convex.cloud",
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
    // Store job data and sync with Convex
    handleJobData(request.data);
  } else if (request.action === "jobAddedToBoard") {
    // Handle job board analytics
    handleJobBoardAddition(request.data);
  } else if (request.action === "getConvexUrl") {
    chrome.storage.sync.get(["convexUrl"], (result) => {
      sendResponse({ convexUrl: result.convexUrl });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === "authSuccess") {
    // After web app login, resolve Clerk ID -> Convex userId and store it
    console.log("Authentication successful, resolving Convex user id");
    if (sender.tab && sender.tab.id) {
      try {
        chrome.tabs.sendMessage(
          sender.tab.id,
          { action: "getUserId" },
          async (res) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Could not retrieve userId:",
                chrome.runtime.lastError.message
              );
              return;
            }
            const clerkId = res && res.userId ? String(res.userId) : null;
            if (!clerkId) return;

            const { convexUrl } = await chrome.storage.sync.get(["convexUrl"]);
            const base =
              convexUrl ||
              process.env.CONVEX_URL ||
              "https://rare-chihuahua-615.convex.cloud";
            try {
              const resp = await fetch(`${base}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  path: "users:getUserByClerkId",
                  args: { clerkId },
                }),
              });
              let convexUser: any = null;
              if (resp.ok) {
                convexUser = await resp.json();
              }
              if (!convexUser) {
                // create minimal user
                const createResp = await fetch(`${base}/api/mutation`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    path: "users:createUser",
                    args: { email: "", name: "", clerkId },
                  }),
                });
                if (createResp.ok) {
                  convexUser = await createResp.json();
                }
              }

              if (convexUser) {
                const convexUserId =
                  typeof convexUser === "string" ? convexUser : convexUser._id;
                chrome.storage.sync.set({ convexUserId }, () => {
                  console.log("Saved convexUserId:", convexUserId);
                });
              }
            } catch (err) {
              console.error("Failed to resolve Convex user id:", err);
            }
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
    // Get Convex URL from storage
    const result = await chrome.storage.sync.get(["convexUrl"]);
    const convexUrl = result.convexUrl;

    if (
      !convexUrl ||
      convexUrl === "https://your-convex-deployment.convex.cloud"
    ) {
      console.warn(
        "Convex URL not configured. Please set it in the extension popup.",
      );
      return;
    }

    // Generate client ID for rate limiting
    const clientId = await getOrCreateClientId();

    // Send job data to Convex
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "jobs:createJob",
        args: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          url: jobData.url,
          isSponsored: jobData.isSponsored,
          isRecruitmentAgency: jobData.isRecruitmentAgency || false,
          source: "extension",
          userId: "temp-user-id", // This should be replaced with actual user ID from auth
          clientId: clientId,
        },
      }),
    });

    if (response.status === 429) {
      console.warn("Rate limited by Convex server");
      return;
    }

    if (response.ok) {
      console.log("Job data synced to Convex successfully");

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
      if (errorText.includes("Rate limit exceeded")) {
        console.warn("Convex rate limit exceeded:", errorText);
      } else {
        console.error("Failed to sync job data to Convex:", errorText);
      }
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

    // Optionally sync to Convex for analytics
    // This could be used for tracking user engagement
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
