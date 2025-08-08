/// <reference types="chrome" />

// Content script for the web app to handle authentication communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getUserId") {
    // Try to get user ID from various sources
    let userId = null;

    // Method 1: Check if there's a Clerk user object in the global scope
    if ((window as any).__clerk_user) {
      userId = (window as any).__clerk_user.id;
    }

    // Method 2: Check localStorage for Clerk session
    if (!userId) {
      try {
        const clerkSession = localStorage.getItem("__clerk_session");
        if (clerkSession) {
          const sessionData = JSON.parse(clerkSession);
          userId = sessionData?.user?.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Method 3: Check for user data in localStorage
    if (!userId) {
      try {
        const userData =
          localStorage.getItem("user") || localStorage.getItem("userId");
        if (userData) {
          userId =
            typeof userData === "string" ? userData : JSON.parse(userData).id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Method 4: Try to extract from DOM if user info is displayed
    if (!userId) {
      const userElements = document.querySelectorAll(
        "[data-user-id], [data-clerk-user-id]",
      );
      if (userElements.length > 0) {
        userId =
          userElements[0].getAttribute("data-user-id") ||
          userElements[0].getAttribute("data-clerk-user-id");
      }
    }

    // Method 5: Check if we can access Clerk from window
    if (!userId && (window as any).Clerk) {
      try {
        const clerk = (window as any).Clerk;
        if (clerk.user) {
          userId = clerk.user.id;
        }
      } catch (e) {
        // Ignore errors
      }
    }

    sendResponse({ userId });
    return true; // Keep the message channel open for async response
  }

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
          .catch(() => {
            // Ignore errors if extension context is invalid
          });
      }, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// After existing listener for onMessage, add auto-detection

// --- Auto-detect Clerk user and notify background ---
function trySendUserId() {
  let userId: string | null = null;
  const w: any = window;
  if (w.Clerk && w.Clerk.user) {
    userId = w.Clerk.user.id;
  } else if (w.__clerk_user) {
    userId = w.__clerk_user.id;
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
