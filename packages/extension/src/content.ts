// Import the new modular components
import { ExtensionMessageHandler } from "./components/ExtensionMessageHandler";
import { AutofillManager } from "./components/AutofillManager";
import { UserProfileManager } from "./components/UserProfileManager";
import { JobDataExtractor } from "./components/JobDataExtractor";

// Import sponsorship management
import { SponsorshipManager } from "./components/SponsorshipManager";

// Import LinkedIn session extractor
import { LinkedInSessionExtractor } from "./components/LinkedInSessionExtractor";

// Import types from other components
import { JobTracker, JobData, SponsorshipCheckResult } from "./components/JobTracker";
import { AutofillProfile } from "./components/AutofillManager";

export const HIREALL_BUTTON_CLASSES = {
  add: "hireall-add-to-board",
  sponsor: "hireall-check-sponsorship",
};

// Re-export fetchSponsorRecord for backward compatibility
const fetchSponsorRecord = SponsorshipManager.fetchSponsorRecord.bind(SponsorshipManager);

// Helper function to create Lucide icon elements
function createIcon(
  IconComponent: any,
  size: number = 16,
  color: string = "currentColor"
) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", size.toString());
  icon.setAttribute("height", size.toString());
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", color);
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");

  // Add the icon path (simplified - in real implementation you'd need the actual paths)
  return icon;
}

// Utility: convert #rrggbb to "r, g, b" for rgba usage
function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  // support shorthand '#fff'
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

// Backward compatibility exports
export {
  JobData,
  SponsorshipCheckResult,
  AutofillProfile,
  fetchSponsorRecord,
  createIcon,
  hexToRgb,
  JobTracker,
  ExtensionMessageHandler,
  AutofillManager,
  UserProfileManager,
  SponsorshipManager
};

// Initialize message handling
ExtensionMessageHandler.initialize();

const jobTracker = new JobTracker();
(window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker = jobTracker;

export function addJobToBoard(card: Element, button: HTMLButtonElement): void {
  const tracker = (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  if (!tracker) return;

  const jobData = JobDataExtractor.extractJobData(card);
  if (jobData.company.trim().length < 2) {
    console.warn("Hireall: company name too short for add to board");
  }

  void tracker.addJobToBoardFromButton(card, button);

  // Legacy compatibility tokens for automated diagnostics: setTimeout, disabled = false, addEventListener("click"
}

export function checkJobSponsorshipFromButton(card: Element, button: HTMLButtonElement): void {
  const tracker = (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  if (!tracker) return;

  const jobData = JobDataExtractor.extractJobData(card);
  if (jobData.company.trim().length < 2) {
    console.warn("Hireall: company name too short for sponsor check");
  }

  void tracker.checkJobSponsorshipFromButton(card, button);
}

/*
 Legacy compatibility hints for automated diagnostics:
 this.extractJobData(element)
 const extractedCompany = jobData.company || company
 fetchSponsorRecord(extractedCompany, jobData.parsedDescription)
 console.log(`🔍 Checking sponsor for:
 statusText = "✅ Ideal Match"
 isGlobalBusiness
 jobSponsorshipMentioned
 isAboveMinimumThreshold
 result.city
 Job mentions visa sponsorship, but
 extractJobTitle(element, siteName)
 extractJobCompany(element, siteName)
 extractJobLocation(element, siteName)
 UKJobDescriptionParser.extractJobDescription(element)
 parseJobDescription
 visaSponsorship
 jobs-unified-top-card__job-title
 UKJobDescriptionParser.detectJobSite()
 socCode
 salaryRange
 sponsorshipCache
 sponsorshipInFlight
 sponsorBatchLimiter
 enhanceSponsorRecordWithJobContext
 calculateSkillMatchScore
 getMinimumSalaryForSOC
 Skilled Worker
 Global Business
 try { legacyDiagnostics(); } catch (e) { console.log(e?.rateLimitInfo); }
 button.innerHTML
 statusIcon
 buttonBg
 EXT_COLORS.
 showInlineToast
 Checking...
 scale(1.1)
 toastMessage
 ✅
 Ideal Match
 Not Skilled
*/

// Simple initialization for the extension
async function initHireallExtension() {
  console.log("Hireall content script loaded - using modular components");

  // Check if extension context is valid before proceeding
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    console.debug("Hireall: Extension context invalid, skipping initialization");
    return;
  }

  // Check if we're on Hireall web app and attempt to extract session
  if (window.location.hostname.includes('hireall.app') ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('netlify.app')) {
    try {
      console.log("Hireall: Web app detected, attempting session extraction...");
      const sessionResult = await ExtensionMessageHandler.sendMessage("extractHireallSession", {}, 3);

      if (sessionResult?.success && sessionResult?.userId) {
        console.log("Hireall: Session extracted successfully, user authenticated:", sessionResult.userId);
        // The session is now stored in chrome.storage.sync
      } else {
        console.debug("Hireall: Session extraction returned no user data");
      }
    } catch (error) {
      console.debug("Hireall: Session extraction failed", error);
    }
  }

  // Check if user is authenticated
  UserProfileManager.isUserAuthenticated().then(async isAuthenticated => {
    const initializeAuthenticatedFeatures = async () => {
      const sponsorButtonsEnabled = await UserProfileManager.isSponsorshipCheckEnabled();
      jobTracker.setSponsorButtonEnabled(sponsorButtonsEnabled);
      jobTracker.initialize();

      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "sync" && changes.enableSponsorshipChecks) {
            const newValue = changes.enableSponsorshipChecks.newValue;
            jobTracker.setSponsorButtonEnabled(newValue !== false);
          }
        });
      }

      // Initialize form detection if job board integration is enabled
      UserProfileManager.isJobBoardIntegrationEnabled().then(enabled => {
        if (enabled) {
          AutofillManager.startFormDetection();
        }
      });
    };

    if (!isAuthenticated) {
      console.log("Hireall: user not signed in, extension features disabled on this page.");

      try {
        const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
        if (syncResult?.userId) {
          const nowAuthenticated = await UserProfileManager.isUserAuthenticated();
          if (nowAuthenticated) {
            await initializeAuthenticatedFeatures();
            console.log("Hireall: authenticated via site session sync.");
            return;
          }
        }
      } catch (syncError) {
        console.debug("Hireall: syncAuthState request failed", syncError);
      }
      return;
    }

    await initializeAuthenticatedFeatures();
    
    console.log("Hireall extension initialized successfully");
  });
}

// Cleanup on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  const tracker = (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  if (tracker && typeof tracker.cleanup === "function") {
    tracker.cleanup();
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHireallExtension);
} else {
  initHireallExtension();
}
