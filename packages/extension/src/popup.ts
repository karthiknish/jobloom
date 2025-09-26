/// <reference types="chrome" />
import { DEFAULT_WEB_APP_URL } from "./constants";

// Helper function to create SVG strings from Lucide icons
function createSVGString(iconName: string, size: number = 16): string {
  const svgIcons: Record<string, string> = {
    checkCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    alertTriangle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    xCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    bell: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    clipboardPlus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="m4 16c-1.1 0-2-.9-2-2v-10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path><line x1="12" y1="12" x2="12" y2="16"></line><line x1="10" y1="14" x2="14" y2="14"></line></svg>`,
    target: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    home: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    fileText: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  };
  
  return svgIcons[iconName] || "";
}

// Toast helper (top-level so all functions can use it)
function showToast(
  message: string,
  opts: { type?: "success" | "info" | "warning" | "error"; duration?: number } = {}
) {
  const { type = "info", duration = 2500 } = opts;
  const root = document.getElementById("toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icon =
    type === "success" ? createSVGString("checkCircle") : type === "warning" ? createSVGString("alertTriangle") : type === "error" ? createSVGString("xCircle") : createSVGString("bell");
  el.innerHTML = `
    <span class="icon">${icon}</span>
    <div class="message">${message}</div>
    <button class="close" aria-label="Close">×</button>
  `;
  const remove = () => {
    el.style.animation = "toast-out 150ms ease-in forwards";
    setTimeout(() => el.remove(), 160);
  };
  el.querySelector(".close")?.addEventListener("click", remove);
  root.appendChild(el);
  setTimeout(remove, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  // Tab navigation
  const navTabs = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  // Main action buttons
  const highlightBtn = document.getElementById("highlight-btn");
  const autofillBtn = document.getElementById("autofill-btn");
  const peopleSearchBtn = document.getElementById("people-search-btn");
  const openBoardBtn = document.getElementById("open-board-btn");

  // Settings controls
  const configureProfileBtn = document.getElementById("configure-profile-btn");
  const autoDetectToggle = document.getElementById("auto-detect-toggle");
  const showBadgesToggle = document.getElementById("show-badges-toggle");
  const autoSaveProfileToggle = document.getElementById(
    "auto-save-profile-toggle"
  );
  const webAppUrlInput = document.getElementById(
    "web-app-url"
  ) as HTMLInputElement;
  const syncFrequencySelect = document.getElementById(
    "sync-frequency"
  ) as HTMLSelectElement;

  // Auth buttons
  const signinBtn = document.getElementById("signin-btn");
  const signupBtn = document.getElementById("signup-btn");
  const signoutBtn = document.getElementById("signout-btn");

  // Job management
  const jobFilters = document.querySelectorAll(".filter-btn");

  // Initialize
  loadStats();
  loadSettings();
  setupTabNavigation();
  setupJobFilters();
  setupSettingsControls();

  // Check authentication status (throttled to prevent flickering)
  let authCheckInProgress = false;
  let lastAuthState: string | null = null;
  const throttledCheckAuth = () => {
    if (authCheckInProgress) return;
    authCheckInProgress = true;
    checkAuthStatus().finally(() => {
      authCheckInProgress = false;
    });
  };
  throttledCheckAuth();

  async function checkAuthStatus() {
    const authStatus = document.getElementById("auth-status")!;
    const statusDot = authStatus.querySelector(".status-dot")!;
    const statusText = authStatus.querySelector(".status-text")!;

    // Check Firebase authentication
    const res = await chrome.storage.sync.get(["firebaseUid", "userId"]);

    const firebaseUid = res.firebaseUid || res.userId;
    const currentAuthState = firebaseUid ? "authenticated" : "unauthenticated";

    // Prevent unnecessary DOM updates if state hasn't changed
    if (lastAuthState === currentAuthState) {
      return;
    }
    lastAuthState = currentAuthState;

    if (!firebaseUid) {
      // User not authenticated
      authStatus.className = "auth-status unauthenticated";
      (statusDot as HTMLElement).style.background = "#f59e0b";
      statusText.textContent = "Not signed in";

      // Only update tabs if they're not already hidden/shown correctly
      const mainTabs = document.querySelectorAll(
        '.nav-tab[data-tab="dashboard"], .nav-tab[data-tab="jobs"], .nav-tab[data-tab="settings"]'
      );
      let needsUpdate = false;
      mainTabs.forEach((tab) => {
        if ((tab as HTMLElement).style.display !== "none") {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        mainTabs.forEach((tab) => {
          (tab as HTMLElement).style.display = "none";
        });
        const authTab = document.querySelector(
          '.nav-tab[data-tab="auth"]'
        ) as HTMLElement;
        if (authTab) {
          authTab.style.display = "flex";
          // Only switch to auth tab if not already active
          if (!authTab.classList.contains("active")) {
            authTab.click();
          }
        }
      }
    } else {
      // User authenticated with Firebase
      authStatus.className = "auth-status authenticated";
      (statusDot as HTMLElement).style.background = "#10b981";
      statusText.textContent = "Firebase: Signed in";

      // Only update tabs if they're not already shown
      const allTabs = document.querySelectorAll(".nav-tab");
      let needsUpdate = false;
      allTabs.forEach((tab) => {
        if ((tab as HTMLElement).style.display !== "flex") {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        allTabs.forEach((tab) => {
          (tab as HTMLElement).style.display = "flex";
        });
        // Load jobs for the jobs tab
        loadJobs();
      }
    }
  }

  // Tab navigation setup
  function setupTabNavigation() {
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabContents = document.querySelectorAll(".tab-content");

    navTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = (tab as HTMLElement).dataset.tab;

        // Remove active class from all tabs
        navTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Hide all tab contents
        tabContents.forEach((content) => content.classList.remove("active"));

        // Show target tab content
        const targetContent = document.getElementById(`${targetTab}-content`);
        if (targetContent) {
          targetContent.classList.add("active");
        }
      });
    });
  }

  // Job filters setup
  function setupJobFilters() {
    const jobFilters = document.querySelectorAll(".filter-btn");

    jobFilters.forEach((filter) => {
      filter.addEventListener("click", () => {
        // Remove active class from all filters
        jobFilters.forEach((f) => f.classList.remove("active"));
        filter.classList.add("active");

        const filterType = (filter as HTMLElement).dataset.filter;
        filterJobs(filterType);
      });
    });
  }

  // Settings controls setup
  function setupSettingsControls() {
    // Toggle switches
    document.querySelectorAll(".toggle-switch").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        saveSettings();
      });
    });

    // Input changes
    const webAppUrlInput = document.getElementById(
      "web-app-url"
    ) as HTMLInputElement;
    const syncFrequencySelect = document.getElementById(
      "sync-frequency"
    ) as HTMLSelectElement;

    webAppUrlInput?.addEventListener("change", saveSettings);
    syncFrequencySelect?.addEventListener("change", saveSettings);

    // Configure profile button
    const configureProfileBtn = document.getElementById(
      "configure-profile-btn"
    );
    configureProfileBtn?.addEventListener("click", () => {
      // Open web app settings page
      chrome.storage.sync.get(["webAppUrl"], (result) => {
        const url = result.webAppUrl || DEFAULT_WEB_APP_URL;
        chrome.tabs.create({ url: `${url}/account` });
      });
    });
  }

  // Filter jobs based on status
  function filterJobs(filterType?: string) {
    const jobItems = document.querySelectorAll(".job-item");

    jobItems.forEach((item) => {
      const jobStatus = (item as HTMLElement).dataset.status;
      const jobSponsored = (item as HTMLElement).dataset.sponsored === "true";

      let show = true;

      switch (filterType) {
        case "interested":
          show = jobStatus === "interested";
          break;
        case "applied":
          show = jobStatus === "applied";
          break;
        case "interviewing":
          show = jobStatus === "interviewing";
          break;
        case "sponsored":
          show = jobSponsored;
          break;
        case "all":
        default:
          show = true;
          break;
      }

      (item as HTMLElement).style.display = show ? "block" : "none";
    });
  }

  // Load jobs from storage
  // Load jobs from JobBoardManager (enhanced dashboard integration)
  async function loadJobs() {
    const jobList = document.getElementById("job-list")!;
    const jobCount = document.getElementById("jobs-count")!;

    try {
      // Show loading state
      jobList.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span>Loading jobs...</span>
        </div>
      `;

      // Import JobBoardManager and get all jobs
      const { JobBoardManager } = await import("./addToBoard");
      const jobs = await JobBoardManager.getAllJobs();

      jobCount.textContent = `${jobs.length} jobs`;

      if (jobs.length === 0) {
        jobList.innerHTML = `
          <div style="text-align: center; color: var(--muted); padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${createSVGString("clipboardPlus", 48)}</div>
            <h3 style="margin: 0 0 8px 0; color: #374151;">No jobs tracked yet</h3>
            <p style="margin: 0; font-size: 14px;">Jobs you add to your board will appear here</p>
            <button class="action-btn" style="margin-top: 16px; padding: 8px 16px; font-size: 12px;" onclick="switchToDashboard()">
              <div class="action-icon primary">${createSVGString("target", 20)}</div>
              <div class="action-content">
                <h3 style="font-size: 14px; margin: 0;">Find Jobs Now</h3>
                <p style="font-size: 12px; margin: 4px 0 0 0;">Browse job sites to get started</p>
              </div>
            </button>
          </div>
        `;
        return;
      }

      // Get current filter
      const activeFilter =
        document
          .querySelector(".filter-btn.active")
          ?.getAttribute("data-filter") || "all";

      // Filter jobs
      let filteredJobs = jobs;
      if (activeFilter !== "all") {
        if (activeFilter === "sponsored") {
          filteredJobs = jobs.filter((job) => job.sponsorshipInfo?.isSponsored);
        } else {
          filteredJobs = jobs.filter((job) => job.status === activeFilter);
        }
      }

      // Sort jobs by date (newest first)
      filteredJobs.sort(
        (a, b) =>
          new Date(b.lastUpdated || b.dateAdded).getTime() -
          new Date(a.lastUpdated || a.dateAdded).getTime()
      );

      jobList.innerHTML = filteredJobs
        .map((job) => {
          const statusColors: Record<string, string> = {
            interested: "#6b7280",
            applied: "#3b82f6",
            interviewing: "#f59e0b",
            offered: "#10b981",
            rejected: "#ef4444",
            withdrawn: "#8b5cf6",
          };

          const statusColor = statusColors[job.status] || "#6b7280";

          return `
          <div class="job-item" data-status="${job.status}" data-sponsored="${
            job.sponsorshipInfo?.isSponsored || false
          }" data-job-id="${job.id}">
            <div class="job-item-header">
              <div style="flex: 1;">
                <h4 class="job-title">${job.title}</h4>
                <div class="job-company">${job.company}</div>
                <div class="job-meta">${job.location} • ${new Date(
            job.dateAdded
          ).toLocaleDateString()}</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                ${
                  job.lastUpdated && job.lastUpdated !== job.dateAdded
                    ? `<div style="font-size: 10px; color: var(--muted);">Updated ${new Date(
                        job.lastUpdated
                      ).toLocaleDateString()}</div>`
                    : ""
                }
                ${
                  job.status !== "interested"
                    ? `<div style="font-size: 10px; color: ${statusColor}; font-weight: 600;">${job.status.toUpperCase()}</div>`
                    : ""
                }
              </div>
            </div>

            <div class="job-badges">
              <span class="job-badge" style="background: rgba(${statusColor
                .replace("#", "")
                .match(/.{2}/g)
                ?.map((x) => parseInt(x, 16))
                .join(", ")}, 0.1); color: ${statusColor};">
                ${
                  job.status === "interested" ? "⭐" : getStatusIcon(job.status)
                } ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              ${
                job.sponsorshipInfo?.isSponsored
                  ? `<span class="job-badge badge-sponsored">${createSVGString("target", 12)} ${
                      job.sponsorshipInfo.sponsorshipType || "Sponsored"
                    }</span>`
                  : ""
              }
              ${
                job.salary
                  ? `<span class="job-badge badge-salary">$ ${job.salary}</span>`
                  : ""
              }
              ${
                job.remoteWork
                  ? `<span class="job-badge badge-remote">${createSVGString("home", 12)} Remote</span>`
                  : ""
              }
            </div>

            ${
              job.notes
                ? `
              <div style="margin: 8px 0; padding: 8px 12px; background: #f9fafb; border-radius: 6px; font-size: 12px; color: #374151;">
                <strong>Notes:</strong> ${job.notes}
              </div>
            `
                : ""
            }

            <div class="job-actions">
              <div class="sponsor-status" id="sponsor-status-${job.id}" style="display: none;">Checking...</div>
              <button class="job-action-btn" onclick="checkJobSponsor('${job.id}', '${job.company.replace(/'/g, "\\'")}')" id="sponsor-btn-${job.id}">
                🇬🇧 Check Sponsor
              </button>
              ${
                job.status !== "interested"
                  ? `<button class="job-action-btn" onclick="changeJobStatus('${job.id}', 'interested')">Mark Interested</button>`
                  : ""
              }
              ${
                job.status !== "applied"
                  ? `<button class="job-action-btn primary" onclick="changeJobStatus('${job.id}', 'applied')">Mark Applied</button>`
                  : ""
              }
              ${
                job.status !== "interviewing"
                  ? `<button class="job-action-btn" onclick="changeJobStatus('${job.id}', 'interviewing')">Interviewing</button>`
                  : ""
              }
              <button class="job-action-btn" onclick="openJobUrl('${
                job.url
              }')">View Job</button>
            </div>
          </div>
        `;
        })
        .join("");

      // Update job count display
      const activeFilterBtn = document.querySelector(".filter-btn.active");
      if (activeFilterBtn) {
        const filterText = activeFilterBtn.textContent;
        jobCount.textContent = `${filteredJobs.length} ${
          filterText?.toLowerCase() || "jobs"
        }`;
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      jobList.innerHTML = `
        <div style="text-align: center; color: var(--error); padding: 20px;">
          <div style="font-size: 32px; margin-bottom: 8px;">${createSVGString("xCircle", 32)}</div>
          <p>Failed to load jobs. Please try again.</p>
        </div>
      `;
    }
  }

  // Helper function for status icons
  function getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      applied: createSVGString("fileText", 12),
      interviewing: createSVGString("target", 12),
      offered: "⭐",
      rejected: createSVGString("xCircle", 12),
      withdrawn: "❌",
    };
    return icons[status] || createSVGString("clipboardPlus", 12);
  }

  // Enhanced job status update function
  async function changeJobStatus(jobId: string, newStatus: string) {
    try {
      const { JobBoardManager } = await import("./addToBoard");
      const result = await JobBoardManager.updateJobStatus(
        jobId,
        newStatus as any
      );

      if (result.success) {
        showToast(`Job status updated to ${newStatus}`, { type: "success" });
        // Reload jobs to reflect changes
        setTimeout(() => loadJobs(), 500);
      } else {
        showToast(result.message, { type: "error" });
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      showToast("Failed to update job status", { type: "error" });
    }
  }

  // Open job URL function
  function openJobUrl(url: string) {
    if (url) {
      chrome.tabs.create({ url });
    }
  }

  // Switch to dashboard tab
  function switchToDashboard() {
    const dashboardTab = document.querySelector(
      '.nav-tab[data-tab="dashboard"]'
    ) as HTMLElement;
    if (dashboardTab) {
      dashboardTab.click();
    }
  }

  // Update global functions
  (window as any).changeJobStatus = changeJobStatus;
  (window as any).openJobUrl = openJobUrl;
  (window as any).switchToDashboard = switchToDashboard;

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
            // Show toast to configure profile first
            showToast("Please configure your Autofill Profile in Settings.", {
              type: "warning",
              duration: 3000,
            });
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
          // Toast: navigate to LinkedIn
          showToast("Open a LinkedIn Job page to use People Search.", {
            type: "warning",
          });
        }
      }
    });
  });

  openBoardBtn?.addEventListener("click", () => {
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const url = result.webAppUrl || DEFAULT_WEB_APP_URL;
      chrome.tabs.create({ url });
    });
  });

  // Authentication: open web app sign-in/up pages
  function openAuthPage(mode: "sign-in" | "sign-up", provider?: "google") {
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const appBase = (
        result.webAppUrl ||
        process.env.WEB_APP_URL ||
        DEFAULT_WEB_APP_URL
      ).replace(/\/$/, "");
      const path = mode === "sign-in" ? "/sign-in" : "/sign-up";
      const url = provider
        ? `${appBase}${path}?provider=${provider}&google=1&redirect_url=${encodeURIComponent(
            "/extension/connect"
          )}`
        : `${appBase}${path}?redirect_url=${encodeURIComponent(
            "/extension/connect"
          )}`;
      chrome.tabs.create({ url });
      window.close();
    });
  }

  signinBtn?.addEventListener("click", () => openAuthPage("sign-in"));
  signupBtn?.addEventListener("click", () => openAuthPage("sign-up"));

  // Sign out logic
  signoutBtn?.addEventListener("click", () => {
    signOut();
  });

  // Authentication flows are handled in the web app using Firebase.

  async function signOut() {
    chrome.storage.sync.remove(["firebaseUid", "userId"], () => {
      // Attempt to clear any web-app session artifacts (optional)
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (
            tab.url &&
            (tab.url.includes("localhost") || tab.url.includes("hireall"))
          ) {
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id! },
                func: () => {
                  localStorage.removeItem("__firebase_user");
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

  // ensureUserExists is no longer needed with Firebase; web app handles user creation
});

function loadStats() {
  chrome.storage.local.get(
    ["jobsToday", "sponsoredJobs", "applications", "jobBoardData"],
    (result) => {
      document.getElementById("jobs-today")!.textContent =
        result.jobsToday || "0";
      document.getElementById("sponsored-jobs")!.textContent =
        result.sponsoredJobs || "0";

      // Update applications count
      const jobBoardData = result.jobBoardData || [];
      const appliedCount = jobBoardData.filter(
        (job: any) => job.status === "applied"
      ).length;
      document.getElementById("applications")!.textContent =
        jobBoardData.length.toString();
      document.getElementById("applied-count")!.textContent =
        appliedCount.toString();
    }
  );
}

function loadSettings() {
  chrome.storage.sync.get(
    [
      "autoDetectJobs",
      "showJobBadges",
      "autoSaveProfile",
      "webAppUrl",
      "syncFrequency",
    ],
    (result) => {
      // Load toggle states
      const autoDetectToggle = document.getElementById("auto-detect-toggle");
      const showBadgesToggle = document.getElementById("show-badges-toggle");
      const autoSaveProfileToggle = document.getElementById(
        "auto-save-profile-toggle"
      );

      if (autoDetectToggle) {
        autoDetectToggle.classList.toggle(
          "active",
          result.autoDetectJobs !== false
        );
      }
      if (showBadgesToggle) {
        showBadgesToggle.classList.toggle(
          "active",
          result.showJobBadges !== false
        );
      }
      if (autoSaveProfileToggle) {
        autoSaveProfileToggle.classList.toggle(
          "active",
          result.autoSaveProfile !== false
        );
      }

      // Load input values
      const webAppUrlInput = document.getElementById(
        "web-app-url"
      ) as HTMLInputElement;
      const syncFrequencySelect = document.getElementById(
        "sync-frequency"
      ) as HTMLSelectElement;

      if (webAppUrlInput) {
        webAppUrlInput.value = result.webAppUrl || DEFAULT_WEB_APP_URL;
      }
      if (syncFrequencySelect) {
        syncFrequencySelect.value = result.syncFrequency || "realtime";
      }
    }
  );
}

function saveSettings() {
  const autoDetectToggle = document.getElementById("auto-detect-toggle");
  const showBadgesToggle = document.getElementById("show-badges-toggle");
  const autoSaveProfileToggle = document.getElementById(
    "auto-save-profile-toggle"
  );
  const webAppUrlInput = document.getElementById(
    "web-app-url"
  ) as HTMLInputElement;
  const syncFrequencySelect = document.getElementById(
    "sync-frequency"
  ) as HTMLSelectElement;

  const settings = {
    autoDetectJobs: autoDetectToggle?.classList.contains("active") ?? true,
    showJobBadges: showBadgesToggle?.classList.contains("active") ?? true,
    autoSaveProfile:
      autoSaveProfileToggle?.classList.contains("active") ?? true,
    webAppUrl: webAppUrlInput?.value || DEFAULT_WEB_APP_URL,
    syncFrequency: syncFrequencySelect?.value || "realtime",
  };

  chrome.storage.sync.set(settings, () => {
    showToast("Settings saved", { type: "success" });
  });
}


function showResult(element: HTMLElement, message: string, type: "success" | "error" | "warning" | "info") {
  element.textContent = message;
  element.className = `result-box ${type}`;
  element.style.display = "block";
}

// Global function for checking job sponsors (called from HTML onclick)
async function checkJobSponsor(jobId: string, companyName: string) {
  const sponsorBtn = document.getElementById(`sponsor-btn-${jobId}`) as HTMLButtonElement;
  const sponsorStatus = document.getElementById(`sponsor-status-${jobId}`) as HTMLDivElement;

  if (!sponsorBtn || !sponsorStatus) return;

  // Show checking state
  sponsorBtn.disabled = true;
  sponsorBtn.textContent = "Checking...";
  sponsorStatus.style.display = "block";
  sponsorStatus.textContent = "Checking...";
  sponsorStatus.className = "sponsor-status checking";

  try {
    // Get the web app URL from storage or use default
    const webAppUrl = await new Promise<string>((resolve) => {
      chrome.storage.sync.get(["webAppUrl"], (result) => {
        resolve(result.webAppUrl || DEFAULT_WEB_APP_URL);
      });
    });

    const response = await fetch(`${webAppUrl}/api/sponsors?q=${encodeURIComponent(companyName)}&limit=1`);
    const data = await response.json();

    if (data.success && data.results.length > 0) {
      const result = data.results[0];
      const isSkilledWorker = result.isSkilledWorker;

      if (isSkilledWorker) {
        sponsorStatus.textContent = "Licensed";
        sponsorStatus.className = "sponsor-status licensed";
        showToast(`${createSVGString("checkCircle")} ${result.name} is a licensed sponsor!`, { type: "success" });
      } else {
        sponsorStatus.textContent = "Not SW";
        sponsorStatus.className = "sponsor-status not-licensed";
        showToast(`${createSVGString("alertTriangle")} ${result.name} is licensed but not for Skilled Worker visas`, { type: "warning" });
      }
    } else {
      sponsorStatus.textContent = "Not Found";
      sponsorStatus.className = "sponsor-status not-licensed";
      showToast(`${createSVGString("xCircle")} ${companyName} not found in sponsor register`, { type: "error" });
    }
  } catch (error) {
    sponsorStatus.textContent = "Error";
    sponsorStatus.className = "sponsor-status not-licensed";
    showToast(`${createSVGString("xCircle")} Error checking sponsor status`, { type: "error" });
  } finally {
    sponsorBtn.disabled = false;
    sponsorBtn.textContent = "🇬🇧 Check Sponsor";
  }
}

// Make function globally available
(window as any).checkJobSponsor = checkJobSponsor;
