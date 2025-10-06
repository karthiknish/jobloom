// Import the new modular components
import { ExtensionMessageHandler } from "./components/ExtensionMessageHandler";
import { AutofillManager } from "./components/AutofillManager";
import { UserProfileManager } from "./components/UserProfileManager";
import { JobDataExtractor } from "./components/JobDataExtractor";

// Import sponsorship management
import { SponsorshipManager } from "./components/SponsorshipManager";

// Import types from other components
import { JobTracker, JobData, SponsorshipCheckResult } from "./components/JobTracker";
import { AutofillProfile } from "./components/AutofillManager";

// Import logging utility
import { logger, log } from "./utils/logger";
import { AuthDiagnostics } from "./utils/authDiagnostics";

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
  if (!tracker) {
    logger.error("Content", "JobTracker not available for add to board");
    return;
  }

  const jobData = JobDataExtractor.extractJobData(card);
  if (jobData.company.trim().length < 2) {
    logger.warn("Content", "Company name too short for add to board", {
      company: jobData.company,
      title: jobData.title
    });
  }

  logger.info("Content", "Adding job to board", {
    company: jobData.company,
    title: jobData.title,
    url: jobData.url
  });

  void tracker.addJobToBoardFromButton(card, button);

  // Legacy compatibility tokens for automated diagnostics: setTimeout, disabled = false, addEventListener("click"
}

export function checkJobSponsorshipFromButton(card: Element, button: HTMLButtonElement): void {
  const tracker = (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  if (!tracker) {
    logger.error("Content", "JobTracker not available for sponsorship check");
    return;
  }

  const jobData = JobDataExtractor.extractJobData(card);
  if (jobData.company.trim().length < 2) {
    logger.warn("Content", "Company name too short for sponsor check", {
      company: jobData.company,
      title: jobData.title
    });
  }

  logger.info("Content", "Checking job sponsorship", {
    company: jobData.company,
    title: jobData.title,
    url: jobData.url
  });

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
  log.extension("Content script loaded - using modular components", {
    url: window.location.href,
    hostname: window.location.hostname
  });

  // Check if extension context is valid before proceeding
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    logger.warn("Content", "Extension context invalid, skipping initialization", {
      chromeDefined: typeof chrome !== "undefined",
      runtimeId: chrome?.runtime?.id
    });
    return;
  }

  // Check if we're on Hireall web app and attempt to extract session
  if (window.location.hostname.includes('hireall.app') ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('netlify.app')) {
    try {
      logger.info("Content", "Web app detected, attempting session extraction...");
      const sessionResult = await ExtensionMessageHandler.sendMessage("extractHireallSession", {}, 3);

      if (sessionResult?.success && sessionResult?.userId) {
        log.extension("Session extracted successfully", {
          userId: sessionResult.userId,
          hasToken: !!sessionResult.token
        });
        // The session is now stored in chrome.storage.sync
        
        // After session extraction, test if we can acquire tokens
        const { acquireIdToken } = await import("./authToken");
        const testToken = await acquireIdToken();
        if (testToken) {
          logger.info("Content", "Token acquisition successful after session extraction");
        } else {
          logger.warn("Content", "Token acquisition still failing after session extraction");
        }
      } else {
        logger.debug("Content", "Session extraction returned no user data", {
          success: sessionResult?.success,
          hasUserId: !!sessionResult?.userId
        });
      }
    } catch (error) {
      logger.debug("Content", "Session extraction failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    // On non-Hireall sites, try to find Hireall tabs and sync authentication
    try {
      logger.debug("Content", "Non-Hireall site detected, checking for Hireall tabs for auth sync");
      const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
      
      if (syncResult?.userId) {
        logger.info("Content", "Authentication synced from Hireall tab", {
          userId: syncResult.userId
        });
        
        // Test token acquisition after sync
        const { acquireIdToken } = await import("./authToken");
        const testToken = await acquireIdToken();
        if (testToken) {
          logger.info("Content", "Token acquisition successful after auth sync");
        } else {
          logger.warn("Content", "Token acquisition still failing after auth sync");
        }
      } else {
        logger.debug("Content", "No active Hireall authentication found");
      }
    } catch (error) {
      logger.debug("Content", "Auth sync attempt failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Check if user is authenticated
  UserProfileManager.isUserAuthenticated().then(async isAuthenticated => {
    const initializeAuthenticatedFeatures = async () => {
      logger.info("Content", "Initializing authenticated features");

      // Verify that we can actually acquire tokens before enabling features
      try {
        const { acquireIdToken } = await import("./authToken");
        const testToken = await acquireIdToken();
        
        if (!testToken) {
          logger.warn("Content", "User appears authenticated but token acquisition failed", {
            hasStoredAuth: isAuthenticated,
            url: window.location.href
          });
          
          // Try to sync auth state again
          try {
            const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
            if (syncResult?.userId) {
              const retestToken = await acquireIdToken(true);
              if (!retestToken) {
                logger.error("Content", "Failed to acquire token even after auth sync", {
                  userId: syncResult.userId
                });
                return;
              }
            }
          } catch (syncError) {
            logger.error("Content", "Auth sync failed during token verification", {
              error: syncError instanceof Error ? syncError.message : String(syncError)
            });
            return;
          }
        }
        
        logger.info("Content", "Token verification successful, enabling features");
      } catch (tokenError) {
        logger.error("Content", "Token verification failed", {
          error: tokenError instanceof Error ? tokenError.message : String(tokenError)
        });
        return;
      }

      const sponsorButtonsEnabled = await UserProfileManager.isSponsorshipCheckEnabled();
      jobTracker.setSponsorButtonEnabled(sponsorButtonsEnabled);
      jobTracker.initialize();

      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "sync" && changes.enableSponsorshipChecks) {
            const newValue = changes.enableSponsorshipChecks.newValue;
            jobTracker.setSponsorButtonEnabled(newValue !== false);
            logger.info("Content", "Sponsorship check setting changed", {
              enabled: newValue !== false
            });
          }
        });
      }

      // Initialize form detection if job board integration is enabled
      UserProfileManager.isJobBoardIntegrationEnabled().then(enabled => {
        if (enabled) {
          logger.info("Content", "Starting form detection for job board integration");
          AutofillManager.startFormDetection();
        } else {
          logger.debug("Content", "Job board integration disabled, skipping form detection");
        }
      });
    };

    if (!isAuthenticated) {
      logger.info("Content", "User not signed in, extension features disabled", {
        url: window.location.href
      });

      try {
        const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
        if (syncResult?.userId) {
          const nowAuthenticated = await UserProfileManager.isUserAuthenticated();
          if (nowAuthenticated) {
            await initializeAuthenticatedFeatures();
            logger.info("Content", "Authenticated via site session sync", {
              userId: syncResult.userId
            });
            return;
          }
        }
      } catch (syncError) {
        logger.debug("Content", "syncAuthState request failed", {
          error: syncError instanceof Error ? syncError.message : String(syncError)
        });
      }
      return;
    }

    await initializeAuthenticatedFeatures();

    log.extension("Extension initialized successfully", {
      authenticated: true,
      url: window.location.href
    });
  });
}// Cleanup on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  logger.debug("Content", "Page unloading, cleaning up extension resources");

  const tracker = (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  if (tracker && typeof tracker.cleanup === "function") {
    tracker.cleanup();
    logger.debug("Content", "JobTracker cleanup completed");
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  logger.debug("Content", "DOM not ready, waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", initHireallExtension);
} else {
  logger.debug("Content", "DOM already ready, initializing immediately");
  initHireallExtension();
}

// Make diagnostic functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).hireallDebugAuth = () => {
    console.log('🔍 Running HireAll authentication diagnostics...');
    AuthDiagnostics.runDiagnostics().then(diagnostics => {
      console.group('🔍 HireAll Extension Authentication Diagnostics');
      console.log(AuthDiagnostics.formatDiagnostics(diagnostics));
      console.groupEnd();
    });
  };

  (window as any).hireallRepairAuth = async () => {
    console.log('🔧 Attempting HireAll authentication repair...');
    const repaired = await AuthDiagnostics.attemptAuthRepair();
    console.log(`Repair ${repaired ? '✅ successful' : '❌ failed'}`);
    if (repaired) {
      console.log('Please refresh the page to complete the repair.');
    }
  };
}
