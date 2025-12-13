import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";
import { JobDataExtractor, type JobData } from "./JobDataExtractor";
import {
  SponsorshipManager,
  type SponsorshipRecord,
  type UkEligibilityAssessment,
} from "./SponsorshipManager";
import { EnhancedJobBoardManager } from "../enhancedAddToBoard";
import EnhancedJobParser, { type EnhancedJobData } from "../enhancedJobParser";
import { UKJobDescriptionParser, type JobDescriptionData } from "../jobDescriptionParser";
import { isLikelyPlaceholderCompany, normalizeCompanyName } from "../utils/companyName";

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
  jobContext?: JobDescriptionData;
}

interface HighlightEntry {
  card: Element;
  badge: HTMLElement;
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

  constructor() {
    this.ensureStyles();
  }

  /**
   * Check if the extension context is still valid
   */
  private isExtensionValid(): boolean {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id && !!chrome.storage;
  }

  private buildSponsorshipCacheKey(company: string, jobContext?: JobDescriptionData): string {
    const parts = [company.toLowerCase().trim()];
    if (jobContext?.socCode) {
      parts.push(jobContext.socCode);
    }
    if (typeof jobContext?.salary?.min === "number") {
      parts.push(`min:${jobContext.salary.min}`);
    }
    if (typeof jobContext?.salary?.max === "number" && jobContext.salary.max !== jobContext.salary?.min) {
      parts.push(`max:${jobContext.salary.max}`);
    }
    return parts.join("|");
  }

  private async buildJobDescriptionData(jobData: JobData, card?: Element): Promise<JobDescriptionData | undefined> {
    const descriptionText =
      jobData.description ||
      (card instanceof HTMLElement
        ? UKJobDescriptionParser.extractJobDescription(card)
        : UKJobDescriptionParser.extractJobDescription());

    if (!descriptionText || descriptionText.length < 60) {
      return undefined;
    }

    const parsed = await UKJobDescriptionParser.parseJobDescription(
      descriptionText,
      jobData.title,
      jobData.company
    );

    if (!parsed.salary && jobData.salary) {
      const parsedSalary = this.parseSalaryFromText(jobData.salary);
      if (parsedSalary) {
        parsed.salary = parsedSalary;
      }
    }

    parsed.company = jobData.company;
    return parsed;
  }

  private parseSalaryFromText(text: string): JobDescriptionData["salary"] | null {
    const pattern = /£\s?(\d{1,3}(?:,\d{3})*)(?:\s*-\s*£?\s?(\d{1,3}(?:,\d{3})*))?(?:\s*(?:per|a)?\s*(year|annum|month|week|day|hour))?/i;
    const match = text.match(pattern);
    if (!match) {
      return null;
    }

    const min = match[1] ? parseInt(match[1].replace(/,/g, ""), 10) : undefined;
    const maxRaw = match[2] ? parseInt(match[2].replace(/,/g, ""), 10) : undefined;
    const period = (match[3] || "year").toLowerCase().replace("annum", "year");

    if (!min && !maxRaw) {
      return null;
    }

    return {
      min,
      max: maxRaw ?? min,
      currency: "£",
      period,
    };
  }

  initialize(): void {
    // Check if extension context is valid
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.debug("Hireall: Extension context invalid, skipping JobTracker initialization");
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
          console.error("Hireall: failed to refresh highlights", error);
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
        const jobData = JobDataExtractor.extractJobData(card);

        if (!jobData.company || isLikelyPlaceholderCompany(jobData.company)) {
          console.debug("Hireall: Skipping sponsorship check (missing company)", {
            title: jobData.title,
            company: jobData.company,
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

  private async checkSponsorship(jobData: JobData, card?: Element): Promise<SponsorshipCheckResult> {
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
      console.debug("Hireall: Starting sponsorship lookup with 15s timeout for", jobData.company);
      const sponsorRecord = await Promise.race([
        SponsorshipManager.fetchSponsorRecord(jobData.company, jobContext),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error("Sponsorship lookup timeout")), 15000)
        )
      ]);
      console.debug("Hireall: Sponsorship lookup completed for", jobData.company);

      let ukEligibility;
      try {
        console.debug("Hireall: Starting UK eligibility assessment for", jobData.company);
        ukEligibility = await Promise.race([
          sponsorRecord?.ukEligibility || SponsorshipManager.assessUkEligibility(jobContext),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("UK eligibility assessment timeout")), 8000)
          )
        ]);
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
      const ukEligibility = await SponsorshipManager.assessUkEligibility(jobContext);
      const fallback: SponsorshipCheckResult = {
        company: jobData.company,
        source: jobData.source,
        isSponsored: ukEligibility?.eligible ? true : false,
        sponsorshipType: ukEligibility?.eligible ? "Potentially Eligible" : null,
        status: "error",
        confidence: ukEligibility?.eligible ? 0.3 : 0,
        ukEligibility,
        jobContext,
      };
      this.sponsorCache.set(cacheKey, fallback);
      console.debug("Hireall: Using fallback sponsorship result", {
        company: jobData.company,
        isSponsored: fallback.isSponsored,
        hasUkEligibility: !!ukEligibility
      });
      return fallback;
    }
  }

  private highlightCard(card: Element, result: SponsorshipCheckResult): void {
    if (!(card instanceof HTMLElement)) return;

    card.classList.add(this.highlightClass);
    card.style.position = card.style.position || "relative";

    // Add border styling based on sponsorship result
    const borderColor = result.isSponsored ? EXT_COLORS.success : EXT_COLORS.destructive;
    const borderWidth = '3px';
    const borderStyle = 'solid';

    // Apply border with some padding to make it visible
    card.style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
    card.style.borderRadius = '8px';
    card.style.padding = card.style.padding || '12px';
    card.style.margin = card.style.margin || '4px';
    card.style.boxShadow = `0 0 0 1px ${borderColor}20, 0 4px 12px rgba(0, 0, 0, 0.1)`;

    let badge = card.querySelector<HTMLElement>(`.${this.badgeClass}`);
    if (!badge) {
      badge = document.createElement("div");
      badge.className = this.badgeClass;
      badge.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 10px;
        background: ${EXT_COLORS.success};
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 8px 18px rgba(5, 150, 105, 0.25);
        z-index: 2;
      `;
      card.appendChild(badge);
    }

    const icon = UIComponents.createIcon("flag", 14, "#fff");
    const label = result.sponsorshipType ? result.sponsorshipType.replace(/_/g, " ") : "Sponsored";
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
    });
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
    });
    return addButton;
  }

  private syncControlButtons(controls: HTMLDivElement, card: Element): void {
    let addButton = controls.querySelector<HTMLButtonElement>(".hireall-add-to-board");
    if (!addButton) {
      addButton = this.createAddButton(card);
      controls.appendChild(addButton);
    }

    const existingSponsor = controls.querySelector<HTMLButtonElement>(".hireall-check-sponsorship");
    if (this.sponsorButtonsEnabled) {
      if (!existingSponsor) {
        const sponsorButton = this.createSponsorButton(card);
        controls.insertBefore(sponsorButton, addButton);
      }
    } else if (existingSponsor) {
      existingSponsor.remove();
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
    const jobData = JobDataExtractor.extractJobData(card);

    const normalizedCompany = normalizeCompanyName(jobData.company);
    if (!normalizedCompany || normalizedCompany.length < 2 || isLikelyPlaceholderCompany(normalizedCompany)) {
      UIComponents.showToast(
        "Couldn't detect the company name for this job. Open the job details and try again.",
        { type: "warning" }
      );
      return;
    }

    jobData.company = normalizedCompany;

    button.disabled = true;
    button.innerHTML = `${UIComponents.createIcon("clock", 12, "#fff")} <span>Checking...</span>`;

    try {
      const result = await this.checkSponsorship(jobData, card);
      this.showSponsorToast(jobData, result);
      if (result.isSponsored) {
        this.highlightCard(card, result);
      }
    } catch (error) {
      console.error("Hireall: sponsor check button failed", error);
      UIComponents.showToast("Sponsor check failed", { type: "error" });
    } finally {
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
    const jobData = JobDataExtractor.extractJobData(card);

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

    // (Validation performed above)

    button.disabled = true;
    button.innerHTML = `${UIComponents.createIcon("clock", 12, "#fff")} <span>Adding...</span>`;

    try {
      // Prepare data for enhanced parser
      const partialData: Partial<EnhancedJobData> = {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        url: jobData.url,
        description: jobData.description,
        source: jobData.source,
        dateFound: jobData.dateFound,
        isSponsored: jobData.isSponsored,
        sponsorshipType: jobData.sponsorshipType || '',
        salary: jobData.salary ? { 
          original: jobData.salary, 
          currency: 'GBP', 
          period: 'year' // Default assumption, parser might improve this
        } : null
      };

      // Enhance data
      const enhancedData = await EnhancedJobParser.enhanceJobData(partialData, document);
      
      if (!enhancedData) {
        throw new Error("Failed to process job data");
      }

      // Add to board using enhanced manager
      const result = await EnhancedJobBoardManager.getInstance().addToBoard(enhancedData);
      
      if (result) {
        button.innerHTML = `${UIComponents.createIcon("checkCircle", 12, "#fff")} <span>Added</span>`;
        // Check if it was a queued job (optimistic)
        if (result.id.startsWith('pending-')) {
          UIComponents.showToast("Job queued for sync (offline)", { type: "info" });
        } else {
          UIComponents.showToast("Job added to board successfully", { type: "success" });
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

  private showSponsorToast(jobData: JobData, result: SponsorshipCheckResult): void {
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
    style.textContent = `
      .${this.highlightClass} {
        outline: 2px solid ${EXT_COLORS.success} !important;
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.25) !important;
        border-radius: 12px;
      }
    `;

    document.head.appendChild(style);
  }
}

export type { JobData } from "./JobDataExtractor";
