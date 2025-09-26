import { DEFAULT_WEB_APP_URL, OAUTH_CONFIG } from "./constants";
// Rate limiting configuration
const RATE_LIMITS = {
  addJob: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  general: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
};

// Rate limiting state
const rateLimitState = new Map<string, { count: number; resetTime: number }>();

// OAuth helper functions
function decodeBase64ClientSecret(): string {
  try {
    const base64Secret = OAUTH_CONFIG.clientSecret;
    if (!base64Secret) {
      throw new Error("OAuth client secret not configured");
    }
    return atob(base64Secret);
  } catch (error) {
    console.error("Failed to decode OAuth client secret:", error);
    return "";
  }
}

async function initiateOAuthFlow(): Promise<string | null> {
  try {
    const authUrl = new URL(OAUTH_CONFIG.authUrl);
    authUrl.searchParams.set("client_id", OAUTH_CONFIG.clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", OAUTH_CONFIG.redirectUrl);
    authUrl.searchParams.set("scope", OAUTH_CONFIG.scopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    if (redirectUrl) {
      const url = new URL(redirectUrl);
      const code = url.searchParams.get("code");
      if (code) {
        return code;
      }
    }

    return null;
  } catch (error) {
    console.error("OAuth flow failed:", error);
    return null;
  }
}

async function exchangeCodeForTokens(code: string): Promise<any> {
  try {
    const clientSecret = decodeBase64ClientSecret();
    if (!clientSecret) {
      throw new Error("Client secret not available");
    }

    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: OAUTH_CONFIG.redirectUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    console.error("Token exchange failed:", error);
    return null;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<any> {
  try {
    const clientSecret = decodeBase64ClientSecret();
    if (!clientSecret) {
      throw new Error("Client secret not available");
    }

    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

async function getUserProfile(accessToken: string): Promise<any> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.status}`);
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error("Profile fetch failed:", error);
    return null;
  }
}

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
  } else if (request.action === "openJobUrl") {
    // Open job URL in new tab
    if (request.url) {
      chrome.tabs.create({ url: request.url });
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
  } else if (request.action === "oauthLogin") {
    // Handle OAuth login request
    (async () => {
      try {
        console.log("Starting OAuth login flow");
        const code = await initiateOAuthFlow();
        if (!code) {
          sendResponse({ success: false, error: "OAuth flow failed" });
          return;
        }

        const tokenData = await exchangeCodeForTokens(code);
        if (!tokenData) {
          sendResponse({ success: false, error: "Token exchange failed" });
          return;
        }

        const profile = await getUserProfile(tokenData.access_token);
        if (!profile) {
          sendResponse({ success: false, error: "Profile fetch failed" });
          return;
        }

        // Store OAuth tokens and profile
        await chrome.storage.sync.set({
          oauthTokens: tokenData,
          oauthProfile: profile,
          lastAuthTime: Date.now(),
        });

        console.log("OAuth login successful for user:", profile.email);
        sendResponse({
          success: true,
          profile: profile,
          tokens: tokenData
        });
      } catch (error) {
        console.error("OAuth login failed:", error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    })();
    return true; // Keep message channel open for async response
  } else if (request.action === "oauthLogout") {
    // Handle OAuth logout
    chrome.storage.sync.remove(["oauthTokens", "oauthProfile", "lastAuthTime"], () => {
      console.log("OAuth logout completed");
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "getOAuthProfile") {
    // Get stored OAuth profile
    chrome.storage.sync.get(["oauthProfile", "oauthTokens"], (result) => {
      if (result.oauthTokens && result.oauthProfile) {
        // Check if token is still valid
        const now = Date.now();
        const expiresAt = result.oauthTokens.expires_at || (result.lastAuthTime + (result.oauthTokens.expires_in * 1000));
        if (now < expiresAt) {
          sendResponse({
            success: true,
            profile: result.oauthProfile,
            tokens: result.oauthTokens
          });
        } else {
          // Token expired, try to refresh
          (async () => {
            try {
              const refreshToken = result.oauthTokens.refresh_token;
              if (refreshToken) {
                const newTokens = await refreshAccessToken(refreshToken);
                if (newTokens) {
                  // Update stored tokens
                  await chrome.storage.sync.set({
                    oauthTokens: { ...result.oauthTokens, ...newTokens },
                    lastAuthTime: Date.now(),
                  });
                  sendResponse({
                    success: true,
                    profile: result.oauthProfile,
                    tokens: { ...result.oauthTokens, ...newTokens }
                  });
                } else {
                  sendResponse({ success: false, error: "Token refresh failed" });
                }
              } else {
                sendResponse({ success: false, error: "No refresh token available" });
              }
            } catch (error) {
              sendResponse({ success: false, error: "Token refresh error" });
            }
          })();
          return true;
        }
      } else {
        sendResponse({ success: false, error: "Not authenticated" });
      }
    });
    return true;
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
