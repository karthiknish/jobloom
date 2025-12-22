import { UnifiedJobParser } from "../../parsers";
import type { JobTracker } from "../../components/JobTracker";
import { getJobTracker } from "../../job-tracker/runtime";
import { logger, log } from "../../utils/logger";

export const HIREALL_BUTTON_CLASSES = {
  add: "hireall-add-to-board",
  sponsor: "hireall-check-sponsorship",
};

function resolveTracker(): JobTracker | null {
  const tracker = getJobTracker();
  if (!tracker) {
    logger.error("ContentControls", "JobTracker not available");
  }
  return tracker;
}

export async function addJobToBoard(card: Element, button: HTMLButtonElement): Promise<void> {
  const tracker = resolveTracker();
  if (!tracker) return;

  const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);
  if (!jobData || jobData.company.trim().length < 2) {
    logger.warn("ContentControls", "Company name too short for add to board", {
      company: jobData?.company,
      title: jobData?.title,
    });
  }

  logger.info("ContentControls", "Adding job to board", {
    company: jobData?.company,
    title: jobData?.title,
    url: jobData?.url,
  });

  void tracker.addJobToBoardFromButton(card, button);
}

export async function checkJobSponsorshipFromButton(
  card: Element,
  button: HTMLButtonElement
): Promise<void> {
  const tracker = resolveTracker();
  if (!tracker) return;

  const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);
  if (!jobData || jobData.company.trim().length < 2) {
    logger.warn("ContentControls", "Company name too short for sponsor check", {
      company: jobData?.company,
      title: jobData?.title,
    });
  }

  logger.info("ContentControls", "Checking job sponsorship", {
    company: jobData?.company,
    title: jobData?.title,
    url: jobData?.url,
  });

  void tracker.checkJobSponsorshipFromButton(card, button);
}

export function registerControlDiagnostics(): void {
  log.extension("Content controls registered", {
    hasTracker: !!getJobTracker(),
  });
}
