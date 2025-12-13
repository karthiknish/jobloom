import { initializeJobTracker } from "../job-tracker/runtime";
import { logger } from "../utils/logger";
import { isLocalStorageAvailable } from "../utils/safeLocalStorage";
import {
  exposeDiagnostics,
  initializeContentRuntime,
  initializeMessageBridge,
  registerLifecycleHooks,
} from "./runtime";
import { registerControlDiagnostics } from "./controls";

export function bootstrapContentScript(): void {
  // Check for sandboxed context first using the safe check
  if (!isLocalStorageAvailable()) {
    logger.warn("ContentBootstrap", "Running in sandboxed context (localStorage blocked). Extension features disabled.");
    return;
  }

  initializeMessageBridge();
  const jobTracker = initializeJobTracker();

  registerLifecycleHooks(jobTracker);
  exposeDiagnostics();
  registerControlDiagnostics();

  const start = () => {
    initializeContentRuntime(jobTracker).catch((error) => {
      logger.error("ContentBootstrap", "Failed to initialize content runtime", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  };

  if (document.readyState === "loading") {
    logger.debug("ContentBootstrap", "DOM not ready, waiting for DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", start);
  } else {
    logger.debug("ContentBootstrap", "DOM ready, initializing immediately");
    start();
  }
}
