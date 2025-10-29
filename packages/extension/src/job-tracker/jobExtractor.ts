import type { JobData } from "./types";

export function extractLinkedInJob(element: Element): JobData {
  const title =
    getText(element, [
      "h1.top-card-layout__title",
      ".jobs-unified-top-card__job-title",
      ".job-card-list__title",
      ".job-card-container__link",
    ]) ?? "Unknown role";

  const company =
    getText(element, [
      "a.topcard__org-name-link",
      "span.topcard__flavor",
      ".job-card-container__primary-description",
      ".job-card-list__company",
    ]) ?? "Unknown company";

  const url =
    getHref(element, [
      'a[data-control-name="job_card_click"]',
      'a[data-tracking-control-name="public_jobs_topcard-title"]',
      'a[href*="linkedin.com/jobs/view"]',
    ]) ?? window.location.href;

  const location =
    getText(element, [
      "span.topcard__flavor--bullet",
      ".jobs-unified-top-card__bullet",
      ".job-card-container__metadata-item",
      ".job-card-list__location",
    ]) ?? "Location not listed";

  const description =
    getText(element, [
      "div.show-more-less-html__markup",
      ".jobs-description__content",
      ".job-card-list__description",
      ".job-card-container__details",
    ]) ?? undefined;

  const salary =
    getText(element, [
      ".jobs-unified-top-card__salary-info",
      ".job-card-container__salary",
    ]) ?? undefined;

  const postedDateRaw =
    getText(element, [
      "span.topcard__flavor--metadata",
      ".jobs-unified-top-card__posted-date",
      ".job-card-container__posted-date",
    ]) ?? null;

  const textSnapshot = (element.textContent ?? "").toLowerCase();
  const remoteFlag = detectRemote(textSnapshot);
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
    },
    isSponsored: detectSponsored(element),
    dateFound: new Date().toISOString(),
  };
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
