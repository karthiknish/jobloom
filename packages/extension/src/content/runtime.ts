import { ExtensionMessageHandler } from "../components/ExtensionMessageHandler";
import { UserProfileManager } from "../components/UserProfileManager";
import type { JobTracker } from "../components/JobTracker";
import { logger, log } from "../utils/logger";
import { AuthDiagnostics } from "../utils/authDiagnostics";
import { disposeJobTracker } from "../job-tracker/runtime";

let lifecycleRegistered = false;

export function initializeMessageBridge(): void {
  ExtensionMessageHandler.initialize();
}

export function registerLifecycleHooks(jobTracker: JobTracker): void {
  if (lifecycleRegistered) {
    return;
  }

  lifecycleRegistered = true;

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      logger.debug("ContentRuntime", "Page unloading, cleaning up extension resources");
      disposeJobTracker();
    });
  }

  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "updateSponsorshipButtons") {
        logger.info("ContentRuntime", "Received sponsorship button update from popup", {
          enabled: message.enabled,
        });

        if (typeof jobTracker.setSponsorButtonEnabled === "function") {
          jobTracker.setSponsorButtonEnabled(message.enabled);
        }

        sendResponse({ success: true });
      }
      return true;
    });
  }
}

export function exposeDiagnostics(): void {
  if (typeof window === "undefined") {
    return;
  }

  (window as any).hireallDebugAuth = () => {
    console.log("Running HireAll authentication diagnostics...");
    AuthDiagnostics.runDiagnostics().then((diagnostics) => {
      console.group("HireAll Extension Authentication Diagnostics");
      console.log(AuthDiagnostics.formatDiagnostics(diagnostics));
      console.groupEnd();
    });
  };

  (window as any).hireallRepairAuth = async () => {
    console.log("Attempting HireAll authentication repair...");
    const repaired = await AuthDiagnostics.attemptAuthRepair();
    console.log(`Repair ${repaired ? "successful" : "failed"}`);
    if (repaired) {
      console.log("Please refresh the page to complete the repair.");
    }
  };
}

async function performSessionExtraction(): Promise<void> {
  if (
    !window.location.hostname.includes("hireall.app") &&
    !window.location.hostname.includes("vercel.app") &&
    !window.location.hostname.includes("netlify.app")
  ) {
    logger.debug("ContentRuntime", "Non-Hireall site detected, checking for Hireall tabs for auth sync");
    try {
      const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
      if (syncResult?.userId) {
        logger.info("ContentRuntime", "Authentication synced from Hireall tab", {
          userId: syncResult.userId,
        });

        const { acquireIdToken } = await import("../authToken");
        const testToken = await acquireIdToken();
        if (testToken) {
          logger.info("ContentRuntime", "Token acquisition successful after auth sync");
        } else {
          logger.warn("ContentRuntime", "Token acquisition still failing after auth sync");
        }
      } else {
        logger.debug("ContentRuntime", "No active Hireall authentication found");
      }
    } catch (error) {
      logger.debug("ContentRuntime", "Auth sync attempt failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  logger.info("ContentRuntime", "Web app detected, attempting session extraction...");
  try {
    const sessionResult = await ExtensionMessageHandler.sendMessage("extractHireallSession", {}, 3);

    if (sessionResult?.success && sessionResult?.userId) {
      log.extension("Session extracted successfully", {
        userId: sessionResult.userId,
        hasToken: !!sessionResult.token,
      });

      const { acquireIdToken } = await import("../authToken");
      const testToken = await acquireIdToken();
      if (testToken) {
        logger.info("ContentRuntime", "Token acquisition successful after session extraction");
      } else {
        logger.warn("ContentRuntime", "Token acquisition still failing after session extraction");
      }
    } else {
      logger.debug("ContentRuntime", "Session extraction returned no user data", {
        success: sessionResult?.success,
        hasUserId: !!sessionResult?.userId,
      });
    }
  } catch (error) {
    logger.debug("ContentRuntime", "Session extraction failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function ensureAuthenticatedFeatures(jobTracker: JobTracker): Promise<void> {
  const initializeFeatures = async () => {
    logger.info("ContentRuntime", "Initializing authenticated features");

    try {
      const { acquireIdToken, clearStaleAuthState } = await import("../authToken");
      
      // Use isAuthenticatedContext: true since we believe user is authenticated
      const testToken = await acquireIdToken(false, { isAuthenticatedContext: true });

      if (!testToken) {
        logger.warn("ContentRuntime", "User appears authenticated but token acquisition failed", {
          hostname: window.location.hostname,
          isHireallSite: window.location.hostname.includes("hireall")
        });

        // Try syncing auth state from an open HireAll tab
        try {
          logger.debug("ContentRuntime", "Attempting auth sync from HireAll tabs");
          const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
          
          if (syncResult?.userId) {
            logger.info("ContentRuntime", "Auth sync returned userId, retrying token acquisition", {
              userId: syncResult.userId
            });
            
            const retestToken = await acquireIdToken(true, { isAuthenticatedContext: true });
            if (!retestToken) {
              logger.error("ContentRuntime", "Failed to acquire token even after auth sync - clearing stale state", {
                userId: syncResult.userId,
              });
              // Clear stale auth state since sync returned user but token still fails
              await clearStaleAuthState();
              return;
            }
            
            logger.info("ContentRuntime", "Token acquired successfully after auth sync");
          } else {
            logger.debug("ContentRuntime", "Auth sync returned no userId - user may not be signed into web app");
            // Clear stale extension auth state since web app has no user
            await clearStaleAuthState();
            return;
          }
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
          logger.error("ContentRuntime", "Auth sync failed during token verification", {
            error: errorMessage,
            errorType: syncError instanceof Error ? syncError.name : typeof syncError
          });
          return;
        }
      }

      logger.info("ContentRuntime", "Token verification successful, enabling features");
    } catch (tokenError) {
      logger.error("ContentRuntime", "Token verification failed", {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
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
          logger.info("ContentRuntime", "Sponsorship check setting changed", {
            enabled: newValue !== false,
          });
        }
      });
    }

    const boardIntegrationEnabled = await UserProfileManager.isJobBoardIntegrationEnabled();
    if (boardIntegrationEnabled) {
      logger.info("ContentRuntime", "Job board integration enabled");
    } else {
      logger.debug("ContentRuntime", "Job board integration disabled");
    }
  };

  const isAuthenticated = await UserProfileManager.isUserAuthenticated();

  if (!isAuthenticated) {
    logger.info("ContentRuntime", "User not signed in, extension features disabled", {
      url: window.location.href,
    });

    try {
      const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
      if (syncResult?.userId) {
        const nowAuthenticated = await UserProfileManager.isUserAuthenticated();
        if (nowAuthenticated) {
          await initializeFeatures();
          logger.info("ContentRuntime", "Authenticated via site session sync", {
            userId: syncResult.userId,
          });
          return;
        }
      }
    } catch (syncError) {
      logger.debug("ContentRuntime", "syncAuthState request failed", {
        error: syncError instanceof Error ? syncError.message : String(syncError),
      });
    }

    return;
  }

  await initializeFeatures();

  log.extension("Extension initialized successfully", {
    authenticated: true,
    url: window.location.href,
  });
}

export async function initializeContentRuntime(jobTracker: JobTracker): Promise<void> {
  log.extension("Content script loaded - initializing runtime", {
    url: window.location.href,
    hostname: window.location.hostname,
  });

  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    logger.warn("ContentRuntime", "Extension context invalid, skipping initialization", {
      chromeDefined: typeof chrome !== "undefined",
      runtimeId: chrome?.runtime?.id,
    });
    return;
  }

  await performSessionExtraction();
  await ensureAuthenticatedFeatures(jobTracker);
}
