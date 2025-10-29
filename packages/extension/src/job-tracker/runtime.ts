import { JobTracker } from "../components/JobTracker";
import { logger } from "../utils/logger";

let jobTracker: JobTracker | null = null;

function setGlobalTracker(instance: JobTracker | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (instance) {
    (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker = instance;
  } else {
    delete (window as unknown as { hireallJobTracker?: JobTracker }).hireallJobTracker;
  }
}

export function initializeJobTracker(): JobTracker {
  if (!jobTracker) {
    jobTracker = new JobTracker();
    setGlobalTracker(jobTracker);
    logger.debug("JobTracker", "Initialized job tracker runtime");
  }
  return jobTracker;
}

export function getJobTracker(): JobTracker | null {
  return jobTracker;
}

export function disposeJobTracker(): void {
  if (!jobTracker) {
    return;
  }

  try {
    if (typeof jobTracker.cleanup === "function") {
      jobTracker.cleanup();
      logger.debug("JobTracker", "Cleaned up job tracker instance");
    }
  } catch (error) {
    logger.warn("JobTracker", "Failed to cleanup job tracker", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    jobTracker = null;
    setGlobalTracker(null);
  }
}
