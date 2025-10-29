import { extractLinkedInJob } from "../job-tracker/jobExtractor";
import type { JobData } from "../job-tracker/types";

export type { JobData } from "../job-tracker/types";

type SelectorMap = Record<string, string[]>;

export class JobDataExtractor {
  static detectSite(): string {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes("linkedin")) return "linkedin";
    if (hostname.includes("indeed")) return "indeed";
    if (hostname.includes("reed")) return "reed";
    if (hostname.includes("totaljobs")) return "totaljobs";
    if (hostname.includes("glassdoor")) return "glassdoor";
    if (hostname.includes("ziprecruiter")) return "ziprecruiter";
    if (hostname.includes("monster")) return "monster";

    return "unknown";
  }

  static extractJobData(element: Element): JobData {
    const site = this.detectSite();
    if (site === "linkedin") {
      try {
        return extractLinkedInJob(element);
      } catch (error) {
        console.warn("Hireall: LinkedIn extraction fallback", error);
      }
    }

    const title = this.getFirstMatch(element, this.TITLE_SELECTORS[site]) ?? "Unknown role";
    const company = this.getFirstMatch(element, this.COMPANY_SELECTORS[site]) ?? "Unknown company";
    const location = this.getFirstMatch(element, this.LOCATION_SELECTORS[site]) ?? "Location not listed";
    const url = this.getLink(element, this.URL_SELECTORS[site]) ?? window.location.href;

    const description = this.extractDescription(element, site) ?? undefined;
    const salary = this.extractSalary(element, site) ?? undefined;
    const postedDate = this.getFirstMatch(element, this.POSTED_DATE_SELECTORS[site]) ?? undefined;
    const textSnapshot = (element.textContent ?? "").toLowerCase();
    const details = this.extractDetails(element, description);
    const remoteFlag = this.detectRemote(textSnapshot);
    const salaryRange = salary ? this.parseSalaryRange(salary) : undefined;
    const seniority = this.detectSeniority(textSnapshot);

    return {
      title,
      company,
      location,
      url,
      description,
      salary,
      salaryRange,
      postedDate,
      jobType: this.detectJobType(textSnapshot),
      experienceLevel: this.detectExperienceLevel(textSnapshot),
      remoteWork: remoteFlag,
      skills: details.skills.length ? details.skills : undefined,
      requirements: details.requirements.length ? details.requirements : undefined,
      benefits: details.benefits.length ? details.benefits : undefined,
      isSponsored: this.detectSponsored(element, site),
      dateFound: new Date().toISOString(),
      source: site,
      metadata: {
        remote: remoteFlag,
        seniority,
      },
    };
  }

  static findJobCards(): Element[] {
    const site = this.detectSite();
    const selectors = this.JOB_CARD_SELECTORS[site] ?? this.JOB_CARD_SELECTORS.unknown;
    const matches = new Set<Element>();

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (node instanceof Element) {
          matches.add(node);
        }
      });
    });

    return Array.from(matches);
  }

  private static readonly TITLE_SELECTORS: SelectorMap = {
    linkedin: [
      "h1.top-card-layout__title",
      ".jobs-unified-top-card__job-title",
      ".job-card-list__title",
      ".job-card-container__link",
    ],
    indeed: ["[data-testid='jobTitle']", ".jobTitle", ".jobtitle", ".jobTitle-text"],
    reed: [".job-title", "h1", "h2"],
    totaljobs: ["[data-automation='job-title']", ".job-title", "h2"],
    glassdoor: ["[data-test='job-title']", ".job-title", "h2"],
    ziprecruiter: ["h1", ".job_title"],
    monster: ["h1", ".job-title"],
    unknown: ["h1", "h2", "[data-testid*='title']", ".job-title"],
  };

  private static readonly COMPANY_SELECTORS: SelectorMap = {
    linkedin: [
      "a.topcard__org-name-link",
      "span.topcard__flavor",
      ".job-card-container__primary-description",
      ".job-card-list__company",
    ],
    indeed: ["[data-testid='companyName']", ".companyName", ".company"],
    reed: [".company", "[data-testid='company-name']"],
    totaljobs: ["[data-automation='jobCompany']", ".company"],
    glassdoor: ["[data-test='employer-name']", ".job-info__company"],
    ziprecruiter: [".hiring-company", ".company_name"],
    monster: [".company", ".company-name"],
    unknown: [".company", ".employer", "[data-testid*='company']"],
  };

  private static readonly LOCATION_SELECTORS: SelectorMap = {
    linkedin: [
      "span.topcard__flavor--bullet",
      ".jobs-unified-top-card__bullet",
      ".job-card-container__metadata-item",
    ],
    indeed: ["[data-testid='text-location']", ".companyLocation", ".jobLocation", ".location"],
    reed: [".location", "[data-testid='location']"],
    totaljobs: ["[data-automation='job-location']", ".location"],
    glassdoor: ["[data-test='location']", ".location"],
    ziprecruiter: [".location", "[itemprop='addressLocality']"],
    monster: [".location", "[data-testid='location']"],
    unknown: [".location", ".job-location", "[data-testid*='location']"],
  };

  private static readonly URL_SELECTORS: SelectorMap = {
    linkedin: ["a[data-control-name='job_card_click']", "a[href*='/jobs/view']"],
    indeed: ["a[data-testid='jobTitle']", "a.jobtitle"],
    reed: ["a[href*='/jobs/']"],
    totaljobs: ["a[href*='/job/']"],
    glassdoor: ["a[data-test='job-title-link']"],
    ziprecruiter: ["a[href*='/jobs/']"],
    monster: ["a[href*='/job/']"],
    unknown: ["a[href*='/job']", "a[href*='viewjob']"],
  };

  private static readonly POSTED_DATE_SELECTORS: SelectorMap = {
    linkedin: [
      "span.topcard__flavor--metadata",
      ".jobs-unified-top-card__posted-date",
      ".job-card-container__listed-time",
    ],
    indeed: [".date", "[data-testid='myJobsStateDate']"],
    reed: [".posted-date", "[data-testid='posted-date']"],
    totaljobs: ["[data-automation='job-date']", ".date"],
    glassdoor: ["[data-test='job-age']", ".job-info__age"],
    ziprecruiter: [".job-age"],
    monster: ["time", ".posted"],
    unknown: [".date", "time", "[data-testid*='posted']"],
  };

  private static readonly JOB_CARD_SELECTORS: SelectorMap = {
    linkedin: [".jobs-search-results__list-item", ".job-card-container"],
    indeed: [".jobsearch-SerpJobCard", "[data-testid='result']"],
    reed: [".job-result", ".job-card"],
    totaljobs: ["[data-automation='job-card']", ".job-card"],
    glassdoor: ["[data-test='jobListing']", ".job-card"],
    ziprecruiter: ["article", ".job-result"],
    monster: [".card-content", ".job-card"],
    unknown: ["article", "li", "div[data-job-id]"],
  };

  private static getFirstMatch(element: Element, selectors: string[] = []): string | null {
    for (const selector of selectors) {
      try {
        const node = element.querySelector(selector);
        const value = node?.textContent?.trim();
        if (value) {
          return value;
        }
      } catch {
        // Ignore invalid selectors
      }
    }

    return null;
  }

  private static getLink(element: Element, selectors: string[] = []): string | null {
    for (const selector of selectors) {
      try {
        const node = element.querySelector(selector);
        if (!node) continue;

        if (node instanceof HTMLAnchorElement && node.href) {
          return node.href;
        }

        const href = (node as HTMLElement).getAttribute("href") || (node as any).href;
        if (href) {
          return new URL(href, window.location.href).toString();
        }
      } catch {
        // Ignore invalid selectors
      }
    }

    return null;
  }

  private static extractDescription(element: Element, site: string): string | undefined {
    const selectorsBySite: SelectorMap = {
      linkedin: [
        ".jobs-description__content",
        ".jobs-box__html-content",
        ".jobs-description-content__text",
      ],
      indeed: ["#jobDescriptionText", ".jobsearch-jobDescriptionText"],
      reed: [".job-description", "[data-testid='jobDescription']"],
      totaljobs: ["[data-automation='job-description']", ".job-description"],
      glassdoor: ["[data-test='jobDescriptionContent']", ".job-details__content"],
      ziprecruiter: [".job_details", "[data-company-name]"],
      monster: [".job-description", "section[data-testid='job-details']"],
      unknown: ["[data-testid*='description']", ".description", "article"],
    };

    return this.getFirstMatch(element, selectorsBySite[site] ?? selectorsBySite.unknown) ?? undefined;
  }

  private static extractSalary(element: Element, site: string): string | null {
    const selectorsBySite: SelectorMap = {
      linkedin: [
        ".jobs-unified-top-card__salary-info",
        ".job-card-container__salary",
      ],
      indeed: [
        "[data-testid='salary']",
        "[data-testid='detailSalary']",
        ".salary-snippet-container",
      ],
      reed: [".salary", "[data-testid='salary']"],
      totaljobs: ["[data-automation='job-salary']", ".salary"],
      glassdoor: ["[data-test='detailSalary']", ".salary"],
      ziprecruiter: [".job-salary"],
      monster: [".salary", "[data-testid='salary']"],
      unknown: [".salary", "[data-testid*='salary']"],
    };

    return this.getFirstMatch(element, selectorsBySite[site] ?? selectorsBySite.unknown);
  }

  private static extractDetails(
    element: Element,
    description?: string | null
  ): { requirements: string[]; benefits: string[]; skills: string[] } {
    const bulletItems = Array.from(element.querySelectorAll("li"))
      .map((item) => item.textContent?.trim())
      .filter((text): text is string => !!text)
      .map(this.normalizeWhitespace);

    const sentences = (description ?? "")
      .split(/[\n.]+/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 6 && line.length <= 160);

    const requirementKeywords = [
      "require",
      "must",
      "need",
      "responsible",
      "experience",
      "knowledge",
      "ability",
      "background",
      "qualification",
      "certification",
      "essential",
    ];
    const benefitKeywords = [
      "benefit",
      "bonus",
      "package",
      "holiday",
      "pension",
      "insurance",
      "support",
      "allowance",
      "perk",
      "wellbeing",
      "well-being",
      "leave",
      "flexible",
    ];
    const skillIndicators = [
      "skill",
      "proficient",
      "proficiency",
      "experience",
      "knowledge",
      "familiar",
      "ability",
      "competent",
      "expertise",
      "capable",
    ];

    const requirements = new Set<string>();
    const benefits = new Set<string>();
    const skills = new Set<string>();

    const categorize = (text: string) => {
      const lower = text.toLowerCase();
      if (benefitKeywords.some((keyword) => lower.includes(keyword))) {
        benefits.add(text);
        return;
      }

      if (requirementKeywords.some((keyword) => lower.includes(keyword)) || /^\d+\+?\s*year/.test(lower)) {
        requirements.add(text);
        return;
      }

      if (skillIndicators.some((keyword) => lower.includes(keyword))) {
        skills.add(text);
      }
    };

    bulletItems.forEach(categorize);
    sentences.forEach(categorize);

    return {
      requirements: this.limitList(Array.from(requirements), 8),
      benefits: this.limitList(Array.from(benefits), 6),
      skills: this.limitList(Array.from(skills), 10),
    };
  }

  private static detectJobType(text: string): string | undefined {
    if (text.includes("full-time") || text.includes("full time")) return "Full-time";
    if (text.includes("part-time") || text.includes("part time")) return "Part-time";
    if (text.includes("contract")) return "Contract";
    if (text.includes("temporary")) return "Temporary";
    if (text.includes("intern")) return "Internship";
    if (text.includes("freelance") || text.includes("consultant")) return "Freelance";
    return undefined;
  }

  private static detectExperienceLevel(text: string): string | undefined {
    if (text.includes("graduate") || text.includes("entry level")) return "Entry Level";
    if (text.includes("junior") || text.includes("associate")) return "Early Career";
    if (text.includes("mid level") || text.includes("mid-level") || text.includes("experienced")) return "Mid Level";
    if (text.includes("senior") || text.includes("lead")) return "Senior Level";
    if (text.includes("director") || text.includes("principal") || text.includes("executive")) return "Leadership";
    return undefined;
  }

  private static detectRemote(text: string): boolean {
    return ["remote", "work from home", "hybrid", "flexible location", "distributed"].some((keyword) =>
      text.includes(keyword)
    );
  }

  private static detectSeniority(text: string): string | undefined {
    if (text.includes("graduate") || text.includes("entry")) return "entry";
    if (text.includes("junior")) return "junior";
    if (text.includes("mid") || text.includes("experienced")) return "mid";
    if (text.includes("senior") || text.includes("lead")) return "senior";
    if (text.includes("director") || text.includes("principal")) return "leadership";
    return undefined;
  }

  private static parseSalaryRange(text: string): JobData["salaryRange"] | undefined {
    const match = text.match(
      /(\$|£|€)?\s?(\d[\d,]*)(?:\s*-\s*(\$|£|€)?\s?(\d[\d,]*))?(?:\s*(?:per|a)?\s*(year|annum|month|week|day|hour))?/i
    );

    if (!match) {
      return undefined;
    }

    const [, minCurrency, minValue, maxCurrency, maxValue, periodRaw] = match;
    const parseNumber = (value?: string) => (value ? Number(value.replace(/,/g, "")) : undefined);

    const min = parseNumber(minValue);
    const max = parseNumber(maxValue);
    const currency = minCurrency || maxCurrency || undefined;
    const period = periodRaw ? periodRaw.toLowerCase().replace("annum", "year") : "year";

    if (!min && !max) {
      return undefined;
    }

    return {
      min,
      max: max ?? min,
      currency,
      period,
    };
  }

  private static normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }

  private static limitList<T>(items: T[], max: number): T[] {
    return items.slice(0, max);
  }

  private static detectSponsored(element: Element, site: string): boolean {
    const sponsoredSelectors: SelectorMap = {
      linkedin: ["[data-promoted='true']", "[data-search-id*='promoted']"],
      indeed: ["[data-testid='sponsored-tag']", "[data-tn-component='sponsoredJob']"],
      reed: [".sponsored"],
      totaljobs: [".sponsored"],
      glassdoor: [".sponsored"],
      ziprecruiter: [".sponsored"],
      monster: [".sponsored"],
      unknown: [".sponsored", "[data-promoted='true']"],
    };

    const keywordMatches = ["sponsored", "promoted", "ad", "advert"].some((keyword) =>
      element.textContent?.toLowerCase().includes(keyword)
    );

    const selectorMatch = !!this.getFirstMatch(element, sponsoredSelectors[site] ?? sponsoredSelectors.unknown);

    return selectorMatch || keywordMatches;
  }
}
