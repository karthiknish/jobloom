/// <reference types="chrome" />

document.addEventListener("DOMContentLoaded", () => {
  const highlightBtn = document.getElementById("highlight-btn");
  const autofillBtn = document.getElementById("autofill-btn");
  const peopleSearchBtn = document.getElementById("people-search-btn");
  const clearBtn = document.getElementById("clear-btn");
  const openBoardBtn = document.getElementById("open-board-btn");
  const settingsLink = document.getElementById("settings-link");
  const signinBtn = document.getElementById("signin-btn");
  const signupBtn = document.getElementById("signup-btn");
  const signoutBtn = document.getElementById("signout-btn");
  const clerkComponents = document.getElementById("clerk-components");
  const backToMainBtn = document.getElementById("back-to-main");
  const authActions = document.querySelector(".auth-actions");

  loadStats();
  loadSettings();

  // Check authentication status
  chrome.storage.sync.get(["convexUserId"], (res) => {
    if (!res.convexUserId) {
      // Hide feature buttons and stats
      const stats = document.querySelector(".stats") as HTMLElement | null;
      const actions = document.querySelector(".actions") as HTMLElement | null;
      if (stats) stats.style.display = "none";
      if (actions) actions.style.display = "none";

      // ensure sign-in/up visible, hide sign-out
      (signinBtn as HTMLElement | null)?.style.removeProperty("display");
      (signupBtn as HTMLElement | null)?.style.removeProperty("display");
      if (signoutBtn) (signoutBtn as HTMLElement).style.display = "none";

      // Show prompt message
      const prompt = document.createElement("div");
      prompt.style.cssText =
        "background: #e0f2fe; color: #0369a1; padding: 12px; border-radius: 6px; text-align: center; margin-bottom: 12px; font-size: 13px;";
      prompt.textContent = "Please sign up / sign in to use Jobloom features";
      const popupContent = document.querySelector(".popup-content");
      popupContent?.insertBefore(
        prompt,
        popupContent.firstChild?.nextSibling || null
      );
    } else {
      // User is authenticated: hide sign-in/up, show sign-out
      (signinBtn as HTMLElement | null)?.style.setProperty("display", "none");
      (signupBtn as HTMLElement | null)?.style.setProperty("display", "none");
      if (signoutBtn)
        (signoutBtn as HTMLElement).style.removeProperty("display");
    }
  });

  highlightBtn?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // The content script handles the highlighting now
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleHighlight" });
        window.close(); // Close popup after triggering
      }
    });
  });

  autofillBtn?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.storage.sync.get(["autofillProfile"], (result) => {
          if (!result.autofillProfile) {
            // Show message to configure profile first
            const btn = autofillBtn as HTMLButtonElement;
            const originalText = btn.textContent;
            btn.textContent = "⚠️ Setup Profile First";
            btn.style.background = "#f59e0b";
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = "#059669";
            }, 3000);
            return;
          }

          chrome.tabs.sendMessage(tabs[0].id!, { action: "triggerAutofill" });
          window.close();
        });
      }
    });
  });

  peopleSearchBtn?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // Check if we're on LinkedIn Jobs page
        if (tabs[0].url?.includes("linkedin.com/jobs")) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "togglePeopleSearch" });
          window.close(); // Close popup after triggering
        } else {
          // Show message to navigate to LinkedIn
          const btn = peopleSearchBtn as HTMLButtonElement;
          const originalText = btn.textContent;
          btn.textContent = "⚠️ Open a LinkedIn Job Page";
          btn.style.background = "#f59e0b";
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "#0a66c2";
          }, 2000);
        }
      }
    });
  });

  clearBtn?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "clearHighlights" });
        window.close(); // Close popup after clearing
      }
    });
  });

  openBoardBtn?.addEventListener("click", () => {
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const url = result.webAppUrl || "http://localhost:3000";
      chrome.tabs.create({ url });
    });
  });

  settingsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    showSettings();
  });

  // --- Authentication via Clerk hosted pages (no components) ---
  function openAuthPage(mode: "sign-in" | "sign-up") {
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const appBase = (
        result.webAppUrl ||
        process.env.WEB_APP_URL ||
        "http://localhost:3000"
      ).replace(/\/$/, "");
      const afterPath = (
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard"
      ).replace(/\/$/, "");
      const redirect = encodeURIComponent(`${appBase}${afterPath}`);

      const envUrl =
        (mode === "sign-in"
          ? process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL
          : process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL) || "";

      if (/^https?:\/\//i.test(envUrl)) {
        const url = `${envUrl}${envUrl.includes("?") ? "&" : "?"}redirect_url=${redirect}`;
        chrome.tabs.create({ url });
        window.close();
        return;
      }

      const fallbackPath = mode === "sign-in" ? "/sign-in" : "/sign-up";
      const url = `${appBase}${fallbackPath}?redirect_url=${redirect}`;
      chrome.tabs.create({ url });
      window.close();
    });
  }

  signinBtn?.addEventListener("click", () => openAuthPage("sign-in"));
  signupBtn?.addEventListener("click", () => openAuthPage("sign-up"));

  backToMainBtn?.addEventListener("click", () => {
    // In API-based flow, just reload the popup to return to main UI
    window.location.reload();
  });

  // Sign out logic
  signoutBtn?.addEventListener("click", () => {
    signOut();
  });

  // Clerk UI removed - we now open web app pages to authenticate.

  async function signOut() {
    chrome.storage.sync.remove(["convexUserId"], () => {
      // Attempt to clear any web-app session artifacts (optional)
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (
            tab.url &&
            (tab.url.includes("localhost") || tab.url.includes("jobloom"))
          ) {
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id! },
                func: () => {
                  localStorage.removeItem("__clerk_user");
                  localStorage.removeItem("__clerk_session");
                },
              })
              .catch(() => {
                // Ignore errors
              });
          }
        });
      });

      // Reload the popup; UI will revert to signed-out state
      window.location.reload();
    });
  }

  function ensureUserExists(clerkId: string) {
    chrome.storage.sync.get(["convexUrl"], async (result) => {
      const convexUrl =
        result.convexUrl ||
        process.env.CONVEX_URL ||
        "https://rare-chihuahua-615.convex.cloud";

      if (!convexUrl || convexUrl.includes("your-convex")) return;

      try {
        // Check if user exists
        const queryResp = await fetch(`${convexUrl}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "users:getUserByClerkId",
            args: { clerkId },
          }),
        });

        if (!queryResp.ok) return;
        const existing = await queryResp.json();
        if (existing) return; // user already present

        // Create minimal user
        await fetch(`${convexUrl}/api/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "users:createUser",
            args: { email: "", name: "", clerkId },
          }),
        });
        console.log("Created user on Convex backend");
      } catch (e) {
        console.error("Error ensuring user exists", e);
      }
    });
  }
});

function showAuthSuccessMessage() {
  const popup = document.querySelector(".popup-content");
  if (!popup) return;

  popup.innerHTML = `
    <div class="header">
      <div class="logo">✅</div>
      <h1 class="title">Authentication Complete!</h1>
      <p class="subtitle">Please click the button below to refresh and access features</p>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="refresh-btn">
        🔄 Refresh Extension
      </button>
      <button class="btn btn-secondary" id="manual-setup-btn">
        ⚙️ Manual Setup
      </button>
    </div>
  `;

  document.getElementById("refresh-btn")?.addEventListener("click", () => {
    window.location.reload();
  });

  document.getElementById("manual-setup-btn")?.addEventListener("click", () => {
    showManualSetup();
  });
}

function showManualSetup() {
  const popup = document.querySelector(".popup-content");
  if (!popup) return;

  popup.innerHTML = `
    <div class="header">
      <div class="logo">⚙️</div>
      <h1 class="title">Manual Setup</h1>
      <p class="subtitle">Enter your user ID manually</p>
    </div>
    <div style="padding: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">User ID:</label>
      <input type="text" id="manual-user-id" placeholder="Enter your user ID" 
             style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 12px;">
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
        You can find your user ID in your account settings on the web app.
      </p>
      <button class="btn btn-primary" id="save-user-id" style="width: 100%; margin-bottom: 8px;">
        Save User ID
      </button>
      <button class="btn btn-secondary" id="back-to-auth" style="width: 100%;">
        ← Back to Authentication
      </button>
    </div>
  `;

  document.getElementById("save-user-id")?.addEventListener("click", () => {
    const userIdInput = document.getElementById(
      "manual-user-id",
    ) as HTMLInputElement;
    const userId = userIdInput.value.trim();

    if (userId) {
      chrome.storage.sync.set({ userId }, () => {
        window.location.reload();
      });
    } else {
      userIdInput.style.borderColor = "#ef4444";
      userIdInput.placeholder = "Please enter a valid user ID";
    }
  });

  document.getElementById("back-to-auth")?.addEventListener("click", () => {
    window.location.reload();
  });
}

function showSettings() {
  const popup = document.querySelector(".popup-content");
  if (!popup) return;

  popup.innerHTML = `
    <div class="header">
      <div class="logo">⚙️</div>
      <h1 class="title">Settings</h1>
      <button id="back-btn" class="btn btn-secondary" style="position: absolute; top: 10px; left: 10px; padding: 4px 8px;">← Back</button>
    </div>

    <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Convex URL:</label>
        <input type="text" id="convex-url" placeholder="https://your-deployment.convex.cloud" 
               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Web App URL:</label>
        <input type="text" id="web-app-url" placeholder="http://localhost:3000" 
               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
      </div>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">📝 Autofill Profile</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">First Name:</label>
        <input type="text" id="first-name" placeholder="John" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Last Name:</label>
        <input type="text" id="last-name" placeholder="Doe" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Email:</label>
        <input type="email" id="email" placeholder="john.doe@email.com" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Phone:</label>
        <input type="tel" id="phone" placeholder="+1 (555) 123-4567" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Current Job Title:</label>
        <input type="text" id="current-title" placeholder="Software Engineer" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Years of Experience:</label>
        <input type="text" id="experience" placeholder="5 years" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">LinkedIn URL:</label>
        <input type="url" id="linkedin-url" placeholder="https://linkedin.com/in/johndoe" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Salary Expectation:</label>
        <input type="text" id="salary-expectation" placeholder="$80,000 - $100,000" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Work Authorization:</label>
        <select id="work-authorization" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
          <option value="">Select...</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Green Card Holder">Green Card Holder</option>
          <option value="H1B Visa">H1B Visa</option>
          <option value="F1 Visa (OPT)">F1 Visa (OPT)</option>
          <option value="Requires Sponsorship">Requires Sponsorship</option>
        </select>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Cover Letter Template:</label>
        <textarea id="cover-letter" placeholder="Dear Hiring Manager, I am excited to apply for this position..." 
                  style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; height: 80px; resize: vertical;"></textarea>
      </div>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">👥 People Search Settings</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Default Keywords:</label>
        <input type="text" id="default-keywords" placeholder="software engineer, product manager" 
               style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Preferred Connection Level:</label>
        <select id="default-connection-level" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
          <option value="all">All connections</option>
          <option value="1st">1st connections</option>
          <option value="2nd">2nd connections</option>
          <option value="3rd">3rd+ connections</option>
        </select>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Auto-Connect Limit:</label>
        <select id="auto-connect-limit" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
          <option value="3">3 connections per session</option>
          <option value="5">5 connections per session</option>
          <option value="10">10 connections per session</option>
          <option value="20">20 connections per session</option>
        </select>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; font-size: 12px;">
          <input type="checkbox" id="auto-message" style="margin-right: 8px;">
          Send personalized connection message
        </label>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px;">Connection Message Template:</label>
        <textarea id="connection-message" placeholder="Hi {name}, I'd love to connect and learn more about your experience at {company}." 
                  style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; height: 60px; resize: vertical;"></textarea>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Use {name} and {company} for personalization</div>
      </div>

      <button id="save-settings" class="btn btn-primary" style="width: 100%;">Save Settings</button>
    </div>
  `;

  // Load current settings
  const DEFAULT_CONVEX_URL = process.env.CONVEX_URL;

  chrome.storage.sync.get(
    [
      "convexUrl",
      "webAppUrl",
      "defaultKeywords",
      "defaultConnectionLevel",
      "autoConnectLimit",
      "autoMessage",
      "connectionMessage",
      "autofillProfile",
    ],
    (result) => {
      const convexUrlInput = document.getElementById(
        "convex-url",
      ) as HTMLInputElement;
      const webAppUrlInput = document.getElementById(
        "web-app-url",
      ) as HTMLInputElement;
      const defaultKeywordsInput = document.getElementById(
        "default-keywords",
      ) as HTMLInputElement;
      const defaultConnectionLevelSelect = document.getElementById(
        "default-connection-level",
      ) as HTMLSelectElement;
      const autoConnectLimitSelect = document.getElementById(
        "auto-connect-limit",
      ) as HTMLSelectElement;
      const autoMessageCheckbox = document.getElementById(
        "auto-message",
      ) as HTMLInputElement;
      const connectionMessageTextarea = document.getElementById(
        "connection-message",
      ) as HTMLTextAreaElement;

      // Autofill profile fields
      const firstNameInput = document.getElementById(
        "first-name",
      ) as HTMLInputElement;
      const lastNameInput = document.getElementById(
        "last-name",
      ) as HTMLInputElement;
      const emailInput = document.getElementById("email") as HTMLInputElement;
      const phoneInput = document.getElementById("phone") as HTMLInputElement;
      const currentTitleInput = document.getElementById(
        "current-title",
      ) as HTMLInputElement;
      const experienceInput = document.getElementById(
        "experience",
      ) as HTMLInputElement;
      const linkedinUrlInput = document.getElementById(
        "linkedin-url",
      ) as HTMLInputElement;
      const salaryExpectationInput = document.getElementById(
        "salary-expectation",
      ) as HTMLInputElement;
      const workAuthorizationSelect = document.getElementById(
        "work-authorization",
      ) as HTMLSelectElement;
      const coverLetterTextarea = document.getElementById(
        "cover-letter",
      ) as HTMLTextAreaElement;

      if (convexUrlInput) convexUrlInput.value = result.convexUrl || DEFAULT_CONVEX_URL;
      if (webAppUrlInput)
        webAppUrlInput.value = result.webAppUrl || "http://localhost:3000";
      if (defaultKeywordsInput)
        defaultKeywordsInput.value = result.defaultKeywords || "";
      if (defaultConnectionLevelSelect)
        defaultConnectionLevelSelect.value =
          result.defaultConnectionLevel || "all";
      if (autoConnectLimitSelect)
        autoConnectLimitSelect.value = result.autoConnectLimit || "5";
      if (autoMessageCheckbox)
        autoMessageCheckbox.checked = result.autoMessage || false;
      if (connectionMessageTextarea)
        connectionMessageTextarea.value =
          result.connectionMessage ||
          "Hi {name}, I'd love to connect and learn more about your experience at {company}.";

      // Load autofill profile
      const profile = result.autofillProfile;
      if (profile) {
        if (firstNameInput)
          firstNameInput.value = profile.personalInfo?.firstName || "";
        if (lastNameInput)
          lastNameInput.value = profile.personalInfo?.lastName || "";
        if (emailInput) emailInput.value = profile.personalInfo?.email || "";
        if (phoneInput) phoneInput.value = profile.personalInfo?.phone || "";
        if (currentTitleInput)
          currentTitleInput.value = profile.professional?.currentTitle || "";
        if (experienceInput)
          experienceInput.value = profile.professional?.experience || "";
        if (linkedinUrlInput)
          linkedinUrlInput.value = profile.professional?.linkedinUrl || "";
        if (salaryExpectationInput)
          salaryExpectationInput.value =
            profile.preferences?.salaryExpectation || "";
        if (workAuthorizationSelect)
          workAuthorizationSelect.value =
            profile.preferences?.workAuthorization || "";
        if (coverLetterTextarea)
          coverLetterTextarea.value = profile.preferences?.coverLetter || "";
      }
    },
  );

  // Add event listeners
  document.getElementById("back-btn")?.addEventListener("click", () => {
    location.reload();
  });

  document.getElementById("save-settings")?.addEventListener("click", () => {
    const convexUrl = (
      document.getElementById("convex-url") as HTMLInputElement
    ).value;
    const webAppUrl = (
      document.getElementById("web-app-url") as HTMLInputElement
    ).value;
    const defaultKeywords = (
      document.getElementById("default-keywords") as HTMLInputElement
    ).value;
    const defaultConnectionLevel = (
      document.getElementById("default-connection-level") as HTMLSelectElement
    ).value;
    const autoConnectLimit = (
      document.getElementById("auto-connect-limit") as HTMLSelectElement
    ).value;
    const autoMessage = (
      document.getElementById("auto-message") as HTMLInputElement
    ).checked;
    const connectionMessage = (
      document.getElementById("connection-message") as HTMLTextAreaElement
    ).value;

    // Collect autofill profile data
    const autofillProfile = {
      personalInfo: {
        firstName: (document.getElementById("first-name") as HTMLInputElement)
          .value,
        lastName: (document.getElementById("last-name") as HTMLInputElement)
          .value,
        email: (document.getElementById("email") as HTMLInputElement).value,
        phone: (document.getElementById("phone") as HTMLInputElement).value,
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      professional: {
        currentTitle: (
          document.getElementById("current-title") as HTMLInputElement
        ).value,
        experience: (document.getElementById("experience") as HTMLInputElement)
          .value,
        education: "",
        skills: "",
        linkedinUrl: (
          document.getElementById("linkedin-url") as HTMLInputElement
        ).value,
        portfolioUrl: "",
        githubUrl: "",
      },
      preferences: {
        salaryExpectation: (
          document.getElementById("salary-expectation") as HTMLInputElement
        ).value,
        availableStartDate: "",
        workAuthorization: (
          document.getElementById("work-authorization") as HTMLSelectElement
        ).value,
        relocate: false,
        coverLetter: (
          document.getElementById("cover-letter") as HTMLTextAreaElement
        ).value,
      },
    };

    chrome.storage.sync.set(
      {
        convexUrl,
        webAppUrl,
        defaultKeywords,
        defaultConnectionLevel,
        autoConnectLimit,
        autoMessage,
        connectionMessage,
        autofillProfile,
      },
      () => {
        // Show success message
        const saveBtn = document.getElementById("save-settings");
        if (saveBtn) {
          saveBtn.textContent = "✓ Saved!";
          saveBtn.style.background = "#10b981";
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      },
    );
  });
}

function loadStats() {
  chrome.storage.local.get(
    ["jobsToday", "sponsoredJobs", "applications", "jobBoardData"],
    (result) => {
      document.getElementById("jobs-today")!.textContent =
        result.jobsToday || "0";
      document.getElementById("sponsored-jobs")!.textContent =
        result.sponsoredJobs || "0";

      // Update job board count
      const jobBoardData = result.jobBoardData || [];
      document.getElementById("applications")!.textContent =
        jobBoardData.length.toString();
    },
  );
}

function loadSettings() {
  const DEFAULT_CONVEX_URL = process.env.CONVEX_URL;
  chrome.storage.sync.get(["convexUrl"], (result) => {
    if (!result.convexUrl) {
      // Persist the default so future loads skip this step
      chrome.storage.sync.set({ convexUrl: DEFAULT_CONVEX_URL });
    }

    const url = result.convexUrl || DEFAULT_CONVEX_URL;

    // Only warn if still placeholder string from template
    if (url === "https://your-convex-deployment.convex.cloud") {
      const warningDiv = document.createElement("div");
      warningDiv.style.cssText = `
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
        padding: 8px;
        border-radius: 4px;
        margin: 10px;
        font-size: 12px;
        text-align: center;
      `;
      warningDiv.textContent = "⚠️ Please configure Convex URL in settings";
      document.body.insertBefore(warningDiv, document.body.firstChild);
    }
  });
}
