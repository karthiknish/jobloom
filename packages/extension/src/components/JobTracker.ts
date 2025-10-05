import { EXT_COLORS } from "../theme";
import { UIComponents } from "./UIComponents";
import { JobDataExtractor, type JobData } from "./JobDataExtractor";
import {
  SponsorshipManager,
  type SponsorshipRecord,
  type UkEligibilityAssessment,
} from "./SponsorshipManager";
import { JobBoardManager } from "../addToBoard";
import { UKJobDescriptionParser, type JobDescriptionData } from "../jobDescriptionParser";

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
  private readonly processedCards = new WeakSet<Element>();

  private toggleButton: HTMLButtonElement | null = null;
  private observer: MutationObserver | null = null;
  private mutationTimeout: number | null = null;
  private isChecking = false;
  private isHighlighting = false;
  private sponsorButtonsEnabled = true;

  constructor() {
    this.ensureStyles();
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

  private buildJobDescriptionData(jobData: JobData, card?: Element): JobDescriptionData | undefined {
    const descriptionText =
      jobData.description ||
      (card instanceof HTMLElement
        ? UKJobDescriptionParser.extractJobDescription(card)
        : UKJobDescriptionParser.extractJobDescription());

    if (!descriptionText || descriptionText.length < 60) {
      return undefined;
    }

    const parsed = UKJobDescriptionParser.parseJobDescription(
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
    if (this.toggleButton) return;

    this.toggleButton = UIComponents.createFloatingButton({
      id: "hireall-sponsor-toggle",
      label: "Check Sponsored Jobs",
      icon: UIComponents.createIcon("target", 16),
      variant: "primary",
      onClick: () => this.handleToggle(),
      position: { top: 140, right: 24 },
    });

    this.updateCards();

    this.observer = new MutationObserver(() => {
      this.updateCards();
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
  }

  async handleToggle(): Promise<void> {
    if (this.isChecking) return;

    if (this.isHighlighting) {
      this.clearHighlights();
      UIComponents.showToast("Sponsor highlights cleared", { type: "info" });
      return;
    }

    await this.checkAndHighlightSponsoredJobs();
  }

  async checkAndHighlightSponsoredJobs(): Promise<void> {
    if (this.isChecking) return;

    this.isChecking = true;
    this.updateToggleState("Checking…", true);

    try {
      const cards = JobDataExtractor.findJobCards();
      if (cards.length === 0) {
        UIComponents.showToast("No job cards detected on this page", { type: "warning" });
        return;
      }

      let sponsoredCount = 0;

      for (const card of cards) {
        this.ensureCardControls(card);
        const jobData = JobDataExtractor.extractJobData(card);
        const result = await this.checkSponsorship(jobData, card);

        if (result.isSponsored) {
          sponsoredCount += 1;
          this.highlightCard(card, result);
        }
      }

      if (sponsoredCount === 0) {
        UIComponents.showToast("No sponsored roles detected", { type: "info" });
        this.updateToggleState("Check Sponsored Jobs", false);
        this.isHighlighting = false;
        return;
      }

      UIComponents.showToast(`Highlighted ${sponsoredCount} sponsored role${sponsoredCount > 1 ? "s" : ""}`, {
        type: "success",
      });

      this.updateToggleState("Clear Highlights", false, "danger");
      this.isHighlighting = true;
    } catch (error) {
      console.error("Hireall: sponsorship check failed", error);
      UIComponents.showToast("Unable to check sponsorship right now", { type: "error" });
      this.updateToggleState("Check Sponsored Jobs", false);
      this.isHighlighting = false;
    } finally {
      this.isChecking = false;
    }
  }

  clearHighlights(): void {
    this.trackedBadges.forEach(({ card, badge }) => {
      card.classList.remove(this.highlightClass);
      if (badge.parentElement) {
        badge.parentElement.removeChild(badge);
      }
    });

    this.trackedBadges.clear();
    this.updateToggleState("Check Sponsored Jobs", false);
    this.isHighlighting = false;
  }

  setSponsorButtonEnabled(enabled: boolean): void {
    if (this.sponsorButtonsEnabled === enabled) return;
    this.sponsorButtonsEnabled = enabled;
    this.refreshCardControls();
  }

  private async checkSponsorship(jobData: JobData, card?: Element): Promise<SponsorshipCheckResult> {
    const jobContext = this.buildJobDescriptionData(jobData, card);
    const cacheKey = this.buildSponsorshipCacheKey(jobData.company, jobContext);
    const cached = this.sponsorCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const sponsorRecord = await SponsorshipManager.fetchSponsorRecord(jobData.company, jobContext);
      const ukEligibility =
        sponsorRecord?.ukEligibility ?? (await SponsorshipManager.assessUkEligibility(jobContext));

      const result: SponsorshipCheckResult = {
        company: jobData.company,
        source: jobData.source,
        isSponsored: !!sponsorRecord?.isSponsored,
        sponsorshipType: sponsorRecord?.sponsorshipType ?? null,
        status: "success",
        confidence: sponsorRecord ? 0.85 : ukEligibility ? 0.4 : 0,
        matchedName: sponsorRecord?.name ?? null,
        sponsorData: sponsorRecord ?? null,
        ukEligibility,
        jobContext,
      };

      this.sponsorCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn("Hireall: sponsor lookup failed", error);
      const ukEligibility = await SponsorshipManager.assessUkEligibility(jobContext);
      const fallback: SponsorshipCheckResult = {
        company: jobData.company,
        source: jobData.source,
        isSponsored: false,
        sponsorshipType: null,
        status: "error",
        confidence: ukEligibility ? 0.3 : 0,
        ukEligibility,
        jobContext,
      };
      this.sponsorCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private highlightCard(card: Element, result: SponsorshipCheckResult): void {
    if (!(card instanceof HTMLElement)) return;

    card.classList.add(this.highlightClass);
    card.style.position = card.style.position || "relative";

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

  private updateToggleState(label: string, disabled: boolean, variant: "primary" | "secondary" | "danger" = "primary"): void {
    if (!this.toggleButton) return;

    const iconName = disabled ? "clock" : label.includes("Clear") ? "xCircle" : "target";
    this.toggleButton.innerHTML = `${UIComponents.createIcon(iconName, 16, "#fff")} <span>${label}</span>`;
    this.toggleButton.disabled = disabled;
    this.toggleButton.style.opacity = disabled ? "0.7" : "1";
    this.toggleButton.style.pointerEvents = disabled ? "none" : "auto";

    const background =
      variant === "danger"
        ? "linear-gradient(135deg, #dc2626, #991b1b)"
        : variant === "secondary"
        ? "linear-gradient(135deg, #334155, #1f2937)"
        : "linear-gradient(135deg, #0f766e, #0d9488)";

    const shadow =
      variant === "danger"
        ? "0 12px 30px rgba(220, 38, 38, 0.25)"
        : variant === "secondary"
        ? "0 12px 30px rgba(51, 65, 85, 0.3)"
        : "0 12px 30px rgba(15, 118, 110, 0.25)";

    this.toggleButton.style.background = background;
    this.toggleButton.style.boxShadow = shadow;
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
    const originalLabel = button.innerHTML;
    const jobData = JobDataExtractor.extractJobData(card);

    if (jobData.company.trim().length < 2) {
      UIComponents.showToast("Company information missing for sponsor check", { type: "warning" });
      return;
    }

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
    const originalLabel = button.innerHTML;
    const jobData = JobDataExtractor.extractJobData(card);

    if (jobData.company.trim().length < 2 || jobData.title.trim().length < 2) {
      UIComponents.showToast("Missing required job information", { type: "warning" });
      return;
    }

    button.disabled = true;
    button.innerHTML = `${UIComponents.createIcon("clock", 12, "#fff")} <span>Adding...</span>`;

    try {
      const result = await JobBoardManager.addToBoard(jobData);
      if (result.success) {
        button.innerHTML = `${UIComponents.createIcon("checkCircle", 12, "#fff")} <span>Added</span>`;
        UIComponents.showToast(result.message, { type: "success" });
      } else {
        button.innerHTML = `${UIComponents.createIcon("alertTriangle", 12, "#fff")} <span>Retry</span>`;
        UIComponents.showToast(result.message, { type: "warning" });
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
