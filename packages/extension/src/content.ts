import { DEFAULT_WEB_APP_URL } from "./constants";
import {
  Target,
  ClipboardPlus,
  FileText,
  X,
  AlertTriangle,
  Home,
  Star,
  Briefcase,
  Eye,
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  Info,
  Crown,
  Sparkles,
  Building2,
} from "lucide-react";
import { sponsorBatchLimiter } from "./rateLimiter";
import { EXT_COLORS } from "./theme";
// --- Sponsorship lookup cache & concurrency limiter utilities ---
const sponsorshipCache: Map<string, any> = new Map();
const sponsorshipInFlight: Map<string, Promise<any>> = new Map();

async function runWithSponsorLimit<T>(fn: () => Promise<T>): Promise<T> {
  // Use the global batch rate limiter instead of local concurrency control
  return sponsorBatchLimiter.add(fn);
}

async function fetchSponsorRecord(company: string): Promise<any | null> {
  const key = company.toLowerCase().trim();
  if (sponsorshipCache.has(key)) return sponsorshipCache.get(key);
  if (sponsorshipInFlight.has(key)) return sponsorshipInFlight.get(key);

  const p = runWithSponsorLimit(async () => {
    try {
      const { get } = await import("./apiClient");
      const data = await get<any>("/api/app/sponsorship/companies", { q: company, limit: 1 });
      const rec = data.results?.[0] || null;
      if (rec) sponsorshipCache.set(key, rec);
      return rec;
    } catch (e: any) {
      console.warn("Sponsor lookup failed", e);
      if (e?.rateLimitInfo) {
        console.warn(`Rate limit hit for sponsor lookup: ${e.rateLimitInfo.remaining} remaining, resets in ${e.rateLimitInfo.resetIn}ms`);
      } else if (e?.statusCode === 401) {
        console.warn(`Authentication failed for sponsor lookup: ${e.message}`);
      } else if (e?.statusCode === 403) {
        console.warn(`Permission denied for sponsor lookup: ${e.message}`);
      }
      return null;
    } finally {
      sponsorshipInFlight.delete(key);
    }
  });

  sponsorshipInFlight.set(key, p);
  return p;
}
interface JobData {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  sponsorshipInfo?: {
    isSponsored: boolean;
    sponsorshipType?: string;
    source?: string;
  };
  dateFound: string;
  source: string;
  jobId?: string;
  jobType?: string;
  skills?: string[];
  requirements?: string[];
  remoteWork?: boolean;
  experienceLevel?: string;
  benefits?: string[];
  metadata?: {
    remote: boolean;
    seniority: string | undefined;
  };
}

interface SponsorshipCheckResult {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}

interface AutofillProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    experience: string;
    education: string;
    skills: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
  };
  preferences: {
    salaryExpectation: string;
    availableStartDate: string;
    workAuthorization: string;
    relocate: boolean;
    coverLetter: string;
  };
}

// Helper function to create Lucide icon elements
function createIcon(
  IconComponent: any,
  size: number = 16,
  color: string = "currentColor"
) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", size.toString());
  icon.setAttribute("height", size.toString());
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", color);
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");

  // Add the icon path (simplified - in real implementation you'd need the actual paths)
  return icon;
}

// Utility: convert #rrggbb to "r, g, b" for rgba usage
function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  // support shorthand '#fff'
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

class JobTracker {
  private isHighlightMode = false;
  // Removed people search mode state
  private webAppUrl: string;
  private currentJobSite: string;
  private lastRequestTime = 0;
  private requestCount = 0;
  private rateLimitWindow = 60000; // 1 minute
  private maxRequestsPerWindow = 10;
  // Removed people search panel reference
  private observer: MutationObserver | null = null;

  constructor() {
    // Default Web App URL - will be updated from storage
    this.webAppUrl = DEFAULT_WEB_APP_URL;
    this.currentJobSite = this.detectJobSite();
    this.init();
  }

  private init() {
    this.loadWebAppUrl();
    if (this.currentJobSite === "linkedin") {
    if (this.currentJobSite === "linkedin") {
      this.createToggleButton();
      this.createAutofillButton();
      this.setupAutoDetection();
    }
    }
  }

  private async loadWebAppUrl() {
    try {
      const result = await chrome.storage.sync.get(["webAppUrl"]);
      if (result.webAppUrl) {
        this.webAppUrl = result.webAppUrl;
      }
    } catch (error) {
      console.error("Failed to load web app URL:", error);
    }
  }

  private detectJobSite(): string {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes("linkedin")) return "linkedin";
    return "unsupported";
  }

  private createToggleButton() {
    const button = document.createElement("button");
    button.id = "hireall-toggle";
    button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
      createIcon(Target, 16).outerHTML
    } Check Sponsored Jobs</span>`;
    button.style.cssText = `
      position: fixed;
      top: 140px;
      right: 20px;
      z-index: 10000;
      background: ${EXT_COLORS.brown};
      color: ${EXT_COLORS.cardForeground};
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
    `;

    button.addEventListener("click", async () => {
      if (this.isHighlightMode) {
        this.clearHighlights();
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
          createIcon(Target, 16).outerHTML
        } Check Sponsored Jobs</span>`;
        button.style.background = EXT_COLORS.brown;
        this.isHighlightMode = false;
      } else {


        button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
          createIcon(Clock, 16).outerHTML
        } Checking...</span>`;
        button.disabled = true;

        try {
          await this.checkAndHighlightSponsoredJobs();
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
            createIcon(X, 16).outerHTML
          } Clear Highlights</span>`;
          button.style.background = EXT_COLORS.destructive;
          this.isHighlightMode = true;
          setTimeout(() => {
            button.style.background = EXT_COLORS.indigo;
          }, 3000);
        } finally {
          button.disabled = false;
        }
      }
    });

    document.body.appendChild(button);
  }

  private createAutofillButton() {
    const button = document.createElement("button");
    button.id = "hireall-autofill";
    button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
      createIcon(FileText, 16).outerHTML
    } Autofill Application</span>`;
    button.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      background: ${EXT_COLORS.beige};
      color: ${EXT_COLORS.cardForeground};
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
      display: none;
    `;

    button.addEventListener("click", async () => {
      button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
        createIcon(Clock, 16).outerHTML
      } Filling...</span>`;
      button.disabled = true;

      try {
        await this.autofillApplication();
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
          createIcon(CheckCircle, 16).outerHTML
        } Filled!</span>`;
        button.style.background = EXT_COLORS.brown;

        setTimeout(() => {
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
            createIcon(FileText, 16).outerHTML
          } Autofill Application</span>`;
          button.style.background = EXT_COLORS.beige;
          button.disabled = false;
        }, 3000);
      } catch (error) {
        console.error("Autofill error:", error);
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
          createIcon(XCircle, 16).outerHTML
        } Error</span>`;
        button.style.background = EXT_COLORS.destructive;

        setTimeout(() => {
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;">${
            createIcon(FileText, 16).outerHTML
          } Autofill Application</span>`;
          button.style.background = EXT_COLORS.beige;
          button.disabled = false;
        }, 3000);
      }
    });

    document.body.appendChild(button);

    // Show button only when application forms are detected
    this.detectApplicationForms();
  }

  // People search feature removed

  private async checkAndHighlightSponsoredJobs() {
    const jobElements = this.findJobElements();
    const jobsToCheck: Array<{ element: Element; data: JobData }> = [];

    // Extract job data from all elements
    jobElements.forEach((element) => {
      const jobData = this.extractJobData(element);
      jobsToCheck.push({ element, data: jobData });
    });

    if (jobsToCheck.length === 0) {
      console.log("No job elements found on this page");
      return;
    }

    // Extract unique company names for batch checking
    const companyNames = [
      ...new Set(jobsToCheck.map((job) => job.data.company)),
    ];

    // Check company sponsorship status via web API
    const sponsorshipResults = await this.checkCompanySponsorship(companyNames);

    // Create a map for quick lookup
    const sponsorshipMap = new Map();
    sponsorshipResults.forEach((result) => {
      sponsorshipMap.set(result.company, result);
    });

    // Apply highlights based on results
    jobsToCheck.forEach((job) => {
      const sponsorshipData = sponsorshipMap.get(job.data.company);
      if (sponsorshipData && sponsorshipData.isSponsored) {
        job.data.isSponsored = true;
        job.data.sponsorshipType =
          sponsorshipData.sponsorshipType || "sponsored";
        this.applyHighlight(
          job.element,
          sponsorshipData.sponsorshipType || "sponsored"
        );
        this.addJobToBoard(job.data);
      } else if (job.data.isRecruitmentAgency) {
        // Highlight recruitment agency jobs
        this.applyHighlight(job.element, "recruitment_agency");
        this.addJobToBoard(job.data);
      }
    });

    // Show summary
    const sponsoredCount = jobsToCheck.filter(
      (job) => job.data.isSponsored
    ).length;
    const recruitmentAgencyCount = jobsToCheck.filter(
      (job) => job.data.isRecruitmentAgency
    ).length;
    
    console.log(
      `Found ${sponsoredCount} sponsored jobs and ${recruitmentAgencyCount} recruitment agency jobs out of ${jobsToCheck.length} total jobs`
    );
  }



  private generateClientId(): string {
    // Generate a session-based client ID for rate limiting
    let clientId = localStorage.getItem("hireall-client-id");
    if (!clientId) {
      clientId =
        "ext-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now();
      localStorage.setItem("hireall-client-id", clientId);
    }
    return clientId;
  }

  private async checkCompanySponsorship(
    companies: string[]
  ): Promise<SponsorshipCheckResult[]> {
    try {
      // Limit companies per request
      const maxCompaniesPerRequest = 50;
      const limitedCompanies = companies.slice(0, maxCompaniesPerRequest);

      if (companies.length > maxCompaniesPerRequest) {
        console.warn(
          `Too many companies (${companies.length}). Limited to ${maxCompaniesPerRequest}.`
        );
      }

      // Use the centralized API client for consistent authentication and rate limiting
      const { get } = await import("./apiClient");
      const results: SponsorshipCheckResult[] = [];

      for (const company of limitedCompanies) {
        try {
          const data = await get("/api/app/sponsorship/companies", {
            q: company,
            limit: 1,
          });
          
          const isSponsored = !!(data.results && data.results[0]);
          results.push({
            company,
            isSponsored,
            sponsorshipType: isSponsored
              ? data.results[0].route || "sponsored"
              : null,
            source: "extension_lookup",
          });
        } catch (e: any) {
          console.warn(`Error checking sponsorship for ${company}:`, e);
          
          // Handle different error types appropriately
          if (e?.rateLimitInfo) {
            console.warn(`Rate limit hit during sponsor lookup: ${e.rateLimitInfo.remaining} remaining`);
            results.push({
              company,
              isSponsored: false,
              sponsorshipType: null,
              source: "rate_limited",
            });
          } else if (e?.statusCode === 401) {
            console.warn(`Authentication failed for sponsor lookup: ${e.message}`);
            results.push({
              company,
              isSponsored: false,
              sponsorshipType: null,
              source: "auth_error",
            });
          } else {
            results.push({
              company,
              isSponsored: false,
              sponsorshipType: null,
              source: "exception",
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error("Failed to check company sponsorship:", error);
      // Fallback: return empty results
      return companies.map((company) => ({
        company,
        isSponsored: false,
        sponsorshipType: null,
        source: "error",
      }));
    }
  }

  private findJobElements(): Element[] {
    if (this.currentJobSite !== "linkedin") {
      return [];
    }

    const selectors = [
      "section.jobs-search__results-list li",
      "li.jobs-search-results__list-item",
      "div.job-card-container",
      "div.jobs-unified-top-card",
      "div[data-job-id]",
    ];

    const elements: Element[] = [];
    selectors.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          if (!elements.includes(el)) {
            elements.push(el);
          }
        });
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
      }
    });

    return elements.filter((el) => el && el.isConnected);
  }

  private extractJobData(element: Element): JobData {
    if (this.currentJobSite !== "linkedin") {
      throw new Error(`Unsupported job source: ${this.currentJobSite}`);
    }

    const title = this.extractLinkedInTitle(element) ?? "Unknown Role";
    const company = this.extractLinkedInCompany(element) ?? "Unknown Company";
    const primaryUrl = this.extractLinkedInJobUrl(element);
    const fallbackUrl = this.extractLinkedInJobUrlFromParent(element);
    const url = primaryUrl || fallbackUrl || window.location.href;

    const location = this.extractLinkedInLocation(element) ?? "Not specified";

    const data: JobData = {
      title,
      company,
      location,
      url,
      description: this.extractLinkedInDescription(element) ?? undefined,
      salary: this.extractLinkedInSalary(element) ?? undefined,
      skills: this.extractLinkedInSkills(element) ?? undefined,
      postedDate: this.normalizeLinkedInPostedDate(
        this.extractLinkedInPostedDate(element)
      ),
      source: this.currentJobSite,
      jobId: this.extractLinkedInJobId(element) ?? undefined,
      metadata: {
        remote: this.detectRemote(element),
        seniority: this.detectSeniority(element),
      },
      isSponsored: false,
      dateFound: new Date().toISOString(),
    };

    return data;
  }

  private extractLinkedInJobId(element: Element): string | null {
    const direct = element.getAttribute("data-job-id");
    if (direct) {
      return direct;
    }

    const url = this.extractLinkedInJobUrl(element) || this.extractLinkedInJobUrlFromParent(element);
    if (url) {
      const match = url.match(/jobs\/view\/(\d+)/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractLinkedInJobUrl(element: Element): string | null {
    return (
      this.getElementHref(
        element,
        'a[data-control-name="job_card_click"], a[href*="linkedin.com/jobs/view"]'
      ) || null
    );
  }

  private extractLinkedInJobUrlFromParent(element: Element): string | null {
    let current: Element | null = element;
    while (current) {
      const link = this.getElementHref(
        current,
        'a[data-tracking-control-name="public_jobs_topcard-title"], a[href*="linkedin.com/jobs/view"]'
      );
      if (link) return link;
      current = current.parentElement;
    }
    return null;
  }

  private extractLinkedInTitle(element: Element): string | null {
    return (
      this.getElementText(element, "h1.top-card-layout__title") ||
      this.getElementText(element, ".jobs-unified-top-card__job-title") ||
      this.getElementText(element, ".job-card-list__title") ||
      this.getElementText(element, ".job-card-container__link")
    );
  }

  private extractLinkedInCompany(element: Element): string | null {
    return (
      this.getElementText(element, "a.topcard__org-name-link") ||
      this.getElementText(element, "span.topcard__flavor") ||
      this.getElementText(element, ".job-card-container__primary-description") ||
      this.getElementText(element, ".job-card-list__company")
    );
  }

  private extractLinkedInLocation(element: Element): string | null {
    return (
      this.getElementText(element, "span.topcard__flavor--bullet") ||
      this.getElementText(element, ".jobs-unified-top-card__bullet") ||
      this.getElementText(element, ".job-card-container__metadata-item") ||
      this.getElementText(element, ".job-card-list__location")
    );
  }

  private extractLinkedInDescription(element: Element): string | null {
    return (
      this.getElementText(element, "div.show-more-less-html__markup") ||
      this.getElementText(element, ".jobs-description__content") ||
      this.getElementText(element, ".job-card-list__description") ||
      this.getElementText(element, ".job-card-container__details")
    );
  }

  private extractLinkedInSalary(element: Element): string | null {
    return (
      this.getElementText(element, ".jobs-unified-top-card__salary-info") ||
      this.getElementText(element, ".job-card-container__salary")
    );
  }

  private extractLinkedInSkills(element: Element): string[] | null {
    const containers = element.querySelectorAll(
      "ul.description__job-criteria-list li, .job-card-list__skills li"
    );
    if (!containers.length) {
      return null;
    }

    const skills = Array.from(containers)
      .map((item) => item.textContent?.trim())
      .filter(Boolean) as string[];

    return skills.length ? skills : null;
  }

  private extractLinkedInPostedDate(element: Element): string | null {
    return (
      this.getElementText(element, "span.topcard__flavor--metadata") ||
      this.getElementText(element, ".jobs-unified-top-card__posted-date") ||
      this.getElementText(element, ".job-card-container__posted-date")
    );
  }

  private normalizeLinkedInPostedDate(raw: string | null): string | undefined {
    if (!raw) return undefined;
    const text = raw.trim();
    if (!text) return undefined;

    // Examples: "6 hours ago", "1 day ago", "3 weeks ago", "Posted on 12 Jun 2024"
    const relativeMatch = text.match(/(\d+)\s+(hour|day|week|month|year)s?\s+ago/i);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2].toLowerCase();
      const date = new Date();
      switch (unit) {
        case "hour":
          date.setHours(date.getHours() - value);
          break;
        case "day":
          date.setDate(date.getDate() - value);
          break;
        case "week":
          date.setDate(date.getDate() - value * 7);
          break;
        case "month":
          date.setMonth(date.getMonth() - value);
          break;
        case "year":
          date.setFullYear(date.getFullYear() - value);
          break;
      }
      return date.toISOString();
    }

    const exactMatch = text.match(/Posted on\s+(.*)/i);
    if (exactMatch) {
      const parsed = new Date(exactMatch[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return text;
  }

  private detectRemote(element: Element): boolean {
    const remoteKeywords = ["remote", "work from home", "hybrid"];
    const textContent = element.textContent?.toLowerCase() || "";
    return remoteKeywords.some((keyword) => textContent.includes(keyword));
  }

  private detectSeniority(element: Element): string | undefined {
    const seniorityKeywords = [
      { keyword: "intern", label: "internship" },
      { keyword: "entry level", label: "entry" },
      { keyword: "associate", label: "associate" },
      { keyword: "mid-senior", label: "mid" },
      { keyword: "senior", label: "senior" },
      { keyword: "lead", label: "lead" },
      { keyword: "principal", label: "principal" },
      { keyword: "director", label: "director" },
    ];

    const textContent = element.textContent?.toLowerCase() || "";
    const match = seniorityKeywords.find(({ keyword }) =>
      textContent.includes(keyword)
    );
    return match?.label;
  }

  private parseSalary(salaryText: string): JobData["salaryRange"] {
    if (!salaryText) return undefined;

    // Match various salary formats
    const patterns = [
      // $80,000 - $100,000 per year
      /(\$|£|€|₹|¥)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-\s*(\$|£|€|₹|¥)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?\s*(?:per\s+)?(year|month|week|day|hour)?/i,
      // $25 - $35 an hour
      /(\$|£|€|₹|¥)?\s?(\d{1,3}(?:\.\d{2})?)\s*(?:-\s*(\$|£|€|₹|¥)?\s?(\d{1,3}(?:\.\d{2})?))?\s*(?:an\s+|per\s+|a\s+)?(hour|day|week|month|year)/i,
      // Up to $100,000
      /(?:up\s+to\s+)?(\$|£|€|₹|¥)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:an\s+|per\s+|a\s+)?(year|month|week|day|hour)?/i,
    ];

    for (const pattern of patterns) {
      const match = salaryText.match(pattern);
      if (match) {
        const currency = match[1] || match[3] || "$";
        const min = match[2]
          ? parseFloat(match[2].replace(/,/g, ""))
          : undefined;
        const max = match[4] ? parseFloat(match[4].replace(/,/g, "")) : min;
        const period = match[5] || match[6] || match[7] || "year";

        return {
          min,
          max,
          currency,
          period,
        };
      }
    }

    return undefined;
  }

  private extractSkills(skillsText: string, description?: string): string[] {
    const skills: string[] = [];
    const text = `${skillsText} ${description || ""}`.toLowerCase();

    // Common tech skills
    const commonSkills = [
      "javascript",
      "typescript",
      "python",
      "java",
      "c\\+\\+",
      "c#",
      "php",
      "ruby",
      "go",
      "rust",
      "react",
      "vue",
      "angular",
      "svelte",
      "jquery",
      "bootstrap",
      "tailwind",
      "sass",
      "css",
      "html",
      "node.js",
      "express",
      "django",
      "flask",
      "spring",
      "laravel",
      "rails",
      "mongodb",
      "mysql",
      "postgresql",
      "redis",
      "elasticsearch",
      "aws",
      "azure",
      "gcp",
      "docker",
      "kubernetes",
      "jenkins",
      "git",
      "linux",
      "windows",
      "macos",
      "agile",
      "scrum",
      "kanban",
      "ci/cd",
      "tdd",
      "bdd",
      "machine learning",
      "ai",
      "data science",
      "analytics",
      "sql",
    ];

    // Extract skills from text
    const sentences = text.split(/[.!?]+/).filter((s) => s.length > 10);
    sentences.forEach((sentence) => {
      commonSkills.forEach((skill) => {
        if (sentence.includes(skill) && !skills.includes(skill)) {
          skills.push(skill);
        }
      });
    });

    // Also extract from comma-separated lists
    const commaSeparated = text.split(",").map((s) => s.trim());
    commaSeparated.forEach((item) => {
      if (item.length > 2 && item.length < 20) {
        skills.push(item);
      }
    });

    return [...new Set(skills)].slice(0, 10); // Limit to 10 skills
  }

  private extractJobMetadata(
    description: string,
    fullText: string
  ): Partial<JobData> {
    const text = `${description} ${fullText}`.toLowerCase();

    // Extract job type
    let jobType: string | undefined;
    if (text.includes("full time") || text.includes("full-time"))
      jobType = "Full-time";
    else if (text.includes("part time") || text.includes("part-time"))
      jobType = "Part-time";
    else if (text.includes("contract")) jobType = "Contract";
    else if (text.includes("freelance")) jobType = "Freelance";
    else if (text.includes("internship")) jobType = "Internship";

    // Extract experience level
    let experienceLevel: string | undefined;
    if (
      text.includes("entry level") ||
      text.includes("junior") ||
      text.includes("0-2 years")
    )
      experienceLevel = "Entry Level";
    else if (text.includes("mid level") || text.includes("3-5 years"))
      experienceLevel = "Mid Level";
    else if (text.includes("senior") || text.includes("5+ years"))
      experienceLevel = "Senior Level";
    else if (text.includes("lead") || text.includes("principal"))
      experienceLevel = "Lead/Principal";

    // Extract remote work
    const remoteWork =
      text.includes("remote") ||
      text.includes("work from home") ||
      text.includes("wfh");

    // Extract requirements and benefits
    const requirements = this.extractRequirements(text);
    const benefits = this.extractBenefits(text);

    // Extract industry (simplified)
    let industry: string | undefined;
    if (text.includes("tech") || text.includes("technology"))
      industry = "Technology";
    else if (text.includes("finance") || text.includes("banking"))
      industry = "Finance";
    else if (text.includes("healthcare") || text.includes("medical"))
      industry = "Healthcare";
    else if (text.includes("education")) industry = "Education";
    else if (text.includes("retail") || text.includes("e-commerce"))
      industry = "Retail/E-commerce";

    return {
      jobType,
      experienceLevel,
      remoteWork,
      requirements,
      benefits,
      industry,
    };
  }

  private extractRequirements(text: string): string[] {
    const requirements: string[] = [];
    const lines = text.split(/[.!?]+/).map((line) => line.trim());

    lines.forEach((line) => {
      // Look for requirement patterns
      if (
        line.includes("required") ||
        line.includes("must have") ||
        line.includes("experience with") ||
        line.includes("knowledge of") ||
        /^\d+\s*\+?\s*years?/.test(line) ||
        line.includes("bachelor") ||
        line.includes("master") ||
        line.includes("degree")
      ) {
        if (line.length > 20 && line.length < 200) {
          requirements.push(line);
        }
      }
    });

    return requirements.slice(0, 5); // Limit to 5 requirements
  }

  private extractBenefits(text: string): string[] {
    const benefits: string[] = [];
    const lines = text.split(/[.!?]+/).map((line) => line.trim());

    lines.forEach((line) => {
      // Look for benefit patterns
      if (
        line.includes("benefit") ||
        line.includes("offer") ||
        line.includes("provide") ||
        line.includes("health") ||
        line.includes("dental") ||
        line.includes("vision") ||
        line.includes("pto") ||
        line.includes("vacation") ||
        line.includes("salary") ||
        line.includes("bonus") ||
        line.includes("equity") ||
        line.includes("remote")
      ) {
        if (line.length > 20 && line.length < 150) {
          benefits.push(line);
        }
      }
    });

    return benefits.slice(0, 5); // Limit to 5 benefits
  }

  private detectRecruitmentAgency(
    title: string,
    company: string,
    element: Element
  ): boolean {
    const recruitmentAgencyIndicators = [
      // Common recruitment agency names
      /recruitment|recruiting|staffing|talent|headhunt|placement|search|consulting/i,
      // Common recruitment agency suffixes
      /\b(recruitment|recruiting|staffing|talent|search|consulting|solutions|services|group|partners|associates)\b/i,
      // Job title indicators
      /recruiter|talent acquisition|hr consultant|staffing specialist/i,
      // Description indicators (check element text content)
      /on behalf of|our client|leading company|confidential client|global organization/i,
    ];

    // Check company name
    for (const indicator of recruitmentAgencyIndicators) {
      if (indicator.test(company)) {
        return true;
      }
    }

    // Check job title
    if (/recruiter|talent acquisition|hr consultant|staffing/i.test(title)) {
      return true;
    }

    // Check element text content for recruitment agency language
    const elementText = element.textContent || "";
    if (
      /on behalf of|our client|leading company|confidential client/i.test(
        elementText
      )
    ) {
      return true;
    }

    return false;
  }

  private applyHighlight(
    element: Element,
    sponsorshipType: string = "sponsored"
  ) {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.add("hireall-highlighted");

    const colors = {
      sponsored: {
        border: EXT_COLORS.brown,
        bg: `rgba(${hexToRgb(EXT_COLORS.brown)}, 0.12)`,
        badge: EXT_COLORS.brown,
      },
      promoted: {
        border: EXT_COLORS.violet,
        bg: `rgba(${hexToRgb(EXT_COLORS.violet)}, 0.12)`,
        badge: EXT_COLORS.violet,
      },
      featured: {
        border: EXT_COLORS.success,
        bg: `rgba(${hexToRgb(EXT_COLORS.success)}, 0.12)`,
        badge: EXT_COLORS.success,
      },
      premium: {
        border: EXT_COLORS.beige,
        bg: `rgba(${hexToRgb(EXT_COLORS.beige)}, 0.2)`,
        badge: EXT_COLORS.beige,
      },
      recruitment_agency: {
        border: EXT_COLORS.destructive,
        bg: `rgba(${hexToRgb(EXT_COLORS.destructive)}, 0.12)`,
        badge: EXT_COLORS.destructive,
      },
    };

    const color =
      colors[sponsorshipType as keyof typeof colors] || colors.sponsored;

    htmlElement.style.cssText += `
      border: 3px solid ${color.border} !important;
      background: ${color.bg} !important;
      position: relative !important;
    `;

    if (!element.querySelector(".hireall-badge")) {
      const badge = document.createElement("div");
      badge.className = "hireall-badge";
      const badgeIcon =
        sponsorshipType === "recruitment_agency"
          ? createIcon(Building2, 12).outerHTML
          : createIcon(Target, 12).outerHTML;
      const badgeText =
        sponsorshipType === "recruitment_agency"
          ? "AGENCY"
          : sponsorshipType.toUpperCase();
      badge.textContent = `${badgeIcon} ${badgeText}`;
      badge.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: ${color.badge};
        color: ${EXT_COLORS.card};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1001;
      `;
      element.appendChild(badge);
    }
  }

  public clearHighlights() {
    document.querySelectorAll(".hireall-highlighted").forEach((element) => {
      element.classList.remove("hireall-highlighted");
      (element as HTMLElement).style.border = "";
      (element as HTMLElement).style.background = "";
    });

    document.querySelectorAll(".hireall-badge").forEach((badge) => {
      badge.remove();
    });

    document.querySelectorAll(".hireall-company-info").forEach((info) => {
      info.remove();
    });
  }

  private setupAutoDetection() {
    // Auto-detect and highlight sponsored jobs when page loads or content changes
    this.observer = new MutationObserver(() => {
      // Debounce the auto-detection to avoid too many API calls
      clearTimeout((this as any).autoDetectionTimeout);
      (this as any).autoDetectionTimeout = setTimeout(() => {
        this.autoDetectAndHighlight();
      }, 1000);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial auto-detection - always enabled by default
    setTimeout(() => {
      this.autoDetectAndHighlight();
    }, 2000);
  }

  private async autoDetectAndHighlight() {
    try {
      const jobElements = this.findJobElements();
      if (jobElements.length === 0) return;

      // Process jobs in smaller batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < jobElements.length; i += batchSize) {
        const batch = jobElements.slice(i, i + batchSize);
        await this.processBatchWithBadges(batch);

        // Small delay between batches
        if (i + batchSize < jobElements.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error("Auto-detection error:", error);
    }
  }

  private async processBatchWithBadges(jobElements: Element[]) {
    const jobsToCheck: Array<{ element: Element; data: JobData }> = [];

    jobElements.forEach((element) => {
      // Skip if already processed
      if (
        element.querySelector(".hireall-badge") ||
        element.querySelector(".hireall-company-info")
      ) {
        return;
      }

      const jobData = this.extractJobData(element);
      jobsToCheck.push({ element, data: jobData });
    });

    if (jobsToCheck.length === 0) return;

    // Extract unique company names for batch checking
    const companyNames = [
      ...new Set(jobsToCheck.map((job) => job.data.company)),
    ];

    // Check company sponsorship status via web API
    const sponsorshipResults = await this.checkCompanySponsorship(companyNames);

    // Create a map for quick lookup
    const sponsorshipMap = new Map();
    sponsorshipResults.forEach((result) => {
      sponsorshipMap.set(result.company, result);
    });

    // Apply badges, company info, and job board buttons
    jobsToCheck.forEach((job) => {
      const sponsorshipData = sponsorshipMap.get(job.data.company);
      this.addJobBadge(job.element, sponsorshipData);
      this.addCompanyInfo(job.element, sponsorshipData);
      this.addJobBoardButton(job.element, job.data, sponsorshipData);

      if (sponsorshipData && sponsorshipData.isSponsored) {
        job.data.isSponsored = true;
        job.data.sponsorshipType =
          sponsorshipData.sponsorshipType || "sponsored";
        this.addJobToBoard(job.data);
      }
    });
  }

  private addJobBadge(element: Element, sponsorshipData: any) {
    // Enhanced job badge with more information
    const badgeContainer = document.createElement("div");
    badgeContainer.className = "hireall-enhanced-badge";
    badgeContainer.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1002;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
    `;

    // Main sponsorship badge
    const mainBadge = document.createElement("div");
    mainBadge.className = "hireall-main-badge";

    if (sponsorshipData && sponsorshipData.isSponsored) {
      const sponsorshipType = sponsorshipData.sponsorshipType || "sponsored";
      const badgeConfig = this.getBadgeConfig(sponsorshipType);

      mainBadge.innerHTML = `
        <span style="
          background: ${badgeConfig.background};
          color: ${badgeConfig.color};
          padding: 6px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.2);
        ">
          ${badgeConfig.icon} ${sponsorshipType}
        </span>
      `;
    } else {
      mainBadge.innerHTML = `
        <span style="
          background: rgba(255,255,255,0.9);
          color: EXT_COLORS.muted;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.1);
        ">
          ${createIcon(Info, 10).outerHTML} No Sponsorship Data
        </span>
      `;
    }

    badgeContainer.appendChild(mainBadge);

    // Quick info badges
    const jobData = this.extractJobData(element);
    const infoBadges = document.createElement("div");
    infoBadges.className = "hireall-info-badges";
    infoBadges.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-end;
    `;

    // Salary badge
    if (jobData.salaryRange && jobData.salaryRange.min) {
      const salaryBadge = document.createElement("div");
      const salary =
        jobData.salaryRange.currency + jobData.salaryRange.min.toLocaleString();
      salaryBadge.innerHTML = `
        <span style="
          background: linear-gradient(135deg, EXT_COLORS.success, EXT_COLORS.greenDark);
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          ${createIcon(Briefcase, 10).outerHTML} ${salary}
        </span>
      `;
      infoBadges.appendChild(salaryBadge);
    }

    // Remote work badge
    if (jobData.remoteWork) {
      const remoteBadge = document.createElement("div");
      remoteBadge.innerHTML = `
        <span style="
          background: linear-gradient(135deg, EXT_COLORS.info, EXT_COLORS.brandBlue);
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          ${createIcon(Home, 10).outerHTML} Remote
        </span>
      `;
      infoBadges.appendChild(remoteBadge);
    }

    // Experience level badge
    if (jobData.experienceLevel) {
      const expBadge = document.createElement("div");
      const expColor = jobData.experienceLevel.includes("Senior")
        ? "EXT_COLORS.warning"
        : jobData.experienceLevel.includes("Mid")
        ? "EXT_COLORS.violet"
        : "EXT_COLORS.success";
      expBadge.innerHTML = `
        <span style="
          background: ${expColor};
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          ${createIcon(Target, 10).outerHTML} ${jobData.experienceLevel}
        </span>
      `;
      infoBadges.appendChild(expBadge);
    }

    if (infoBadges.children.length > 0) {
      badgeContainer.appendChild(infoBadges);
    }

    // Make parent element relative if it's not already
    const htmlElement = element as HTMLElement;
    if (getComputedStyle(htmlElement).position === "static") {
      htmlElement.style.position = "relative";
    }

    element.appendChild(badgeContainer);
  }

  private addCompanyInfo(element: Element, sponsorshipData: any) {
    // Enhanced company info with skills and key information
    const companyElement = this.findCompanyElement(element);
    if (!companyElement) return;

    const jobData = this.extractJobData(element);
    const infoDiv = document.createElement("div");
    infoDiv.className = "hireall-company-info";
    infoDiv.style.cssText = `
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    // Sponsorship info
    if (sponsorshipData && sponsorshipData.isSponsored) {
      const sponsorshipType = sponsorshipData.sponsorshipType || "sponsored";
      const badgeConfig = this.getBadgeConfig(sponsorshipType);

      const sponsorshipDiv = document.createElement("div");
      sponsorshipDiv.style.cssText = `
        padding: 8px 12px;
        background: linear-gradient(135deg, ${badgeConfig.background}15, ${badgeConfig.background}08);
        border-left: 4px solid ${badgeConfig.background};
        border-radius: 6px;
        font-size: 12px;
        color: ${badgeConfig.background};
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      `;
      sponsorshipDiv.innerHTML = `
        ${badgeConfig.icon} Sponsors ${sponsorshipType} positions
        ${
          sponsorshipData.matchedName &&
          sponsorshipData.matchedName !== sponsorshipData.company
            ? `<br><span style="font-size: 10px; opacity: 0.8; font-weight: 500;">Matched as: ${sponsorshipData.matchedName}</span>`
            : ""
        }
      `;
      infoDiv.appendChild(sponsorshipDiv);
    }

    // Job details summary
    const detailsDiv = document.createElement("div");
    detailsDiv.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
    `;

    // Job type badge
    if (jobData.jobType) {
      const typeBadge = document.createElement("span");
      typeBadge.style.cssText = `
        background: EXT_COLORS.paleBlue;
        color: EXT_COLORS.skyBlue;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      `;
      typeBadge.textContent = jobData.jobType;
      detailsDiv.appendChild(typeBadge);
    }

    // Skills preview (show top 3 skills)
    if (jobData.skills && jobData.skills.length > 0) {
      const skillsContainer = document.createElement("div");
      skillsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      `;

      jobData.skills.slice(0, 3).forEach((skill) => {
        const skillBadge = document.createElement("span");
        skillBadge.style.cssText = `
          background: EXT_COLORS.light;
          color: EXT_COLORS.slate;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
        `;
        skillBadge.textContent = skill;
        skillsContainer.appendChild(skillBadge);
      });

      // Show count if there are more skills
      if (jobData.skills.length > 3) {
        const moreBadge = document.createElement("span");
        moreBadge.style.cssText = `
          background: EXT_COLORS.border;
          color: EXT_COLORS.muted;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
        `;
        moreBadge.textContent = `+${jobData.skills.length - 3} more`;
        skillsContainer.appendChild(moreBadge);
      }

      detailsDiv.appendChild(skillsContainer);
    }

    // Key requirements preview
    if (jobData.requirements && jobData.requirements.length > 0) {
      const reqDiv = document.createElement("div");
      reqDiv.style.cssText = `
        margin-top: 6px;
        padding: 6px 10px;
        background: EXT_COLORS.beigeLight;
        border-left: 3px solid EXT_COLORS.warning;
        border-radius: 4px;
        font-size: 11px;
        color: EXT_COLORS.warningDark;
        font-weight: 500;
      `;
      reqDiv.innerHTML = `
        <strong>Key Requirements:</strong> ${jobData.requirements[0]}
        ${
          jobData.requirements.length > 1
            ? ` (+${jobData.requirements.length - 1} more)`
            : ""
        }
      `;
      detailsDiv.appendChild(reqDiv);
    }

    if (detailsDiv.children.length > 0) {
      infoDiv.appendChild(detailsDiv);
    }

    companyElement.appendChild(infoDiv);
  }

  private addJobBoardButton(
    element: Element,
    jobData: JobData,
    _sponsorshipData: any
  ) {
    // sponsorshipData parameter is used for future enhancements
    void _sponsorshipData;
    // Skip if button already exists
    if (element.querySelector(".hireall-quick-actions")) return;

    // Enhanced quick actions panel - always visible
    const actionsPanel = document.createElement("div");
    actionsPanel.className = "hireall-quick-actions";
    actionsPanel.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      z-index: 1003;
      display: flex;
      gap: 6px;
      align-items: center;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.08);
      opacity: 1;
      transform: translateY(0);
      transition: all 0.2s ease;
      pointer-events: auto;
      flex-wrap: wrap;
    `;

    // Check Sponsorship Button
    const checkSponsorshipBtn = document.createElement("button");
    checkSponsorshipBtn.className = "hireall-check-sponsorship";
    checkSponsorshipBtn.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(Flag, 12).outerHTML
    } Check Sponsor</span>`;
    checkSponsorshipBtn.style.cssText = `
      background: linear-gradient(135deg, EXT_COLORS.info, EXT_COLORS.brandBlue);
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    `;

    checkSponsorshipBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.checkJobSponsorshipFromButton(
        element,
        jobData.company,
        checkSponsorshipBtn
      );
    });

    // Add to Board Button
    const addToBoardBtn = document.createElement("button");
    addToBoardBtn.className = "hireall-add-to-board";
    addToBoardBtn.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(ClipboardPlus, 12).outerHTML
    } Add to Board</span>`;
    addToBoardBtn.style.cssText = `
      background: linear-gradient(135deg, EXT_COLORS.success, EXT_COLORS.greenDark);
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    `;

    addToBoardBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.addJobToBoardFromButton(element, jobData, addToBoardBtn);
    });

    // Status selector (compact version)
    const statusSelect = document.createElement("select");
    statusSelect.className = "hireall-status-select";
    statusSelect.innerHTML = `
      <option value="">Status</option>
      <option value="interested">${createIcon(Star, 12).outerHTML}</option>
      <option value="applied">${createIcon(FileText, 12).outerHTML}</option>
      <option value="interviewing">${createIcon(Target, 12).outerHTML}</option>
      <option value="offered">${createIcon(CheckCircle, 12).outerHTML}</option>
      <option value="rejected">${createIcon(XCircle, 12).outerHTML}</option>
      <option value="withdrawn">${createIcon(X, 12).outerHTML}</option>
    `;
    statusSelect.style.cssText = `
      height: 28px;
      padding: 2px 6px;
      border: 1px solid EXT_COLORS.grayBorder;
      border-radius: 4px;
      background: white;
      font-size: 10px;
      cursor: pointer;
      min-width: 60px;
    `;

    // Load default status from settings if available
    chrome.storage.sync.get(["defaultJobStatus"], (res: { defaultJobStatus?: string }) => {
      if (res.defaultJobStatus) {
        statusSelect.value = res.defaultJobStatus;
      }
    });

    // Quick action buttons
    const quickActions = document.createElement("div");
    quickActions.style.cssText = `
      display: flex;
      gap: 4px;
      align-items: center;
    `;

    // Add to board button
    const addButton = document.createElement("button");
    addButton.className = "hireall-add-btn";
    addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(ClipboardPlus, 12).outerHTML
    } Add to Board</span>`;
    addButton.style.cssText = `
      background: EXT_COLORS.indigo;
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    addButton.addEventListener("mouseenter", () => {
      addButton.style.background = "EXT_COLORS.deepIndigo";
      addButton.style.transform = "translateY(-1px)";
    });

    addButton.addEventListener("mouseleave", () => {
      addButton.style.background = "EXT_COLORS.indigo";
      addButton.style.transform = "translateY(0)";
    });

    addButton.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const originalContent = addButton.innerHTML;
      addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
        createIcon(Clock, 12).outerHTML
      } Adding...</span>`;
      addButton.disabled = true;

      try {
        // Import the JobBoardManager and use it
        const { JobBoardManager } = await import("./addToBoard");

        // Check if job already exists
        const jobExists = await JobBoardManager.checkIfJobExists(jobData);
        if (jobExists) {
          addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(CheckCircle, 12).outerHTML
          } Added</span>`;
          addButton.style.background = "EXT_COLORS.muted";
          addButton.disabled = true;

          // Show success message
          this.showInlineToast(element, "Job already on your board!", "info");
          return;
        }

        // Add job to board with selected status
        const selectedStatus = statusSelect.value || "interested";
        const result = await JobBoardManager.addToBoardWithStatus(
          jobData,
          selectedStatus as any
        );

        if (result.success) {
          addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(CheckCircle, 12).outerHTML
          } Added!</span>`;
          addButton.style.background = "EXT_COLORS.success";

          // Show success animation
          addButton.style.transform = "scale(1.1)";
          setTimeout(() => {
            addButton.style.transform = "scale(1)";
          }, 150);

          // Update stats
          this.updateJobStats();

          // Show success message
          this.showInlineToast(
            element,
            `Job added as ${selectedStatus}!`,
            "success"
          );

          // Revert after 3 seconds
          setTimeout(() => {
            addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
              createIcon(ClipboardPlus, 12).outerHTML
            } Added</span>`;
            addButton.style.background = "EXT_COLORS.muted";
            addButton.disabled = true;
          }, 3000);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error adding to job board:", error);
        addButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
          createIcon(XCircle, 12).outerHTML
        } Error</span>`;
        addButton.style.background = "EXT_COLORS.destructive";

        this.showInlineToast(element, "Failed to add job", "error");

        setTimeout(() => {
          addButton.innerHTML = originalContent;
          addButton.style.background = "EXT_COLORS.indigo";
          addButton.disabled = false;
        }, 3000);
      }
    });

    // Check sponsor button
    const sponsorButton = document.createElement("button");
    sponsorButton.className = "hireall-sponsor-btn";
    sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(Flag, 12).outerHTML
    } Check Sponsorship</span>`;
    sponsorButton.title = "Check Sponsor Status";
    sponsorButton.style.cssText = `
      background: EXT_COLORS.greenDark;
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    sponsorButton.addEventListener("mouseenter", () => {
      sponsorButton.style.background = "EXT_COLORS.greenDarker";
      sponsorButton.style.transform = "translateY(-1px)";
    });

    sponsorButton.addEventListener("mouseleave", () => {
      sponsorButton.style.background = "EXT_COLORS.greenDark";
      sponsorButton.style.transform = "translateY(0)";
    });

    sponsorButton.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const originalContent = sponsorButton.innerHTML;
      sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
        createIcon(Clock, 12).outerHTML
      } Checking...</span>`;
      sponsorButton.disabled = true;

      try {
        // Authenticated sponsor lookup using api client helper
        const result = await fetchSponsorRecord(jobData.company);

        if (result) {
          const isSkilledWorker = result.isSkilledWorker;

          if (isSkilledWorker) {
            sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
              createIcon(CheckCircle, 12).outerHTML
            } Licensed</span>`;
            sponsorButton.style.background = "EXT_COLORS.success";
            this.showInlineToast(
              element,
              `${createIcon(CheckCircle, 12).outerHTML} ${
                result.name
              } is a licensed sponsor!`,
              "success"
            );
          } else {
            sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
              createIcon(AlertTriangle, 12).outerHTML
            } Not SW</span>`;
            sponsorButton.style.background = "EXT_COLORS.warning";
            this.showInlineToast(
              element,
              `${createIcon(AlertTriangle, 12).outerHTML} ${
                result.name
              } is licensed but not for Skilled Worker visas`,
              "info"
            );
          }
        } else {
          sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(XCircle, 12).outerHTML
          } Not Found</span>`;
          sponsorButton.style.background = "EXT_COLORS.destructive";
          this.showInlineToast(
            element,
            `${createIcon(XCircle, 12).outerHTML} ${
              jobData.company
            } not found in sponsor register`,
            "error"
          );
        }

        // Keep result visible for 5 seconds then revert
        setTimeout(() => {
          sponsorButton.innerHTML = originalContent;
          sponsorButton.style.background = "EXT_COLORS.greenDark";
          sponsorButton.disabled = false;
        }, 5000);
      } catch (error) {
        console.error("Error checking sponsor status:", error);
        sponsorButton.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
          createIcon(XCircle, 12).outerHTML
        } Error</span>`;
        sponsorButton.style.background = "EXT_COLORS.destructive";

        this.showInlineToast(
          element,
          `${createIcon(XCircle, 12).outerHTML} Error checking sponsor status`,
          "error"
        );

        setTimeout(() => {
          sponsorButton.innerHTML = originalContent;
          sponsorButton.style.background = "EXT_COLORS.greenDark";
          sponsorButton.disabled = false;
        }, 3000);
      }
    });

    // View job button
    const viewButton = document.createElement("button");
    viewButton.innerHTML = createIcon(Eye, 14).outerHTML;
    viewButton.title = "View Job Details";
    viewButton.style.cssText = `
      background: EXT_COLORS.light;
      color: EXT_COLORS.slate;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    viewButton.addEventListener("mouseenter", () => {
      viewButton.style.background = "EXT_COLORS.border";
      viewButton.style.transform = "scale(1.1)";
    });

    viewButton.addEventListener("mouseleave", () => {
      viewButton.style.background = "EXT_COLORS.light";
      viewButton.style.transform = "scale(1)";
    });

    viewButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (jobData.url) {
        // Open in new tab
        chrome.runtime.sendMessage({
          action: "openJobUrl",
          url: jobData.url,
        }).catch((error) => {
          console.warn("Failed to send openJobUrl message:", error);
        });
      }
    });

    // Make parent element relative if it's not already
    const htmlElement = element as HTMLElement;
    if (getComputedStyle(htmlElement).position === "static") {
      htmlElement.style.position = "relative";
    }

    quickActions.appendChild(viewButton);
    actionsPanel.appendChild(statusSelect);
    actionsPanel.appendChild(addButton);
    actionsPanel.appendChild(sponsorButton);
    actionsPanel.appendChild(quickActions);
    element.appendChild(actionsPanel);
  }

  private findCompanyElement(jobElement: Element): Element | null {
    const siteSpecificSelectors = {
      linkedin:
        ".job-card-container__primary-description, .job-card-list__company, .entity-result__primary-subtitle",
      indeed: '[data-testid="company-name"], .companyName',
      glassdoor: '[data-test="employer-name"], .employerName',
      google_jobs: ".vNEEBe, .nJlQNd",
      seek: '[data-automation="jobCompany"], .company',
      totaljobs: ".company, .job-company",
      reed: ".gtmJobListingPostedBy, .company",
      jobsite: ".company, .job-company",
      unknown: '.company, .job-company, [data-testid="job-company"]',
    };

    const selectors =
      siteSpecificSelectors[
        this.currentJobSite as keyof typeof siteSpecificSelectors
      ] || siteSpecificSelectors.unknown;
    return jobElement.querySelector(selectors);
  }

  private async getWebAppUrl(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["webAppUrl"], (result) => {
        resolve(result.webAppUrl || DEFAULT_WEB_APP_URL);
      });
    });
  }

  private getBadgeConfig(sponsorshipType: string) {
    const configs = {
      sponsored: {
        background: "EXT_COLORS.destructive",
        color: "white",
        icon: createIcon(Target, 12).outerHTML,
      },
      promoted: {
        background: "EXT_COLORS.violet",
        color: "white",
        icon: createIcon(Star, 12).outerHTML,
      },
      featured: {
        background: "EXT_COLORS.success",
        color: "white",
        icon: createIcon(Sparkles, 12).outerHTML,
      },
      premium: {
        background: "EXT_COLORS.warning",
        color: "white",
        icon: createIcon(Crown, 12).outerHTML,
      },
      verified: {
        background: "EXT_COLORS.info",
        color: "white",
        icon: createIcon(CheckCircle, 12).outerHTML,
      },
    };

    return (
      configs[sponsorshipType as keyof typeof configs] || configs.sponsored
    );
  }

  private showInlineToast(
    element: Element,
    message: string,
    type: "success" | "error" | "info" = "info"
  ) {
    // Remove existing toasts
    element
      .querySelectorAll(".hireall-inline-toast")
      .forEach((toast) => toast.remove());

    const toast = document.createElement("div");
    toast.className = "hireall-inline-toast";
    toast.style.cssText = `
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: ${
        type === "success"
          ? "EXT_COLORS.success"
          : type === "error"
          ? "EXT_COLORS.destructive"
          : "EXT_COLORS.info"
      };
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1004;
      white-space: nowrap;
      animation: slideDown 0.3s ease-out;
    `;

    toast.textContent = message;

    element.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private updateJobStats() {
    // Update local storage stats
    chrome.storage.local.get(["jobBoardData"], (result: { jobBoardData?: any[] }) => {
      const jobs = result.jobBoardData || [];
      const stats = {
        jobsToday: jobs.filter((job: any) => {
          const today = new Date();
          const jobDate = new Date(job.dateAdded);
          return jobDate.toDateString() === today.toDateString();
        }).length,
        sponsoredJobs: jobs.filter(
          (job: any) => job.sponsorshipInfo?.isSponsored
        ).length,
        applications: jobs.length,
      };

      chrome.storage.local.set(stats);
    });
  }

  private addJobToBoard(jobData: JobData) {
    chrome.runtime.sendMessage({
      action: "addJob",
      data: jobData,
    }).catch((error) => {
      console.warn("Failed to send addJob message:", error);
    });
  }

  private detectApplicationForms() {
    // Check for common application form patterns
    const formSelectors = [
      'form[action*="apply"]',
      'form[action*="application"]',
      'form[id*="apply"]',
      'form[id*="application"]',
      'form[class*="apply"]',
      'form[class*="application"]',
      ".application-form",
      ".job-application",
      ".apply-form",
      "#application-form",
      '[data-testid*="application"]',
      '[data-testid*="apply"]',
    ];

    const inputSelectors = [
      'input[name*="name"]',
      'input[name*="email"]',
      'input[name*="phone"]',
      'input[type="email"]',
      'textarea[name*="cover"]',
      'input[name*="resume"]',
      'input[type="file"]',
    ];

    const hasApplicationForm =
      formSelectors.some((selector) => document.querySelector(selector)) ||
      inputSelectors.some(
        (selector) => document.querySelectorAll(selector).length >= 2
      );

    const autofillButton = document.getElementById("hireall-autofill");
    if (autofillButton) {
      autofillButton.style.display = hasApplicationForm ? "block" : "none";
    }

    // Re-check periodically as forms may load dynamically
    setTimeout(() => this.detectApplicationForms(), 3000);
  }

  private async autofillApplication() {
    // Load user profile data
    const profile = await this.loadAutofillProfile();
    if (!profile) {
      throw new Error(
        "No autofill profile configured. Please set up your profile in settings."
      );
    }

    // Find and fill form fields
    const fieldsToFill = this.findFormFields();
    let filledCount = 0;

    for (const field of fieldsToFill) {
      try {
        const value = this.getValueForField(field, profile);
        if (value && this.fillField(field.element, value)) {
          filledCount++;
          // Small delay between fills to appear more natural
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn("Failed to fill field:", field.name, error);
      }
    }

    console.log(`Autofilled ${filledCount} fields`);

    if (filledCount === 0) {
      throw new Error("No compatible form fields found on this page.");
    }
  }

  private async loadAutofillProfile(): Promise<AutofillProfile | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["autofillProfile"], (result: { autofillProfile?: AutofillProfile }) => {
        resolve(result.autofillProfile || null);
      });
    });
  }

  private findFormFields() {
    const fields: Array<{ element: HTMLElement; name: string; type: string }> =
      [];

    // Common field patterns for job applications
    const fieldPatterns = [
      // Personal Information
      { pattern: /first.*name|fname|given.*name/i, type: "firstName" },
      { pattern: /last.*name|lname|family.*name|surname/i, type: "lastName" },
      { pattern: /full.*name|name/i, type: "fullName" },
      { pattern: /email/i, type: "email" },
      { pattern: /phone|mobile|tel/i, type: "phone" },
      { pattern: /address|street/i, type: "address" },
      { pattern: /city/i, type: "city" },
      { pattern: /state|province/i, type: "state" },
      { pattern: /zip|postal/i, type: "zipCode" },
      { pattern: /country/i, type: "country" },

      // Professional Information
      { pattern: /current.*title|job.*title|position/i, type: "currentTitle" },
      { pattern: /experience|years/i, type: "experience" },
      { pattern: /education|degree|school|university/i, type: "education" },
      { pattern: /skills|expertise/i, type: "skills" },
      { pattern: /linkedin|profile/i, type: "linkedinUrl" },
      { pattern: /portfolio|website/i, type: "portfolioUrl" },
      { pattern: /github/i, type: "githubUrl" },

      // Application Specific
      {
        pattern: /salary|compensation|expected.*pay/i,
        type: "salaryExpectation",
      },
      { pattern: /start.*date|available|when/i, type: "availableStartDate" },
      {
        pattern: /authorization|visa|work.*status/i,
        type: "workAuthorization",
      },
      { pattern: /relocate|move|willing/i, type: "relocate" },
      { pattern: /cover.*letter|motivation|why/i, type: "coverLetter" },
    ];

    // Find input fields
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      const element = input as HTMLElement;
      const name =
        element.getAttribute("name") ||
        element.getAttribute("id") ||
        element.getAttribute("placeholder") ||
        "";
      const label = this.findFieldLabel(element);
      const searchText = `${name} ${label}`.toLowerCase();

      for (const pattern of fieldPatterns) {
        if (pattern.pattern.test(searchText)) {
          fields.push({
            element,
            name: searchText,
            type: pattern.type,
          });
          break;
        }
      }
    });

    return fields;
  }

  private findFieldLabel(element: HTMLElement): string {
    // Try to find associated label
    const id = element.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || "";
    }

    // Look for nearby label or text
    const parent = element.parentElement;
    if (parent) {
      const label = parent.querySelector("label");
      if (label) return label.textContent || "";

      // Check for text content in parent
      const textContent = parent.textContent || "";
      return textContent.replace(element.textContent || "", "").trim();
    }

    return element.getAttribute("placeholder") || "";
  }

  private getValueForField(
    field: { element: HTMLElement; name: string; type: string },
    profile: AutofillProfile
  ): string {
    switch (field.type) {
      // Personal Information
      case "firstName":
        return profile.personalInfo.firstName;
      case "lastName":
        return profile.personalInfo.lastName;
      case "fullName":
        return `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
      case "email":
        return profile.personalInfo.email;
      case "phone":
        return profile.personalInfo.phone;
      case "address":
        return profile.personalInfo.address;
      case "city":
        return profile.personalInfo.city;
      case "state":
        return profile.personalInfo.state;
      case "zipCode":
        return profile.personalInfo.zipCode;
      case "country":
        return profile.personalInfo.country;

      // Professional Information
      case "currentTitle":
        return profile.professional.currentTitle;
      case "experience":
        return profile.professional.experience;
      case "education":
        return profile.professional.education;
      case "skills":
        return profile.professional.skills;
      case "linkedinUrl":
        return profile.professional.linkedinUrl;
      case "portfolioUrl":
        return profile.professional.portfolioUrl;
      case "githubUrl":
        return profile.professional.githubUrl;

      // Application Specific
      case "salaryExpectation":
        return profile.preferences.salaryExpectation;
      case "availableStartDate":
        return profile.preferences.availableStartDate;
      case "workAuthorization":
        return profile.preferences.workAuthorization;
      case "relocate":
        return profile.preferences.relocate ? "Yes" : "No";
      case "coverLetter":
        return profile.preferences.coverLetter;

      default:
        return "";
    }
  }

  private fillField(element: HTMLElement, value: string): boolean {
    try {
      const input = element as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;

      if (input.type === "checkbox" || input.type === "radio") {
        const checkboxInput = input as HTMLInputElement;
        const shouldCheck =
          value.toLowerCase() === "yes" || value.toLowerCase() === "true";
        if (checkboxInput.checked !== shouldCheck) {
          checkboxInput.checked = shouldCheck;
          checkboxInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
      }

      if (input.tagName === "SELECT") {
        const select = input as HTMLSelectElement;
        // Try to find matching option
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          if (
            option.text.toLowerCase().includes(value.toLowerCase()) ||
            option.value.toLowerCase().includes(value.toLowerCase())
          ) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
        }
        return false;
      }

      // Regular input or textarea
      if (input.value !== value) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return true;
    } catch (error) {
      console.warn("Failed to fill field:", error);
      return false;
    }
  }

  private async checkJobSponsorshipFromButton(
    element: Element,
    company: string,
    button: HTMLButtonElement
  ) {
    const originalContent = button.innerHTML;
    button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(Clock, 12).outerHTML
    } Checking...</span>`;
    button.disabled = true;

    try {
      const result = await fetchSponsorRecord(company);

      if (result) {
        const isSkilledWorker = result.isSkilledWorker;

        if (isSkilledWorker) {
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(CheckCircle, 12).outerHTML
          } Licensed</span>`;
          button.style.background = "EXT_COLORS.success";
          this.showInlineToast(
            element,
            `${createIcon(CheckCircle, 12).outerHTML} ${
              result.name
            } is a licensed sponsor!`,
            "success"
          );
        } else {
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(AlertTriangle, 12).outerHTML
          } Not SW</span>`;
          button.style.background = "EXT_COLORS.warning";
          this.showInlineToast(
            element,
            `${createIcon(AlertTriangle, 12).outerHTML} ${
              result.name
            } is licensed but not for Skilled Worker visas`,
            "info"
          );
        }
      } else {
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
          createIcon(XCircle, 12).outerHTML
        } Not Found</span>`;
        button.style.background = "EXT_COLORS.destructive";
        this.showInlineToast(
          element,
          `${
            createIcon(XCircle, 12).outerHTML
          } ${company} not found in sponsor register`,
          "error"
        );
      }

      // Keep result visible for 5 seconds then revert
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "linear-gradient(135deg, EXT_COLORS.info, EXT_COLORS.brandBlue)";
        button.disabled = false;
      }, 5000);
    } catch (error) {
      console.error("Error checking sponsor status:", error);
      button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
        createIcon(XCircle, 12).outerHTML
      } Error</span>`;
      button.style.background = "EXT_COLORS.destructive";

      this.showInlineToast(
        element,
        `${createIcon(XCircle, 12).outerHTML} Error checking sponsor status`,
        "error"
      );

      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "linear-gradient(135deg, EXT_COLORS.info, EXT_COLORS.brandBlue)";
        button.disabled = false;
      }, 3000);
    }
  }

  private async addJobToBoardFromButton(
    element: Element,
    jobData: JobData,
    button: HTMLButtonElement
  ) {
    const originalContent = button.innerHTML;
    button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
      createIcon(Clock, 12).outerHTML
    } Adding...</span>`;
    button.disabled = true;

    try {
      // Import the JobBoardManager and use it
      const { JobBoardManager } = await import("./addToBoard");

      // Check if job already exists
      const jobExists = await JobBoardManager.checkIfJobExists(jobData);
      if (jobExists) {
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
          createIcon(CheckCircle, 12).outerHTML
        } Added</span>`;
        button.style.background = "EXT_COLORS.muted";
        button.disabled = true;

        // Show success message
        this.showInlineToast(element, "Job already on your board!", "info");
        return;
      }

      // Add job to board with default status
      const result = await JobBoardManager.addToBoardWithStatus(
        jobData,
        "interested"
      );

      if (result.success) {
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
          createIcon(CheckCircle, 12).outerHTML
        } Added!</span>`;
        button.style.background = "EXT_COLORS.success";

        // Show success animation
        button.style.transform = "scale(1.1)";
        setTimeout(() => {
          button.style.transform = "scale(1)";
        }, 150);

        // Update stats
        this.updateJobStats();

        // Show success message
        this.showInlineToast(element, "Job added to your board!", "success");

        // Revert after 3 seconds
        setTimeout(() => {
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
            createIcon(ClipboardPlus, 12).outerHTML
          } Added</span>`;
          button.style.background = "EXT_COLORS.muted";
          button.disabled = true;
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error adding to job board:", error);
      button.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;">${
        createIcon(XCircle, 12).outerHTML
      } Error</span>`;
      button.style.background = "EXT_COLORS.destructive";

      // Show specific error message based on the error
      let errorMessage = "Failed to add job";
      if (error instanceof Error) {
        if (error.message.includes("sign in")) {
          errorMessage = "Please sign in to add jobs";
        } else if (error.message.includes("Permission")) {
          errorMessage = "Permission denied";
        } else if (error.message.includes("Rate limit")) {
          errorMessage = "Too many requests - try again later";
        }
      }

      this.showInlineToast(element, errorMessage, "error");

      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "EXT_COLORS.indigo";
        button.disabled = false;
      }, 3000);
    }
  }

  private getElementText(root: Element, selector: string): string | null {
    try {
      const el = root.querySelector(selector);
      return el ? el.textContent?.trim() || null : null;
    } catch {
      return null;
    }
  }

  private getElementHref(root: Element, selector: string): string | null {
    try {
      const el = root.querySelector(selector);
      if (el instanceof HTMLAnchorElement) {
        return el.href;
      }
      if (el) {
        const parentLink = el.closest('a[href]');
        if (parentLink instanceof HTMLAnchorElement) {
          return parentLink.href;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request: any) => {
  if (request.action === "togglePeopleSearch") {
    const peopleSearchBtn = document.getElementById(
      "hireall-people-search"
    ) as HTMLButtonElement;
    if (peopleSearchBtn) {
      peopleSearchBtn.click();
    }
    return true;
  }

  if (request.action === "triggerAutofill") {
    const autofillBtn = document.getElementById(
      "hireall-autofill"
    ) as HTMLButtonElement;
    if (autofillBtn && autofillBtn.style.display !== "none") {
      autofillBtn.click();
    }
    return true;
  }

  if (request.action === "toggleHighlight") {
    const highlightBtn = document.getElementById(
      "hireall-toggle"
    ) as HTMLButtonElement;
    if (highlightBtn) {
      highlightBtn.click();
    }
    return true;
  }

  if (request.action === "clearHighlights") {
    const jobTracker = new JobTracker();
    jobTracker.clearHighlights();
    return true;
  }

  // Handle other potential actions
  if (request.action) {
    console.log("Unhandled action:", request.action);
    return false;
  }

  return false;
});

function initHireallTracker() {
  chrome.storage.sync.get(["firebaseUid", "userId"], (result: { firebaseUid?: string; userId?: string }) => {
    const uid = result.firebaseUid || result.userId;
    if (uid) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => new JobTracker());
      } else {
        new JobTracker();
      }
    } else {
      console.log(
        "Hireall: user not signed in, extension features disabled on this page."
      );
    }
  });
}

initHireallTracker();