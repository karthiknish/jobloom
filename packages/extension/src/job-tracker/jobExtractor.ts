import type { JobData } from "./types";

export function extractLinkedInJob(element: Element): JobData {
  // Modern LinkedIn selectors (2024/2025) with fallbacks to legacy selectors
  const title =
    getText(element, [
      // Job detail page (new design)
      ".job-details-jobs-unified-top-card__job-title",
      ".job-details-jobs-unified-top-card__job-title-link",
      // Job detail page (legacy)
      "h1.top-card-layout__title",
      ".jobs-unified-top-card__job-title",
      // Job cards in list view (2024/2025)
      ".job-card-list__title",
      ".job-card-list__title--link",
      ".artdeco-entity-lockup__title",
      ".artdeco-entity-lockup__title a",
      ".job-card-container__link span",
      ".job-card-container__link",
      ".scaffold-layout__list-item h3",
      'a[data-control-name="job_card_title"]',
      '[data-test="job-title"]',
    ]) ?? "Unknown role";

  const company =
    getText(element, [
      // Job detail page (new design 2024/2025)
      ".job-details-jobs-unified-top-card__company-name a",
      ".job-details-jobs-unified-top-card__company-name",
      ".job-details-jobs-unified-top-card__primary-description-container a",
      // Job detail page (legacy)
      "a.topcard__org-name-link",
      "span.topcard__flavor",
      ".jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name",
      // Job cards in list view (2024/2025)
      ".job-card-container__company-name",
      ".job-card-container__primary-description",
      ".job-card-list__entity-lockup a[data-tracking-control-name*='company']",
      ".artdeco-entity-lockup__subtitle span",
      ".artdeco-entity-lockup__subtitle",
      // Search results
      ".entity-result__secondary-subtitle",
      ".job-card-search__company-name",
      // Legacy job cards
      ".job-card-list__company",
      ".jobs-company-name",
      '[data-test="company-name"]',
    ]) ?? "Unknown company";

  const url =
    getHref(element, [
      'a[data-control-name="job_card_click"]',
      'a[data-tracking-control-name="public_jobs_topcard-title"]',
      'a[href*="linkedin.com/jobs/view"]',
      ".job-card-container__link",
      ".job-card-list__title-link",
    ]) ?? window.location.href;

  const location =
    getText(element, [
      // Job detail page (new design)
      ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
      ".job-details-jobs-unified-top-card__bullet",
      // Job detail page (legacy)
      "span.topcard__flavor--bullet",
      ".jobs-unified-top-card__bullet",
      // Job cards
      ".job-card-container__metadata-item",
      ".job-card-list__location",
      ".artdeco-entity-lockup__caption",
      '[data-test="job-location"]',
    ]) ?? "Location not listed";

  const description =
    getText(element, [
      // Job detail page (new design)
      ".jobs-description__content",
      ".jobs-description-content__text",
      "#job-details",
      // Job detail page (legacy)
      "div.show-more-less-html__markup",
      // Job cards (limited description)
      ".job-card-list__description",
      ".job-card-container__details",
    ]) ?? undefined;

  const salary =
    getText(element, [
      // Job detail page (new design)
      ".job-details-jobs-unified-top-card__job-insight--highlight",
      ".job-details-jobs-unified-top-card__job-insight span",
      // Job detail page (legacy)
      ".jobs-unified-top-card__salary-info",
      ".compensation__salary",
      // Job cards
      ".job-card-container__salary",
      '[data-test="job-salary"]',
    ]) ?? undefined;

  const postedDateRaw =
    getText(element, [
      // Job detail page (new design)
      ".job-details-jobs-unified-top-card__primary-description-container time",
      ".jobs-unified-top-card__posted-date",
      // Job detail page (legacy)
      "span.topcard__flavor--metadata",
      // Job cards
      ".job-card-container__posted-date",
      ".job-card-list__time",
      "time",
    ]) ?? null;

  // Extract applicant count ("247 applicants", "Be among the first 25 applicants")
  const applicantCount = extractApplicantCount(element);

  // Detect Easy Apply status
  const easyApply = detectEasyApply(element);

  // Extract workplace type (Remote, Hybrid, On-site)
  const workplaceType = extractWorkplaceType(element);

  // Extract company logo URL
  const companyLogo = getCompanyLogo(element);

  const textSnapshot = (element.textContent ?? "").toLowerCase();
  const remoteFlag = workplaceType === "Remote" || detectRemote(textSnapshot);
  const seniority = detectSeniority(textSnapshot);

  const detailBuckets = extractJobDetails(element, description);
  const salaryRange = salary ? parseSalaryRange(salary) : undefined;

  return {
    title,
    company,
    location,
    url,
    description,
    salary,
    salaryRange,
    skills: detailBuckets.skills.length ? detailBuckets.skills : undefined,
    requirements: detailBuckets.requirements.length ? detailBuckets.requirements : undefined,
    benefits: detailBuckets.benefits.length ? detailBuckets.benefits : undefined,
    jobType: detectJobType(textSnapshot),
    experienceLevel: detectExperienceLevel(textSnapshot),
    remoteWork: remoteFlag,
    postedDate: normalizePostedDate(postedDateRaw),
    source: "linkedin",
    jobId: extractJobId(url),
    metadata: {
      remote: remoteFlag,
      seniority,
      applicantCount,
      easyApply,
      workplaceType,
      companyLogo,
    },
    isSponsored: detectSponsored(element),
    dateFound: new Date().toISOString(),
  };
}

// Extract applicant count from LinkedIn job postings
function extractApplicantCount(element: Element): number | undefined {
  const selectors = [
    ".job-details-jobs-unified-top-card__job-insight",
    ".jobs-unified-top-card__applicant-count",
    ".num-applicants__caption",
    '[data-test="applicant-count"]',
  ];

  for (const selector of selectors) {
    const el = element.querySelector(selector);
    if (el?.textContent) {
      const match = el.textContent.match(/(\d+)\s*applicant/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }

  // Try extracting from general text
  const text = element.textContent ?? "";
  const match = text.match(/(\d+)\s*applicant/i);
  return match ? parseInt(match[1], 10) : undefined;
}

// Detect if job has Easy Apply option
function detectEasyApply(element: Element): boolean {
  const selectors = [
    ".jobs-apply-button--top-card",
    '[data-test="apply-button"]',
    ".jobs-unified-top-card__apply-button",
    ".jobs-s-apply",
  ];

  for (const selector of selectors) {
    const el = element.querySelector(selector);
    if (el?.textContent?.toLowerCase().includes("easy apply")) {
      return true;
    }
  }

  // Check for LinkedIn Easy Apply indicator
  if (element.querySelector('[data-control-name="jobdetails_topcard_inapply"]')) {
    return true;
  }

  const text = element.textContent?.toLowerCase() ?? "";
  return text.includes("easy apply") || text.includes("linkedin apply");
}

// Extract workplace type (Remote, Hybrid, On-site)
function extractWorkplaceType(element: Element): string | undefined {
  const selectors = [
    ".job-details-jobs-unified-top-card__job-insight",
    ".job-details-jobs-unified-top-card__workplace-type",
    ".jobs-unified-top-card__workplace-type",
    '[data-test="workplace-type"]',
  ];

  for (const selector of selectors) {
    const el = element.querySelector(selector);
    const text = el?.textContent?.toLowerCase() ?? "";

    if (text.includes("remote")) return "Remote";
    if (text.includes("hybrid")) return "Hybrid";
    if (text.includes("on-site") || text.includes("onsite")) return "On-site";
  }

  // Check badges and pills
  const badges = Array.from(element.querySelectorAll(".artdeco-pill, .jobs-workplace-type-badge"));
  for (const badge of badges) {
    const text = badge.textContent?.toLowerCase() ?? "";
    if (text.includes("remote")) return "Remote";
    if (text.includes("hybrid")) return "Hybrid";
    if (text.includes("on-site") || text.includes("onsite")) return "On-site";
  }

  return undefined;
}

// Extract company logo URL
function getCompanyLogo(element: Element): string | undefined {
  const selectors = [
    ".job-details-jobs-unified-top-card__company-logo img",
    ".jobs-unified-top-card__company-logo img",
    ".artdeco-entity-image--square img",
    ".job-card-container__logo img",
    "[data-delayed-url]",
  ];

  for (const selector of selectors) {
    const img = element.querySelector(selector) as HTMLImageElement | null;
    if (img?.src && !img.src.includes("ghost")) {
      return img.src;
    }
    // Check for delayed loading images
    const delayedUrl = img?.getAttribute("data-delayed-url") || img?.getAttribute("data-ghost-url");
    if (delayedUrl) {
      return delayedUrl;
    }
  }

  return undefined;
}

function getText(element: Element, selectors: string[]): string | null {
  for (const selector of selectors) {
    try {
      const node = element.querySelector(selector);
      const value = node?.textContent?.trim();
      if (value) {
        return normalizeWhitespace(value);
      }
    } catch {
      // ignore selector errors
    }
  }
  return null;
}

function getHref(element: Element, selectors: string[]): string | null {
  for (const selector of selectors) {
    try {
      const node = element.querySelector(selector);
      if (!node) continue;

      if (node instanceof HTMLAnchorElement && node.href) {
        return node.href;
      }

      const href = (node as HTMLElement).getAttribute("href") || (node as any).href;
      if (href) {
        return href.startsWith("http") ? href : new URL(href, window.location.origin).toString();
      }
    } catch {
      // ignore selector errors
    }
  }
  return null;
}

function extractJobDetails(
  element: Element,
  description?: string | null
): { requirements: string[]; benefits: string[]; skills: string[] } {
  const items = Array.from(element.querySelectorAll("li"))
    .map((item) => item.textContent?.trim())
    .filter((text): text is string => !!text)
    .map(normalizeWhitespace);

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

  function categorize(text: string): void {
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
  }

  items.forEach(categorize);
  sentences.forEach(categorize);

  return {
    requirements: limit(Array.from(requirements), 8),
    benefits: limit(Array.from(benefits), 6),
    skills: limit(Array.from(skills), 10),
  };
}

function detectJobType(text: string): string | undefined {
  if (text.includes("full-time") || text.includes("full time")) return "Full-time";
  if (text.includes("part-time") || text.includes("part time")) return "Part-time";
  if (text.includes("contract")) return "Contract";
  if (text.includes("temporary")) return "Temporary";
  if (text.includes("intern")) return "Internship";
  if (text.includes("freelance") || text.includes("consultant")) return "Freelance";
  return undefined;
}

function detectExperienceLevel(text: string): string | undefined {
  if (text.includes("graduate") || text.includes("entry level")) return "Entry Level";
  if (text.includes("junior") || text.includes("associate")) return "Early Career";
  if (text.includes("mid level") || text.includes("mid-level") || text.includes("experienced")) return "Mid Level";
  if (text.includes("senior") || text.includes("lead")) return "Senior Level";
  if (text.includes("director") || text.includes("principal") || text.includes("executive")) return "Leadership";
  return undefined;
}

function detectRemote(text: string): boolean {
  return ["remote", "work from home", "hybrid", "flexible location", "distributed"].some((keyword) =>
    text.includes(keyword)
  );
}

function detectSeniority(text: string): string | undefined {
  if (text.includes("graduate") || text.includes("entry")) return "entry";
  if (text.includes("junior")) return "junior";
  if (text.includes("mid") || text.includes("experienced")) return "mid";
  if (text.includes("senior") || text.includes("lead")) return "senior";
  if (text.includes("director") || text.includes("principal")) return "leadership";
  return undefined;
}

function detectSponsored(element: Element): boolean {
  if (element.querySelector("[data-promoted='true']")) {
    return true;
  }

  return Array.from(element.querySelectorAll("span, div, label"))
    .map((node) => node.textContent?.toLowerCase() ?? "")
    .some((text) => ["sponsored", "promoted", "featured", "paid", "ad"].some((keyword) => text.includes(keyword)));
}

function parseSalaryRange(text: string): JobData["salaryRange"] | undefined {
  const cleanText = text.replace(/\s+/g, " ").trim();

  // Pattern 1: Range format - £50,000 - £70,000 or $80k-$100k
  const rangePatterns = [
    // Standard range: £50,000 - £70,000 per year
    /([£$€])\s?([\d,]+(?:\.\d{2})?)\s*[k]?\s*[-–to]+\s*([£$€])?\s?([\d,]+(?:\.\d{2})?)\s*[k]?\s*(?:(?:per|a|\/)\s*(year|annum|month|week|day|hour|hr|pa))?/i,
    // K format: £50k - £70k
    /([£$€])\s?([\d.]+)\s*k\s*[-–to]+\s*([£$€])?\s?([\d.]+)\s*k\s*(?:(?:per|a|\/)\s*(year|annum|month|week|day|hour|hr|pa))?/i,
    // Hourly: £15 - £20 per hour
    /([£$€])\s?([\d.]+)\s*[-–to]+\s*([£$€])?\s?([\d.]+)\s*(?:per|a|\/)\s*(hour|hr)/i,
    // Daily: £300 - £400 per day
    /([£$€])\s?([\d,]+)\s*[-–to]+\s*([£$€])?\s?([\d,]+)\s*(?:per|a|\/)\s*(day)/i,
  ];

  // Pattern 2: Single value - £50,000 or £50k
  const singlePatterns = [
    /([£$€])\s?([\d,]+(?:\.\d{2})?)\s*(?:(?:per|a|\/)\s*(year|annum|month|week|day|hour|hr|pa))?(?!\s*[-–to])/i,
    /([£$€])\s?([\d.]+)\s*k\s*(?:(?:per|a|\/)\s*(year|annum|pa))?/i,
  ];

  const parseNumber = (value: string, isK: boolean = false): number => {
    const cleaned = value.replace(/,/g, "");
    const num = parseFloat(cleaned);
    // Detect K format for small numbers
    if (isK || (num < 500 && !value.includes(","))) {
      return num * 1000;
    }
    return num;
  };

  const normalizePeriod = (period?: string): string => {
    if (!period) return "year";
    const lower = period.toLowerCase();
    if (lower === "annum" || lower === "pa") return "year";
    if (lower === "hr") return "hour";
    return lower;
  };

  // Try range patterns first
  for (const pattern of rangePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const [, minCurrency, minValue, , maxValue, period] = match;
      const isKFormat = cleanText.toLowerCase().includes("k");
      const min = parseNumber(minValue, isKFormat && !minValue.includes(","));
      const max = parseNumber(maxValue, isKFormat && !maxValue.includes(","));

      if (min > 0 || max > 0) {
        return {
          min,
          max: max || min,
          currency: minCurrency,
          period: normalizePeriod(period),
        };
      }
    }
  }

  // Try single value patterns
  for (const pattern of singlePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const [, currency, value, period] = match;
      const isKFormat = cleanText.toLowerCase().includes("k");
      const amount = parseNumber(value, isKFormat);

      if (amount > 0) {
        return {
          min: amount,
          max: amount,
          currency,
          period: normalizePeriod(period),
        };
      }
    }
  }

  // Check for negotiable/DOE indicators
  const negotiablePatterns = [
    /competitive salary/i,
    /salary negotiable/i,
    /doe|depending on experience/i,
    /market rate/i,
  ];

  if (negotiablePatterns.some(p => p.test(cleanText))) {
    return {
      min: undefined,
      max: undefined,
      currency: "£",
      period: "year",
    };
  }

  return undefined;
}

function normalizePostedDate(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const text = raw.trim();
  if (!text) return undefined;

  const relative = text.match(/(\d+)\s+(hour|day|week|month|year)s?\s+ago/i);
  if (relative) {
    const value = Number(relative[1]);
    const unit = relative[2].toLowerCase();
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

  const explicit = text.match(/posted on\s+(.*)/i);
  if (explicit) {
    const parsed = new Date(explicit[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return text;
}

function extractJobId(url: string): string | undefined {
  const match = url.match(/jobs\/view\/(\d+)/);
  return match ? match[1] : undefined;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function limit<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}
