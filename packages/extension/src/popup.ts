/// <reference types="chrome" />
import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "./constants";
import { getAuthInstance } from "./firebase";
import { get } from "./apiClient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { EXT_COLORS } from "./theme";

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

// Enhanced Toast helper with better animations and interactions
function showToast(
  message: string,
  opts: {
    type?: "success" | "info" | "warning" | "error";
    duration?: number;
    action?: {
      text: string;
      handler: () => void;
    };
  } = {}
) {
  const { type = "info", duration = 3000, action } = opts;
  const root = document.getElementById("toast-root");
  if (!root) return;
  
  // Remove existing toasts of the same type to avoid stacking
  const existingToasts = root.querySelectorAll<HTMLElement>(`.toast.${type}`);
  existingToasts.forEach((toast) => {
    toast.style.animation = "toast-out 150ms ease-in forwards";
    setTimeout(() => toast.remove(), 160);
  });
  
  const el = document.createElement("div");
  el.className = `toast ${type} animate-slide-in-down`;
  
  const icon =
    type === "success"
      ? createSVGString("checkCircle")
      : type === "warning"
      ? createSVGString("alertTriangle")
      : type === "error"
      ? createSVGString("xCircle")
      : createSVGString("bell");
      
  const actionHtml = action ? `<button class="toast-action" data-action="true">${action.text}</button>` : '';
  
  el.innerHTML = `
    <span class="icon">${icon}</span>
    <div class="message">${message}</div>
    ${actionHtml}
    <button class="close" aria-label="Close">×</button>
  `;
  
  const remove = () => {
    el.classList.remove('animate-slide-in-down');
    el.classList.add('animate-slide-out-up');
    setTimeout(() => el.remove(), 300);
  };
  
  el.querySelector(".close")?.addEventListener("click", remove);
  
  if (action) {
    el.querySelector(".toast-action")?.addEventListener("click", () => {
      action.handler();
      remove();
    });
  }
  
  root.appendChild(el);
  setTimeout(remove, duration);
}

// Helper function to add micro-interactions to elements
function addMicroInteractions() {
  // Add ripple effect to buttons
  document.querySelectorAll<HTMLButtonElement>('.action-btn, .auth-btn, .job-action-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const mouseEvent = event as MouseEvent;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = mouseEvent.clientX - rect.left - size / 2;
      const y = mouseEvent.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Add hover effects to stat cards
  document.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('pulse-once');
    });
  });
  
  // Add focus styles for better accessibility
  document.querySelectorAll<HTMLElement>('button, input, select').forEach((element) => {
    element.classList.add('focus-ring');
  });
}

// Add ripple animation CSS if not already present
function addRippleAnimation() {
  if (document.getElementById('ripple-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", () => {
  // Main action buttons
  const autofillBtn = document.getElementById("autofill-btn");
  // const peopleSearchBtn removed (feature deprecated)
  const openBoardBtn = document.getElementById("open-board-btn");

  // Settings controls
  // Auth buttons
  const signoutBtn = document.getElementById("signout-btn");
  const emailForm = document.getElementById(
    "email-auth-form"
  ) as HTMLFormElement | null;
  const emailInput = document.getElementById(
    "auth-email"
  ) as HTMLInputElement | null;
  const passwordInput = document.getElementById(
    "auth-password"
  ) as HTMLInputElement | null;
  const googleBtn = document.getElementById(
    "google-auth-btn"
  ) as HTMLButtonElement | null;
  const authError = document.getElementById("auth-error");
  const authSuccess = document.getElementById("auth-success");

  // Initialize Firebase and check for errors
  let auth: any;
  try {
    auth = getAuthInstance();
    console.log("Firebase Auth initialized successfully");
  } catch (error: any) {
    console.error("Firebase initialization failed:", error);
    showAuthError("Authentication service unavailable. Please try again later.");
    return;
  }

  // Initialize
  loadStats();
  loadSettings();
  setupTabNavigation();
  setupJobFilters();
  setupSettingsControls();
  
  // Initialize micro-interactions
  addRippleAnimation();
  setTimeout(addMicroInteractions, 100); // Delay to ensure DOM is ready

  // Check authentication status (throttled to prevent flickering)
  // Firebase auth state observer
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User: ${user.email}` : "No user");
    updateAuthUI(!!user);
    
    if (user?.uid) {
      // Persist uid and email to chrome storage for content scripts/background
      chrome.storage.sync.set({ 
        firebaseUid: user.uid,
        userEmail: user.email || ""
      }, () => {
        console.log("Auth data saved to storage");
      });
    } else {
      chrome.storage.sync.remove(["firebaseUid", "userEmail"], () => {
        console.log("Auth data cleared from storage");
      });
    }
  });

  function updateAuthUI(isAuthed: boolean) {
    const authStatus = document.getElementById("auth-status")!;
    const statusDot = authStatus.querySelector(".status-dot") as HTMLElement;
    const statusText = authStatus.querySelector(".status-text") as HTMLElement;
    const authTab = document.querySelector(
      '.nav-tab[data-tab="auth"]'
    ) as HTMLElement | null;
    const mainTabs = document.querySelectorAll(
      '.nav-tab[data-tab="dashboard"], .nav-tab[data-tab="jobs"], .nav-tab[data-tab="settings"]'
    );
    const signoutBtnEl = signoutBtn as HTMLElement | null;
    const formContainer = document.getElementById(
      "auth-form-container"
    ) as HTMLElement | null;

    if (!isAuthed) {
      authStatus.className = "auth-status unauthenticated";
      statusDot.style.background = EXT_COLORS.warning;
      statusText.textContent = "Not signed in";
      mainTabs.forEach((t) => ((t as HTMLElement).style.display = "none"));
      if (authTab) authTab.style.display = "flex";
      if (authTab && !authTab.classList.contains("active")) authTab.click();
      if (signoutBtnEl) signoutBtnEl.style.display = "none";
      if (formContainer) formContainer.style.display = "flex";
    } else {
      authStatus.className = "auth-status authenticated";
      statusDot.style.background = EXT_COLORS.success;
      statusText.textContent = "Signed in";
      const allTabs = document.querySelectorAll(".nav-tab");
      allTabs.forEach((t) => ((t as HTMLElement).style.display = "flex"));
      if (signoutBtnEl) signoutBtnEl.style.display = "flex";
      if (formContainer) formContainer.style.display = "none";
      loadJobs();
    }
    if (authSuccess) {
      authSuccess.style.display = isAuthed ? "block" : "none";
      authSuccess.textContent = isAuthed ? "Authenticated" : "";
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
        
        // Handle UK filters toggle specifically
        if (toggle.id === "uk-filters-toggle") {
          const ukFiltersDetails = document.getElementById("uk-filters-details");
          if (ukFiltersDetails) {
            ukFiltersDetails.style.display = toggle.classList.contains("active") ? "block" : "none";
          }
        }
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
        const url = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
        chrome.tabs.create({ url: `${url}/account` });
      });
    });

    // Configure UK filters button
    const configureUkFiltersBtn = document.getElementById("configure-uk-filters");
    configureUkFiltersBtn?.addEventListener("click", () => {
      chrome.storage.sync.get(["webAppUrl"], (result) => {
        const url = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
        chrome.tabs.create({ url: `${url}/settings` });
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
          <span>Fetching your latest job opportunities...</span>
        </div>
      `;

      // Import JobBoardManager and get all jobs
      const { JobBoardManager } = await import("./addToBoard");
      const jobs = await JobBoardManager.getAllJobs();

      jobCount.textContent = `${jobs.length} jobs`;

      if (jobs.length === 0) {
        jobList.innerHTML = `
          <div style="text-align: center; color: var(--muted); padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${createSVGString(
              "clipboardPlus",
              48
            )}</div>
            <h3 style="margin: 0 0 8px 0; color: var(--muted-foreground);">No jobs tracked yet</h3>
            <p style="margin: 0; font-size: 14px;">Jobs you add to your board will appear here</p>
            <button class="action-btn" style="margin-top: 16px; padding: 8px 16px; font-size: 12px;" onclick="switchToDashboard()">
              <div class="action-icon primary">${createSVGString(
                "target",
                20
              )}</div>
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

      // Check UK eligibility if filters are enabled
      const ukFiltersEnabled = await new Promise<boolean>((resolve) => {
        chrome.storage.sync.get(["ukFiltersEnabled"], (result) => {
          resolve(result.ukFiltersEnabled === true);
        });
      });

      if (ukFiltersEnabled) {
        // Check UK eligibility for all jobs in parallel
        const eligibilityPromises = filteredJobs.map(async (job) => {
          const eligibility = await checkUKEligibility(job);
          return { ...job, ukEligibility: eligibility };
        });
        
        const jobsWithEligibility = await Promise.all(eligibilityPromises);
        filteredJobs = jobsWithEligibility;
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
            interested: EXT_COLORS.muted,
            applied: EXT_COLORS.info,
            interviewing: EXT_COLORS.warning,
            offered: EXT_COLORS.success,
            rejected: EXT_COLORS.destructive,
            withdrawn: EXT_COLORS.violet,
          };

          const statusColor = statusColors[job.status] || EXT_COLORS.muted;

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
                  job.status === "interested" ? "Star" : getStatusIcon(job.status)
                } ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              ${
                job.sponsorshipInfo?.isSponsored
                  ? `<span class="job-badge badge-sponsored">${createSVGString(
                      "target",
                      12
                    )} ${
                      job.sponsorshipInfo.sponsorshipType || "Sponsored"
                    }</span>`
                  : ""
              }
              ${
                job.ukEligibility
              ? `<span class="job-badge badge-uk-eligible" style="background: rgba(5, 150, 105, 0.1); color: #059669;">🇬🇧 UK Eligible</span>`
                  : job.ukEligibility === false
                  ? `<span class="job-badge badge-uk-ineligible" style="background: rgba(220, 38, 38, 0.1); color: #dc2626;">🇬🇧 Not Eligible</span>`
                  : ""
              }
              ${
                job.salary
                  ? `<span class="job-badge badge-salary">$ ${job.salary}</span>`
                  : ""
              }
              ${
                job.remoteWork
                  ? `<span class="job-badge badge-remote">${createSVGString(
                      "home",
                      12
                    )} Remote</span>`
                  : ""
              }
            </div>

            ${
              job.notes
                ? `
              <div style="margin: 8px 0; padding: 8px 12px; background: EXT_COLORS.light; border-radius: 6px; font-size: 12px; color: EXT_COLORS.slate;">
                <strong>Notes:</strong> ${job.notes}
              </div>
            `
                : ""
            }

            <div class="job-actions">
              <div class="sponsor-status" id="sponsor-status-${
                job.id
              }" style="display: none;">Checking...</div>
              <button class="job-action-btn" onclick="checkJobSponsor('${
                job.id
              }', '${job.company.replace(/'/g, "\\'")}')" id="sponsor-btn-${
            job.id
          }">
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
          <div style="font-size: 32px; margin-bottom: 8px;">${createSVGString(
            "xCircle",
            32
          )}</div>
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
      offered: createSVGString("star", 12),
      rejected: createSVGString("xCircle", 12),
      withdrawn: createSVGString("x", 12),
    };
    return icons[status] || createSVGString("clipboardPlus", 12);
  }

  // Enhanced job status update function with better feedback
  async function changeJobStatus(jobId: string, newStatus: string) {
    const btn = document.getElementById(`status-btn-${jobId}`) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Updating...';
    }
    
    try {
      const { JobBoardManager } = await import("./addToBoard");
      const result = await JobBoardManager.updateJobStatus(
        jobId,
        newStatus as any
      );

      if (result.success) {
        showToast(
          `Job marked as ${newStatus}!`, 
          { 
            type: "success",
            action: {
              text: "View Jobs",
              handler: () => {
                const jobsTab = document.querySelector('.nav-tab[data-tab="jobs"]') as HTMLElement;
                jobsTab?.click();
              }
            }
          }
        );
        // Reload jobs to reflect changes
        setTimeout(() => loadJobs(), 500);
      } else {
        showToast(result.message, { type: "error" });
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      showToast("Unable to update job status", { type: "error" });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      }
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

  autofillBtn?.addEventListener("click", () => {
    // Add loading state
    const originalContent = autofillBtn.innerHTML;
    autofillBtn.classList.add('loading');
    autofillBtn.querySelector('.action-content h3')!.textContent = 'Preparing Autofill...';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.storage.sync.get(["autofillProfile"], (result) => {
          if (!result.autofillProfile) {
            // Restore button state
            autofillBtn.innerHTML = originalContent;
            autofillBtn.classList.remove('loading');
            
            // Show enhanced toast with action
            showToast(
              "Please set up your profile information in Settings first.",
              {
                type: "warning",
                duration: 4000,
                action: {
                  text: "Open Settings",
                  handler: () => {
                    const settingsTab = document.querySelector('.nav-tab[data-tab="settings"]') as HTMLElement;
                    settingsTab?.click();
                  }
                }
              }
            );
            return;
          }

          // Show success feedback
          showToast("Autofill activated! Switching to job page...", { type: "success" });
          
          setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id!, { action: "triggerAutofill" });
            window.close();
          }, 500);
        });
      }
    });
  });

  // People search button removed

  openBoardBtn?.addEventListener("click", () => {
    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const url = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
      chrome.tabs.create({ url });
    });
  });

  // Authentication: open web app sign-in/up pages
  // Email/password auth form
  emailForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailInput?.value || !passwordInput?.value) {
      showAuthError("Please enter both email and password");
      return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      showAuthError("Please enter a valid email address");
      return;
    }
    
    if (password.length < 6) {
      showAuthError("Password must be at least 6 characters");
      return;
    }
    
    clearAuthMessages();
    const btn = document.getElementById(
      "email-auth-submit"
    ) as HTMLButtonElement;
    const original = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;
    
    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, email, password);
      showAuthSuccess("Signed in successfully");
      // Clear form on success
      emailInput.value = "";
      passwordInput.value = "";
    } catch (err: any) {
      console.error("Sign in error:", err);
      
      // If user doesn't exist, try to create account
      if (err.code === "auth/user-not-found") {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          showAuthSuccess("Account created successfully");
          // Clear form on success
          emailInput.value = "";
          passwordInput.value = "";
        } catch (createErr: any) {
          console.error("Create account error:", createErr);
          let errorMessage = "Failed to create account";
          
          // Handle specific Firebase errors
          switch (createErr.code) {
            case "auth/email-already-in-use":
              errorMessage = "An account with this email already exists";
              break;
            case "auth/weak-password":
              errorMessage = "Password is too weak (minimum 6 characters)";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email address";
              break;
            default:
              errorMessage = createErr.message || errorMessage;
          }
          
          showAuthError(errorMessage);
        }
      } else {
        // Handle sign in errors
        let errorMessage = "Sign in failed";
        
        switch (err.code) {
          case "auth/wrong-password":
            errorMessage = "Incorrect password";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
        
        showAuthError(errorMessage);
      }
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  googleBtn?.addEventListener("click", () => {
    clearAuthMessages();
    googleBtn.disabled = true;
    googleBtn.textContent = "Opening Google...";

    chrome.storage.sync.get(["webAppUrl"], (result) => {
      const baseUrl = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
      const targetUrl = `${baseUrl}/sign-in?from=extension&provider=google`;

      chrome.tabs.create({ url: targetUrl }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to open Google sign-in tab:", chrome.runtime.lastError);
          showAuthError("Unable to open Google sign-in tab. Please try again.");
        } else {
          showToast("Complete Google sign-in in the newly opened tab", {
            type: "info",
          });
        }

        googleBtn.textContent = "Continue with Google";
        googleBtn.disabled = false;
      });
    });
  });

  function showAuthError(msg: string) {
    if (authError) {
      authError.textContent = msg;
      authError.style.display = "block";
    } else {
      showToast(msg, { type: "error" });
    }
  }
  function showAuthSuccess(msg: string) {
    if (authSuccess) {
      authSuccess.textContent = msg;
      authSuccess.style.display = "block";
    } else {
      showToast(msg, { type: "success" });
    }
  }
  function clearAuthMessages() {
    if (authError) authError.style.display = "none";
    if (authSuccess) authSuccess.style.display = "none";
  }

  // Sign out logic
  signoutBtn?.addEventListener("click", () => {
    signOut();
  });

  // Authentication flows are handled in the web app using Firebase.

  async function signOut() {
    try {
      console.log("Signing out...");
      await firebaseSignOut(auth);
      
      // Clear all auth-related storage
      chrome.storage.sync.remove(["firebaseUid", "userId"], () => {
        console.log("Cleared auth storage");
      });
      
      // Update UI immediately
      updateAuthUI(false);
      
      // Show success message
      showToast("You've been signed out successfully", { type: "info" });
      
      // Switch to auth tab
      const authTab = document.querySelector('.nav-tab[data-tab="auth"]') as HTMLElement;
      if (authTab) {
        authTab.click();
      }
      
    } catch (e: any) {
      console.error("Sign out error:", e);
      showToast("Sign out failed. Please try again.", { type: "error" });
    }
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
      "ukFiltersEnabled",
    ],
    (result) => {
      // Load toggle states
      const autoDetectToggle = document.getElementById("auto-detect-toggle");
      const showBadgesToggle = document.getElementById("show-badges-toggle");
      const autoSaveProfileToggle = document.getElementById(
        "auto-save-profile-toggle"
      );
      const ukFiltersToggle = document.getElementById("uk-filters-toggle");

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
      if (ukFiltersToggle) {
        ukFiltersToggle.classList.toggle(
          "active",
          result.ukFiltersEnabled === true
        );
        
        // Show/hide UK filters details based on toggle state
        const ukFiltersDetails = document.getElementById("uk-filters-details");
        if (ukFiltersDetails) {
          ukFiltersDetails.style.display = result.ukFiltersEnabled === true ? "block" : "none";
        }
      }

      // Load input values
      const webAppUrlInput = document.getElementById(
        "web-app-url"
      ) as HTMLInputElement;
      const syncFrequencySelect = document.getElementById(
        "sync-frequency"
      ) as HTMLSelectElement;

      if (webAppUrlInput) {
        webAppUrlInput.value = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
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
  const ukFiltersToggle = document.getElementById("uk-filters-toggle");
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
    ukFiltersEnabled: ukFiltersToggle?.classList.contains("active") ?? false,
    webAppUrl: sanitizeBaseUrl(webAppUrlInput?.value || DEFAULT_WEB_APP_URL),
    syncFrequency: syncFrequencySelect?.value || "realtime",
  };

  chrome.storage.sync.set(settings, () => {
    showToast("Settings updated successfully", { type: "success" });
  });
}

// Function to check UK eligibility for a job
async function checkUKEligibility(job: any): Promise<boolean | null> {
  try {
    // Get UK filter settings from storage
    const result = await new Promise<any>((resolve) => {
      chrome.storage.sync.get(["ukFiltersEnabled", "webAppUrl"], resolve);
    });

    if (!result.ukFiltersEnabled) {
      return null; // UK filters not enabled, don't check
    }

    // Fetch user's UK sponsorship criteria from web app
    const auth = getAuthInstance();
    if (!auth.currentUser) {
      return null; // Not authenticated
    }

    const token = await auth.currentUser.getIdToken();
    const baseUrl = sanitizeBaseUrl(result.webAppUrl || DEFAULT_WEB_APP_URL);
    const response = await fetch(`${baseUrl}/api/user/uk-sponsorship-criteria`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return null; // Error fetching criteria
    }

    const criteria = await response.json();
    
    // Check eligibility based on job data and criteria
    if (!job.salary) return null; // No salary info, can't determine
    
    const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''));
    let minSalary = criteria.minimumSalary || 41700; // Default UK minimum
    
    // Apply age/education adjustments
    if (criteria.isUnder26 || criteria.isRecentGraduate) {
      minSalary = Math.min(minSalary, 33400); // 70% rate
    } else if (criteria.hasPhD) {
      if (criteria.isSTEMPhD) {
        minSalary = Math.min(minSalary, 33400); // 80% rate for STEM PhD
      } else {
        minSalary = Math.min(minSalary, 37500); // 90% rate for non-STEM PhD
      }
    }
    
    // Check special roles
    if (job.title?.toLowerCase().includes('postdoctoral') || 
        job.title?.toLowerCase().includes('post doc')) {
      minSalary = Math.min(minSalary, 33400);
    }
    
    return salaryNum >= minSalary;
  } catch (error) {
    console.error('Error checking UK eligibility:', error);
    return null;
  }
}

// Global function for checking job sponsors (called from HTML onclick)
async function checkJobSponsor(jobId: string, companyName: string) {
  const sponsorBtn = document.getElementById(
    `sponsor-btn-${jobId}`
  ) as HTMLButtonElement | null;
  const sponsorStatus = document.getElementById(
    `sponsor-status-${jobId}`
  ) as HTMLDivElement;

  if (!sponsorBtn || !sponsorStatus) {
    console.error(`Sponsor check elements not found for job ${jobId}`);
    return;
  }

  // Validate inputs
  if (!companyName || companyName.trim().length < 2) {
    showToast("Invalid company name for sponsor check", { type: "error" });
    return;
  }

  // Show checking state
  sponsorBtn.disabled = true;
  sponsorBtn.textContent = "Checking...";
  sponsorStatus.style.display = "block";
  sponsorStatus.textContent = "Checking...";
  sponsorStatus.className = "sponsor-status checking";

  try {
    console.log(`Checking sponsor status for: ${companyName}`);
    
    let result: any | null = null;
    try {
      const data = await get<any>("/api/app/sponsorship/companies", {
        q: companyName.trim(),
        limit: 1,
      });
      
      if (data && data.results && data.results.length > 0) {
        result = data.results[0];
        console.log(`Sponsor found: ${result.name}, route: ${result.route}`);
      } else {
        console.log(`No sponsor found for: ${companyName}`);
      }
    } catch (e: any) {
      console.warn("Sponsor lookup error", e);
      
      // Handle different error types appropriately
      if (e?.rateLimitInfo) {
        const resetIn = Math.ceil((e.rateLimitInfo.resetIn || 0) / 1000);
        showToast(
          `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          { type: "warning", duration: 5000 }
        );
        sponsorStatus.textContent = `Rate Limited (${resetIn}s)`;
        sponsorStatus.className = "sponsor-status rate-limited";
        return;
      } else if (e?.statusCode === 401) {
        showToast(
          "Please sign in to check sponsor status",
          { type: "error", duration: 5000 }
        );
        sponsorStatus.textContent = "Sign In Required";
        sponsorStatus.className = "sponsor-status not-licensed";
        return;
      } else if (e?.statusCode === 403) {
        showToast(
          "Permission denied. You don't have access to sponsor lookup.",
          { type: "error", duration: 5000 }
        );
        sponsorStatus.textContent = "Access Denied";
        sponsorStatus.className = "sponsor-status not-licensed";
        return;
      } else if (e?.statusCode === 429) {
        showToast(
          "Too many requests. Please wait before trying again.",
          { type: "warning", duration: 5000 }
        );
        sponsorStatus.textContent = "Too Many Requests";
        sponsorStatus.className = "sponsor-status rate-limited";
        return;
      }
      
      // For other errors, continue with null result
      console.error("Sponsor lookup failed with error:", e);
    }

    if (result) {
      // Check different sponsorship types
      const isSkilledWorker = result.route === 'skilled worker' || 
                             result.route?.toLowerCase().includes('skilled');
      const isGlobalBusiness = result.route === 'global business mobility' || 
                              result.route?.toLowerCase().includes('global');
      const hasOtherSponsorship = !isSkilledWorker && !isGlobalBusiness;

      if (isSkilledWorker) {
        sponsorStatus.textContent = "Licensed (Skilled Worker)";
        sponsorStatus.className = "sponsor-status licensed";
        showToast(
          `✅ ${result.name} is licensed to sponsor Skilled Worker visas!`,
          { type: "success" }
        );
      } else if (isGlobalBusiness) {
        sponsorStatus.textContent = "Licensed (Global Business)";
        sponsorStatus.className = "sponsor-status licensed-alt";
        showToast(
          `✅ ${result.name} is licensed for Global Business Mobility visas`,
          { type: "success" }
        );
      } else if (hasOtherSponsorship) {
        sponsorStatus.textContent = `Licensed (${result.route})`;
        sponsorStatus.className = "sponsor-status licensed-alt";
        showToast(
          `ℹ️ ${result.name} is licensed for ${result.route} sponsorship`,
          { type: "info" }
        );
      } else {
        sponsorStatus.textContent = "Not Skilled Worker";
        sponsorStatus.className = "sponsor-status not-skilled";
        showToast(
          `⚠️ ${result.name} is licensed but doesn't sponsor Skilled Worker visas`,
          { type: "warning" }
        );
      }

      // Add additional information if available
      if (result.city) {
        sponsorStatus.textContent += ` • ${result.city}`;
      }

    } else {
      sponsorStatus.textContent = "Not Found";
      sponsorStatus.className = "sponsor-status not-licensed";
      showToast(
        `❌ ${companyName} isn't in the UK sponsor register`,
        { type: "error" }
      );
    }
  } catch (error) {
    console.error("Unexpected error in sponsor check:", error);
    sponsorStatus.textContent = "Error";
    sponsorStatus.className = "sponsor-status error";
    showToast("Unable to check sponsor status due to an unexpected error", {
      type: "error",
    });
  } finally {
    sponsorBtn.disabled = false;
    sponsorBtn.textContent = "🇬🇧 Check Sponsor";
  }
}

// Make function globally available
(window as any).checkJobSponsor = checkJobSponsor;
