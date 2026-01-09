import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";
import { JobDataExtractor } from "./JobDataExtractor";
import {
  SponsorshipManager,
  type SponsorshipRecord,
  type UkEligibilityAssessment,
} from "./SponsorshipManager";
import { EnhancedJobBoardManager } from "../enhancedAddToBoard";
import { UnifiedJobParser, type JobData as EnhancedJobData } from "../parsers";
import { isLikelyPlaceholderCompany, normalizeCompanyName, type SalaryInfo } from "@hireall/shared";
import { QuickNotes } from "./QuickNotes";
import { JobEditModal } from "./JobEditModal";

export interface SponsorshipCheckResult {
  company: string;
  source: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  status: "success" | "error";
  confidence: number;
  matchedName?: string | null;
  sponsorData?: SponsorshipRecord | null;
  ukEligibility?: UkEligibilityAssessment;
  jobContext?: EnhancedJobData;
}

interface HighlightEntry {
  card: Element;
  badge: HTMLElement;
}

/**
 * Helper to check if salary is structured SalaryInfo
 */
function isSalaryInfo(salary: any): salary is SalaryInfo {
  return salary !== null && typeof salary === 'object' && 'currency' in salary;
}

export class JobTracker {
  private readonly highlightClass = "hireall-sponsored-highlight";
  private readonly badgeClass = "hireall-sponsored-badge";
  private readonly controlsClass = "hireall-job-controls";
  private readonly trackedBadges = new Map<Element, HighlightEntry>();
  private readonly sponsorCache = new Map<string, SponsorshipCheckResult>();
  private processedCards = new WeakSet<Element>();

  private observer: MutationObserver | null = null;
  private mutationTimeout: number | null = null;
  private updateCardsTimeout: number | null = null;
  private cleanupInterval: number | null = null;
  private isChecking = false;
  private isHighlighting = false;
  private sponsorButtonsEnabled = true;

  private abortController = new AbortController();

  constructor() {
    this.ensureStyles();
  }

  /**
   * Check if the extension context is still valid
   */
  private isExtensionValid(): boolean {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id && !!chrome.storage;
  }

  private buildSponsorshipCacheKey(company: string, jobContext?: EnhancedJobData): string {
    const parts = [company.toLowerCase().trim()];
    if (jobContext?.socCode) {
      parts.push(jobContext.socCode);
    }
    if (isSalaryInfo(jobContext?.salary)) {
      if (typeof jobContext.salary.min === "number") {
        parts.push(`min:${jobContext.salary.min}`);
      }
      if (typeof jobContext.salary.max === "number" && jobContext.salary.max !== jobContext.salary.min) {
        parts.push(`max:${jobContext.salary.max}`);
      }
    }
    return parts.join("|");
  }

  private async buildJobDescriptionData(jobData: EnhancedJobData, card?: Element): Promise<EnhancedJobData | undefined> {
    const extracted = await UnifiedJobParser.extractJobFromPage(document, window.location.href);
    if (!extracted) return undefined;

    // Merge with card-specific data if provided
    if (jobData.company) extracted.company = jobData.company;
    if (jobData.title) extracted.title = jobData.title;

    return extracted;
  }

  destroy(): void {
    this.abortController.abort();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.mutationTimeout) window.clearTimeout(this.mutationTimeout);
    if (this.updateCardsTimeout) window.clearTimeout(this.updateCardsTimeout);
    if (this.cleanupInterval) window.clearInterval(this.cleanupInterval);
    console.debug("Hireall: JobTracker destroyed and cleaned up");
  }

  initialize(): void {
    // Check if extension context is valid
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.debug("HireAll: Extension context invalid, skipping JobTracker initialization");
      return;
    }

    this.updateCards();

    this.observer = new MutationObserver(() => {
      // Throttle updateCards calls to prevent excessive processing
      if (this.updateCardsTimeout) window.clearTimeout(this.updateCardsTimeout);
      this.updateCardsTimeout = window.setTimeout(() => {
        this.updateCards();
        this.updateCardsTimeout = null;
      }, 100);

      if (!this.isHighlighting || this.isChecking) return;
      if (this.mutationTimeout) window.clearTimeout(this.mutationTimeout);
      this.mutationTimeout = window.setTimeout(() => {
        this.checkAndHighlightSponsoredJobs().catch((error) => {
          console.error("HireAll: failed to refresh highlights", error);
        });
      }, 300);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Periodic cleanup to prevent memory leaks
    this.cleanupInterval = window.setInterval(() => {
      // WeakSet automatically cleans up, but we can recreate it periodically
      // to ensure we don't hold references to detached DOM elements
      this.processedCards = new WeakSet<Element>();
      console.debug("Hireall: Periodic WeakSet cleanup performed");
    }, 300000); // Every 5 minutes
  }

  async checkAndHighlightSponsoredJobs(): Promise<void> {
    if (this.isChecking) {
      console.debug("Hireall: Sponsorship check already in progress, skipping");
      return;
    }

    this.isChecking = true;
    console.debug("Hireall: Starting sponsorship check and highlighting");

    try {
      const cards = JobDataExtractor.findJobCards();
      if (cards.length === 0) {
        UIComponents.showToast("No job cards detected on this page", { type: "warning" });
        console.debug("Hireall: No job cards found on page");
        return;
      }

      console.debug(`Hireall: Found ${cards.length} job cards, checking sponsorship`);
      let sponsoredCount = 0;

      for (const card of cards) {
        this.ensureCardControls(card);
        const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);

        if (!jobData || !jobData.company || isLikelyPlaceholderCompany(jobData.company)) {
          console.debug("Hireall: Skipping sponsorship check (missing company)", {
            title: jobData?.title,
            company: jobData?.company,
          });
          continue;
        }

        const result = await this.checkSponsorship(jobData, card);

        if (result.isSponsored) {
          sponsoredCount += 1;
          this.highlightCard(card, result);
        }
      }

      if (sponsoredCount === 0) {
        UIComponents.showToast("No sponsored roles detected", { type: "info" });
        this.isHighlighting = false;
        console.debug("Hireall: No sponsored roles found");
        return;
      }

      UIComponents.showToast(`Highlighted ${sponsoredCount} sponsored role${sponsoredCount > 1 ? "s" : ""}`, {
        type: "success",
      });

      this.isHighlighting = true;
      console.debug(`Hireall: Successfully highlighted ${sponsoredCount} sponsored roles`);
    } catch (error) {
      console.error("Hireall: sponsorship check failed", error);
      UIComponents.showToast("Unable to check sponsorship right now", { type: "error" });
      this.isHighlighting = false;
    } finally {
      this.isChecking = false;
    }
  }

  clearHighlights(): void {
    this.trackedBadges.forEach(({ card, badge }) => {
      card.classList.remove(this.highlightClass);
      // Remove border styling
      if (card instanceof HTMLElement) {
        card.style.border = '';
        card.style.borderRadius = '';
        card.style.boxShadow = '';
      }
      if (badge.parentElement) {
        badge.parentElement.removeChild(badge);
      }
    });

    this.trackedBadges.clear();
    this.isHighlighting = false;
  }

  setSponsorButtonEnabled(enabled: boolean): void {
    if (this.sponsorButtonsEnabled === enabled) return;
    this.sponsorButtonsEnabled = enabled;
    this.refreshCardControls();
  }

  setOverlayEnabled(enabled: boolean): void {
    const controls = document.querySelectorAll<HTMLDivElement>(`.${this.controlsClass}`);
    controls.forEach(control => {
      control.style.display = enabled ? 'flex' : 'none';
    });

    // Also hide badge elements if overlay is disabled
    const badges = document.querySelectorAll<HTMLElement>(`.${this.badgeClass}`);
    badges.forEach(badge => {
      badge.style.display = enabled ? 'inline-flex' : 'none';
    });

    console.debug('Hireall: Overlay visibility updated:', enabled);
  }

  private async checkSponsorship(jobData: EnhancedJobData, card?: Element): Promise<SponsorshipCheckResult> {
    const normalizedCompany = normalizeCompanyName(jobData.company);
    if (!normalizedCompany || isLikelyPlaceholderCompany(normalizedCompany)) {
      return {
        company: jobData.company,
        source: jobData.source,
        isSponsored: false,
        sponsorshipType: null,
        status: "error",
        confidence: 0,
        matchedName: null,
        sponsorData: null,
      };
    }

    jobData.company = normalizedCompany;

    const jobContext = await this.buildJobDescriptionData(jobData, card);
    const cacheKey = this.buildSponsorshipCacheKey(jobData.company, jobContext);
    const cached = this.sponsorCache.get(cacheKey);
    if (cached) {
      console.debug("Hireall: Using cached sponsorship result for", jobData.company);
      return cached;
    }

    console.debug("Hireall: Checking sponsorship for", {
      company: jobData.company,
      title: jobData.title,
      hasJobContext: !!jobContext,
      cacheKey
    });

    try {
      // Don't fail fast with an artificial timeout here.
      // The API client already has a request timeout, and auth acquisition may add overhead.
      // Instead, log when a lookup is slow so we can diagnose real latency without breaking UX.
      console.debug("Hireall: Starting sponsorship lookup for", jobData.company);
      const lookupStart = Date.now();
      const slowLookupTimer = window.setTimeout(() => {
        const elapsedMs = Date.now() - lookupStart;
        console.warn(`Hireall: sponsor lookup slow (${elapsedMs}ms)`, {
          company: jobData.company,
          elapsedMs,
          cacheKey,
          pageUrl: window.location.href,
        });
      }, 15000);

      const sponsorRecord = await SponsorshipManager.fetchSponsorRecord(jobData.company, jobContext)
        .finally(() => window.clearTimeout(slowLookupTimer));

      console.debug("Hireall: Sponsorship lookup completed for", {
        company: jobData.company,
        elapsedMs: Date.now() - lookupStart,
        hadRecord: !!sponsorRecord,
      });

      let ukEligibility;
      try {
        console.debug("Hireall: Starting UK eligibility assessment for", jobData.company);
        const eligibilityStart = Date.now();
        const slowEligibilityTimer = window.setTimeout(() => {
          const elapsedMs = Date.now() - eligibilityStart;
          console.warn(`Hireall: UK eligibility assessment slow (${elapsedMs}ms)`, {
            company: jobData.company,
            elapsedMs,
            cacheKey,
            pageUrl: window.location.href,
          });
        }, 8000);

        const eligibilityPromise: Promise<UkEligibilityAssessment | null | undefined> = sponsorRecord?.ukEligibility
          ? Promise.resolve(sponsorRecord.ukEligibility)
          : SponsorshipManager.assessUkEligibility(jobContext);

        ukEligibility = await eligibilityPromise.finally(() => window.clearTimeout(slowEligibilityTimer));

        console.debug("Hireall: UK eligibility assessment completed for", jobData.company);
      } catch (ukError) {
        console.debug("UK eligibility assessment failed:", ukError);
        ukEligibility = sponsorRecord?.ukEligibility || null;
      }

      // Determine sponsorship status more intelligently
      let isSponsored = false;
      let sponsorshipType: string | null = null;
      let confidence = 0;

      if (sponsorRecord?.isSponsored) {
        // Company is a verified sponsor
        isSponsored = true;
        sponsorshipType = sponsorRecord.sponsorshipType ?? "Verified Sponsor";
        confidence = 0.9;
      } else if (ukEligibility?.eligible && jobContext?.visaSponsorship?.mentioned !== false) {
        // Job is eligible and sponsorship isn't explicitly excluded
        isSponsored = true;
        sponsorshipType = "Eligible for Sponsorship";
        confidence = 0.7;
      } else if (ukEligibility?.eligible === false) {
        // Job is not eligible
        isSponsored = false;
        sponsorshipType = null;
        confidence = 0.8;
      } else if (sponsorRecord && !sponsorRecord.isSponsored) {
        // Company explicitly not a sponsor
        isSponsored = false;
        sponsorshipType = null;
        confidence = 0.85;
      } else {
        // Unknown status
        isSponsored = false;
        sponsorshipType = null;
        confidence = ukEligibility ? 0.4 : 0.1;
      }

      const result: SponsorshipCheckResult = {
        company: jobData.company,
        source: jobData.source,
        isSponsored,
        sponsorshipType,
        status: "success",
        confidence,
        matchedName: sponsorRecord?.name ?? null,
        sponsorData: sponsorRecord ?? null,
        ukEligibility: ukEligibility || undefined,
        jobContext,
      };

      this.sponsorCache.set(cacheKey, result);
      console.debug("Hireall: Sponsorship check completed", {
        company: jobData.company,
        isSponsored: result.isSponsored,
        confidence: result.confidence,
        hasSponsorData: !!result.sponsorData
      });
      return result;
    } catch (error) {
      console.warn("Hireall: sponsor lookup failed", error);
      // Don't use UK eligibility as fallback on error - it creates false positives
      // Just return error status, not "sponsored"
      const fallback: SponsorshipCheckResult = {
        company: jobData.company,
        source: jobData.source,
        isSponsored: false,
        sponsorshipType: null,
        status: "error",
        confidence: 0,
        jobContext,
      };
      // Don't cache errors - allow retry
      console.debug("Hireall: Sponsor check failed, not caching error result", {
        company: jobData.company,
        error: error instanceof Error ? error.message : String(error)
      });
      return fallback;
    }
  }

  private highlightCard(card: Element, result: SponsorshipCheckResult): void {
    if (!(card instanceof HTMLElement)) return;

    card.classList.add(this.highlightClass);
    card.style.position = card.style.position || "relative";

    // Add border styling based on sponsorship result
    // Green for sponsored, Orange for not sponsored
    const borderColor = result.isSponsored ? EXT_COLORS.success : EXT_COLORS.accentOrange;
    const borderWidth = '3px';
    const borderStyle = 'solid';

    // Apply border with some padding to make it visible
    card.style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
    card.style.borderRadius = 'var(--radius)';
    card.style.padding = card.style.padding || '12px';
    card.style.margin = card.style.margin || '4px';
    card.style.boxShadow = `var(--shadow-md)`;
    card.style.transition = 'transform var(--motion-duration-medium) var(--motion-ease-out), box-shadow var(--motion-duration-medium) var(--motion-ease-out)';

    let badge = card.querySelector<HTMLElement>(`.${this.badgeClass}`);
    if (!badge) {
      badge = document.createElement("div");
      badge.className = this.badgeClass;
      const badgeBgColor = result.isSponsored ? EXT_COLORS.success : EXT_COLORS.accentOrange;
      const badgeShadowColor = result.isSponsored ? 'rgba(5, 150, 105, 0.25)' : 'rgba(249, 115, 22, 0.25)';
      badge.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 10px;
        background: ${badgeBgColor};
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: var(--shadow-md);
        z-index: 2;
      `;
      card.appendChild(badge);
    }

    const icon = UIComponents.createIcon(result.isSponsored ? "flag" : "alertCircle", 14, "#fff");
    const label = result.isSponsored
      ? (result.sponsorshipType ? result.sponsorshipType.replace(/_/g, " ") : "Sponsored")
      : "Not Sponsored";
    const labelParts = [label];
    if (result.ukEligibility?.socCode) {
      const socLabel = result.ukEligibility.socEligibility
        ? `SOC ${result.ukEligibility.socCode} (${result.ukEligibility.socEligibility})`
        : `SOC ${result.ukEligibility.socCode}`;
      labelParts.push(socLabel);
    }
    badge.innerHTML = `${icon}<span>${labelParts.join(" • ")}</span>`;
    if (result.ukEligibility?.reasons?.length) {
      badge.title = result.ukEligibility.reasons.join(" • ");
    }

    this.trackedBadges.set(card, { card, badge });
  }

  private updateCards(): void {
    const cards = JobDataExtractor.findJobCards();
    for (const card of cards) {
      if (!this.processedCards.has(card)) {
        this.ensureCardControls(card);
      }
    }
  }

  private ensureCardControls(card: Element, forceRefresh = false): void {
    if (!(card instanceof HTMLElement)) return;
    if (!forceRefresh && this.processedCards.has(card)) return;

    card.style.position = card.style.position || "relative";

    let controls = card.querySelector<HTMLDivElement>(`.${this.controlsClass}`);
    if (!controls) {
      controls = this.createControlsContainer();
      card.appendChild(controls);
    }

    this.syncControlButtons(controls, card);
    this.processedCards.add(card);
  }

  private createControlsContainer(): HTMLDivElement {
    const controls = document.createElement("div");
    controls.className = this.controlsClass;
    controls.style.cssText = `
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 6px;
      z-index: 3;
    `;
    return controls;
  }

  private createSponsorButton(card: Element): HTMLButtonElement {
    const sponsorButton = document.createElement("button");
    sponsorButton.type = "button";
    sponsorButton.className = "hireall-check-sponsorship";
    sponsorButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: linear-gradient(135deg, ${EXT_COLORS.info}, ${EXT_COLORS.brandBlue});
      color: #fff;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.28);
    `;
    sponsorButton.innerHTML = `${UIComponents.createIcon("flag", 12, "#fff")} <span>Check Sponsor</span>`;
    sponsorButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void this.checkJobSponsorshipFromButton(card, sponsorButton);
    }, { signal: this.abortController.signal });
    return sponsorButton;
  }

  private createAddButton(card: Element): HTMLButtonElement {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "hireall-add-to-board";
    addButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: linear-gradient(135deg, ${EXT_COLORS.success}, ${EXT_COLORS.greenDark});
      color: #fff;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.28);
    `;
    addButton.innerHTML = `${UIComponents.createIcon("clipboardPlus", 12, "#fff")} <span>Add to Board</span>`;
    addButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void this.addJobToBoardFromButton(card, addButton);
    }, { signal: this.abortController.signal });
    return addButton;
  }

  private createNoteButton(card: Element): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hireall-quick-note-btn";
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      background: rgba(107, 114, 128, 0.8);
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    `;
    button.innerHTML = `${UIComponents.createIcon("edit3", 12, "#fff")} <span>Note</span>`;
    button.title = "Add a quick note";

    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      // Get job data for this card
      const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);
      if (!jobData) {
        UIComponents.showToast("Failed to get job data", { type: "error" });
        return;
      }

      // Create a temporary ID if job hasn't been saved yet
      const jobId = (jobData as any).id || `temp-${Date.now()}`;

      // Create and show quick notes
      const quickNotes = new QuickNotes(jobId, "", {
        onSave: (note) => {
          // Update button appearance
          button.style.background = note ? EXT_COLORS.warning : 'rgba(107, 114, 128, 0.8)';
          button.innerHTML = note
            ? `${UIComponents.createIcon("fileText", 12, "#fff")} <span>Note</span>`
            : `${UIComponents.createIcon("edit3", 12, "#fff")} <span>Note</span>`;
        }
      });

      // Toggle the panel
      const panel = button.parentElement?.querySelector(".hireall-quick-notes-panel");
      if (panel) {
        panel.remove();
      } else {
        // Create button that toggles
        const noteBtn = quickNotes.createButton();
        noteBtn.click(); // Trigger the panel to open
        // Replace our button with the QuickNotes button
        button.replaceWith(noteBtn);
      }
    }, { signal: this.abortController.signal });

    return button;
  }

  private createEditButton(card: Element): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hireall-edit-job-btn";
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      cursor: pointer;
      background: rgba(107, 114, 128, 0.15);
      color: #6b7280;
      transition: all 0.2s ease;
    `;
    button.innerHTML = UIComponents.createIcon("edit2", 14, "#6b7280");
    button.title = "Edit job details";

    button.addEventListener("mouseenter", () => {
      button.style.background = EXT_COLORS.info;
      button.innerHTML = UIComponents.createIcon("edit2", 14, "#fff");
    }, { signal: this.abortController.signal });

    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(107, 114, 128, 0.15)";
      button.innerHTML = UIComponents.createIcon("edit2", 14, "#6b7280");
    }, { signal: this.abortController.signal });

    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      // Get job data for this card
      const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);
      if (!jobData) {
        UIComponents.showToast("Failed to get job data", { type: "error" });
        return;
      }

      // Create edit modal
      const modal = new JobEditModal(
        {
          id: (jobData as any).id || `temp-${Date.now()}`,
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          salary: isSalaryInfo(jobData.salary) ? (jobData.salary.original || "") : (jobData.salary || ""),
          status: "interested",
        },
        (updatedData) => {
          // Optionally refresh the card display
          UIComponents.showToast("Job details updated", { type: "success" });
        }
      );

      modal.show();
    }, { signal: this.abortController.signal });

    return button;
  }

  private syncControlButtons(controls: HTMLDivElement, card: Element): void {
    // Add button (always present)
    let addButton = controls.querySelector<HTMLButtonElement>(".hireall-add-to-board");
    if (!addButton) {
      addButton = this.createAddButton(card);
      controls.appendChild(addButton);
    }

    // Sponsor button (conditional)
    const existingSponsor = controls.querySelector<HTMLButtonElement>(".hireall-check-sponsorship");
    if (this.sponsorButtonsEnabled) {
      if (!existingSponsor) {
        const sponsorButton = this.createSponsorButton(card);
        controls.insertBefore(sponsorButton, addButton);
      }
    } else if (existingSponsor) {
      existingSponsor.remove();
    }

    // Note button (new)
    if (!controls.querySelector<HTMLButtonElement>(".hireall-quick-note-btn")) {
      const noteButton = this.createNoteButton(card);
      controls.appendChild(noteButton);
    }

    // Edit button (new)
    if (!controls.querySelector<HTMLButtonElement>(".hireall-edit-job-btn")) {
      const editButton = this.createEditButton(card);
      controls.appendChild(editButton);
    }
  }

  private refreshCardControls(): void {
    const cards = JobDataExtractor.findJobCards();
    for (const card of cards) {
      this.ensureCardControls(card, true);
    }
  }

  public async checkJobSponsorshipFromButton(card: Element, button: HTMLButtonElement): Promise<void> {
    // Check if extension context is still valid
    if (!this.isExtensionValid()) {
      console.debug("Hireall: Extension context invalidated, cannot check sponsorship");
      UIComponents.showToast("Extension context invalidated. Please refresh the page.", { type: "error" });
      return;
    }

    const originalLabel = button.innerHTML;
    const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);

    if (!jobData || !jobData.company || jobData.company.length < 2 || isLikelyPlaceholderCompany(jobData.company)) {
      UIComponents.showToast(
        "Couldn't detect the company name for this job. Open the job details and try again.",
        { type: "warning" }
      );
      return;
    }

    button.disabled = true;
    button.innerHTML = `${UIComponents.createIcon("clock", 12, "#fff")} <span>Checking...</span>`;

    try {
      const result = await this.checkSponsorship(jobData, card);
      this.showSponsorToast(jobData, result);

      // Only highlight if we got a valid result (not an error)
      if (result.status !== "error") {
        // Green for sponsored, orange for confirmed not sponsored
        this.highlightCard(card, result);
        // Hide the button after successful check
        button.style.display = 'none';
      } else {
        // Error occurred - restore button so user can retry
        window.setTimeout(() => {
          button.innerHTML = originalLabel;
          button.disabled = false;
        }, 1500);
      }
    } catch (error) {
      console.error("Hireall: sponsor check button failed", error);
      UIComponents.showToast("Sponsor check failed", { type: "error" });
      // Restore button on error so user can retry
      window.setTimeout(() => {
        button.innerHTML = originalLabel;
        button.disabled = false;
      }, 1500);
    }
  }

  public async addJobToBoardFromButton(card: Element, button: HTMLButtonElement): Promise<void> {
    // Check if extension context is still valid
    if (!this.isExtensionValid()) {
      console.debug("Hireall: Extension context invalidated, cannot add job to board");
      UIComponents.showToast("Extension context invalidated. Please refresh the page.", { type: "error" });
      return;
    }

    const originalLabel = button.innerHTML;
    const jobData = await UnifiedJobParser.extractJobFromElement(card, window.location.href);

    if (!jobData) {
      UIComponents.showToast("Failed to extract job data", { type: "error" });
      return;
    }

    const normalizedCompany = normalizeCompanyName(jobData.company);
    const normalizedTitle = (jobData.title || "").replace(/\s+/g, " ").trim();

    if (!normalizedCompany || isLikelyPlaceholderCompany(normalizedCompany) || normalizedCompany.length < 2) {
      UIComponents.showToast(
        "Couldn't detect the company name for this job. Open the job details and try again.",
        { type: "warning" }
      );
      return;
    }

    if (!normalizedTitle || normalizedTitle.length < 2 || normalizedTitle.toLowerCase() === "unknown role") {
      UIComponents.showToast("Missing required job title", { type: "warning" });
      return;
    }

    jobData.company = normalizedCompany;
    jobData.title = normalizedTitle;

    button.disabled = true;
    button.innerHTML = `${UIComponents.createIcon("clock", 12, "#fff")} <span>Adding...</span>`;

    try {
      // Use cached sponsorship result if available (actual check is now in EnhancedJobBoardManager)
      const cacheKey = this.buildSponsorshipCacheKey(normalizedCompany, jobData);
      const cachedSponsor = this.sponsorCache.get(cacheKey);
      if (cachedSponsor?.isSponsored) {
        jobData.isSponsored = true;
        jobData.sponsorshipType = cachedSponsor.sponsorshipType || 'Skilled Worker';
      }

      // Add to board using enhanced manager (handles sponsorship pre-check internally)
      const result = await EnhancedJobBoardManager.getInstance().addToBoard(jobData);

      if (result) {
        button.innerHTML = `${UIComponents.createIcon("checkCircle", 12, "#fff")} <span>Added</span>`;
        // Check if it was a queued job (optimistic)
        if (result.id.startsWith('pending-')) {
          UIComponents.showToast("Job queued for sync (offline)", { type: "info" });
        } else {
          const sponsorNote = result.isSponsored ? " ✓ Sponsored" : "";
          UIComponents.showToast(`Job added to board${sponsorNote}`, { type: "success" });
        }
      } else {
        button.innerHTML = `${UIComponents.createIcon("alertTriangle", 12, "#fff")} <span>Retry</span>`;
        UIComponents.showToast("Failed to add job to board", { type: "warning" });
      }
    } catch (error) {
      console.error("Hireall: add to board failed", error);
      button.innerHTML = `${UIComponents.createIcon("alertTriangle", 12, "#fff")} <span>Error</span>`;
      UIComponents.showToast("Failed to add job to board", { type: "error" });
    } finally {
      window.setTimeout(() => {
        button.innerHTML = originalLabel;
        button.disabled = false;
      }, 2000);
    }
  }

  private showSponsorToast(jobData: EnhancedJobData, result: SponsorshipCheckResult): void {
    if (result.status === "error" && !result.ukEligibility) {
      UIComponents.showToast(`Unable to verify sponsorship for ${jobData.company}`, { type: "error" });
      return;
    }

    const ukSummary = this.buildUkEligibilitySummary(result.ukEligibility);

    if (result.isSponsored) {
      const label = result.sponsorshipType ? result.sponsorshipType.replace(/_/g, " ") : "Sponsor";
      const toastType = result.ukEligibility?.eligible === false ? "warning" : "success";
      const baseMessage = `${jobData.company} is licensed (${label})`;
      const message = ukSummary ? `${baseMessage} • ${ukSummary}` : baseMessage;
      UIComponents.showToast(message, { type: toastType });
      return;
    }

    let message = result.status === "error"
      ? `Unable to verify sponsorship for ${jobData.company}`
      : `${jobData.company} is not in the sponsor registry`;
    let toastType: "info" | "warning" | "error" = result.status === "error" ? "error" : "info";

    if (result.ukEligibility?.eligible) {
      message += " • Job meets Skilled Worker criteria";
    } else if (ukSummary) {
      message += ` • ${ukSummary}`;
      toastType = result.status === "error" ? toastType : "warning";
    }

    UIComponents.showToast(message, { type: toastType });
  }

  private buildUkEligibilitySummary(uk?: UkEligibilityAssessment): string | null {
    if (!uk) return null;

    const parts: string[] = [];

    if (uk.socCode) {
      const socText = uk.socEligibility
        ? `SOC ${uk.socCode} (${uk.socEligibility})`
        : `SOC ${uk.socCode}`;
      parts.push(socText);
    }

    if (uk.meetsSalaryRequirement === false) {
      parts.push("Salary below Skilled Worker minimum");
    } else if (uk.meetsSalaryRequirement) {
      parts.push("Salary meets Skilled Worker minimum");
    } else if (uk.salaryThreshold && !uk.salaryOffered) {
      parts.push(`Requires £${this.formatSalary(uk.salaryThreshold)} per year`);
    }

    if (!uk.eligible && uk.reasons.length) {
      parts.push(uk.reasons[0]);
    }

    return parts.length ? parts.join(" • ") : null;
  }

  private formatSalary(value: number): string {
    return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  }

  /**
   * Cleanup method to prevent memory leaks and crashes
   * Should be called when the extension is unloaded or page changes
   */
  public cleanup(): void {
    // Disconnect MutationObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear any pending timeouts
    if (this.mutationTimeout) {
      window.clearTimeout(this.mutationTimeout);
      this.mutationTimeout = null;
    }

    if (this.updateCardsTimeout) {
      window.clearTimeout(this.updateCardsTimeout);
      this.updateCardsTimeout = null;
    }

    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear highlights and badges
    this.clearHighlights();

    // Clear processed cards (though WeakSet should auto-cleanup)
    // Note: WeakSet doesn't have a clear method, but we can recreate it
    this.processedCards = new WeakSet<Element>();

    // Clear sponsor cache to free memory
    this.sponsorCache.clear();

    console.debug("Hireall: JobTracker cleanup completed");
  }

  private ensureStyles(): void {
    if (document.getElementById("hireall-jobtracker-styles")) return;

    const style = document.createElement("style");
    style.id = "hireall-jobtracker-styles";
    // Note: Border/outline colors are applied dynamically in highlightCard()
    // based on sponsorship status (green for sponsored, orange for not sponsored)
    style.textContent = `
      .${this.highlightClass} {
        border-radius: 12px;
      }
    `;

    document.head.appendChild(style);
  }
}

export type { EnhancedJobData as JobData };
