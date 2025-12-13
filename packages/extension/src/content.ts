// Wrap everything in an IIFE with error handling to catch any SecurityErrors
// during module initialization in sandboxed contexts
(function() {
  'use strict';
  
  // Add global error handlers FIRST before any other code
  if (typeof window !== 'undefined') {
    // Handle synchronous errors
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'SecurityError' && 
          event.error?.message?.includes('localStorage')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason?.name === 'SecurityError' && 
          reason?.message?.includes('localStorage')) {
        event.preventDefault();
        return;
      }
    }, true);
  }
})();

import { bootstrapContentScript } from "./content/bootstrap";
import { SponsorshipManager } from "./components/SponsorshipManager";

export { HIREALL_BUTTON_CLASSES, addJobToBoard, checkJobSponsorshipFromButton } from "./content/controls";
export { initializeContentRuntime, initializeMessageBridge } from "./content/runtime";
export { JobTracker, type SponsorshipCheckResult } from "./components/JobTracker";
export type { JobData } from "./job-tracker/types";
export { SponsorshipManager } from "./components/SponsorshipManager";
export { ExtensionMessageHandler } from "./components/ExtensionMessageHandler";
export { UserProfileManager } from "./components/UserProfileManager";
export { createIcon, hexToRgb } from "./job-tracker/icons";

export const fetchSponsorRecord = SponsorshipManager.fetchSponsorRecord.bind(SponsorshipManager);

// Call bootstrap in a try-catch to handle sandboxed context errors
try {
  bootstrapContentScript();
} catch (e) {
  if (e instanceof Error && e.name === 'SecurityError') {
    console.debug('[HireAll] Extension disabled in sandboxed context');
  } else {
    throw e;
  }
}
