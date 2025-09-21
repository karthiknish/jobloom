/// <reference types="chrome" />
import { DEFAULT_WEB_APP_URL } from "./constants";

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
    type === "success" ? "✅" : type === "warning" ? "⚠️" : type === "error" ? "❌" : "🔔";
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
  const signinGoogleBtn = document.getElementById("signin-google-btn");
  const signupBtn = document.getElementById("signup-btn");
  const signupGoogleBtn = document.getElementById("signup-google-btn");
  const signoutBtn = document.getElementById("signout-btn");

  // Job management
  const jobFilters = document.querySelectorAll(".filter-btn");

  // Initialize
  loadStats();
  loadSettings();
  setupTabNavigation();
  setupJobFilters();
  setupSettingsControls();

  // Check authentication status
  chrome.storage.sync.get(["firebaseUid", "userId"], (res) => {
    const uid = res.firebaseUid || res.userId;
    const authStatus = document.getElementById("auth-status")!;
    const statusDot = authStatus.querySelector(".status-dot")!;
    const statusText = authStatus.querySelector(".status-text")!;

    if (!uid) {
      // User not authenticated
      authStatus.className = "auth-status unauthenticated";
      (statusDot as HTMLElement).style.background = "#f59e0b";
      statusText.textContent = "Not signed in";

      // Hide main actions, show auth tab
      document
        .querySelectorAll(
          '.nav-tab[data-tab="dashboard"], .nav-tab[data-tab="jobs"], .nav-tab[data-tab="settings"]'
        )
        .forEach((tab) => {
          (tab as HTMLElement).style.display = "none";
        });
      const authTab = document.querySelector(
        '.nav-tab[data-tab="auth"]'
      ) as HTMLElement;
      if (authTab) {
        authTab.style.display = "flex";
        authTab.click(); // Switch to auth tab
      }
    } else {
      // User authenticated
      authStatus.className = "auth-status authenticated";
      (statusDot as HTMLElement).style.background = "#10b981";
      statusText.textContent = "Signed in";

      // Show all tabs
      document.querySelectorAll(".nav-tab").forEach((tab) => {
        (tab as HTMLElement).style.display = "flex";
      });

      // Load jobs for the jobs tab
      loadJobs();
    }
  });

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
            <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
            <h3 style="margin: 0 0 8px 0; color: #374151;">No jobs tracked yet</h3>
            <p style="margin: 0; font-size: 14px;">Jobs you add to your board will appear here</p>
            <button class="action-btn" style="margin-top: 16px; padding: 8px 16px; font-size: 12px;" onclick="switchToDashboard()">
              <div class="action-icon primary">🎯</div>
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
                  ? `<span class="job-badge badge-sponsored">🎯 ${
                      job.sponsorshipInfo.sponsorshipType || "Sponsored"
                    }</span>`
                  : ""
              }
              ${
                job.salary
                  ? `<span class="job-badge badge-salary">💰 ${job.salary}</span>`
                  : ""
              }
              ${
                job.remoteWork
                  ? `<span class="job-badge badge-remote">🏠 Remote</span>`
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
          <div style="font-size: 32px; margin-bottom: 8px;">❌</div>
          <p>Failed to load jobs. Please try again.</p>
        </div>
      `;
    }
  }

  // Helper function for status icons
  function getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      applied: "📝",
      interviewing: "🎯",
      offered: "🎉",
      rejected: "❌",
      withdrawn: "🚫",
    };
    return icons[status] || "📋";
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
  signinGoogleBtn?.addEventListener("click", () =>
    openAuthPage("sign-in", "google")
  );
  signupBtn?.addEventListener("click", () => openAuthPage("sign-up"));
  signupGoogleBtn?.addEventListener("click", () =>
    openAuthPage("sign-up", "google")
  );

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
            (tab.url.includes("localhost") || tab.url.includes("jobloom"))
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
