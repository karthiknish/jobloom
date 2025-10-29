import { initializeJobTracker } from "../job-tracker/runtime";
import { logger } from "../utils/logger";
import {
  exposeDiagnostics,
  initializeContentRuntime,
  initializeMessageBridge,
  registerLifecycleHooks,
} from "./runtime";
import { registerControlDiagnostics } from "./controls";

export function bootstrapContentScript(): void {
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
