export interface JobData {
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
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  sponsorshipType?: string;
  isRecruitmentAgency?: boolean;
  dateFound: string;
  source: string;
  jobId?: string;
}

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
    const title = this.getFirstMatch(element, this.TITLE_SELECTORS[site]) ?? "Unknown role";
    const company = this.getFirstMatch(element, this.COMPANY_SELECTORS[site]) ?? "Unknown company";
    const location = this.getFirstMatch(element, this.LOCATION_SELECTORS[site]) ?? "Location not listed";
    const url = this.getLink(element, this.URL_SELECTORS[site]) ?? window.location.href;

    return {
      title,
      company,
      location,
      url,
      description: this.extractDescription(element, site),
      salary: this.extractSalary(element, site) ?? undefined,
      postedDate: this.getFirstMatch(element, this.POSTED_DATE_SELECTORS[site]) ?? undefined,
      isSponsored: this.detectSponsored(element, site),
      dateFound: new Date().toISOString(),
      source: site,
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
