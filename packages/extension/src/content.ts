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

bootstrapContentScript();
