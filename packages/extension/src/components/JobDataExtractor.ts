/**
 * JobDataExtractor - LinkedIn-Only Job Extraction
 * 
 * This extractor is specifically optimized for LinkedIn job pages.
 * It validates that the current page is LinkedIn before extracting data.
 */

import { extractLinkedInJob } from "../job-tracker/jobExtractor";
import type { JobData } from "../job-tracker/types";

export type { JobData } from "../job-tracker/types";

// ============ CONSTANTS ============
const LINKEDIN_DOMAINS = ["linkedin.com", "www.linkedin.com"] as const;

const LINKEDIN_JOB_URL_PATTERNS = [
  /linkedin\.com\/jobs\/view\//,
  /linkedin\.com\/jobs\/search\//,
  /linkedin\.com\/jobs\/collections\//,
] as const;

// LinkedIn-specific job card selectors (2024/2025 design)
const LINKEDIN_JOB_CARD_SELECTORS = [
  // Job search results page
  ".jobs-search-results__list-item",
  ".job-card-container",
  ".scaffold-layout__list-item",
  // Job collections
  ".jobs-job-board-list__item",
  // Recommended jobs
  ".discovery-templates-entity-item",
  // Job detail page (the entire detail container)
  ".jobs-details",
  ".jobs-unified-top-card",
] as const;

// ============ VALIDATION ============
export interface ValidationResult {
  isValid: boolean;
  isLinkedIn: boolean;
  isJobPage: boolean;
  errorMessage?: string;
}

export function validatePage(): ValidationResult {
  const hostname = window.location.hostname.toLowerCase();
  const href = window.location.href;

  // Check if we're on LinkedIn
  const isLinkedIn = LINKEDIN_DOMAINS.some(domain => hostname.includes(domain));
  if (!isLinkedIn) {
    return {
      isValid: false,
      isLinkedIn: false,
      isJobPage: false,
      errorMessage: "HireAll job extraction only works on LinkedIn. Please navigate to LinkedIn Jobs.",
    };
  }

  // Check if we're on a jobs page
  const isJobPage = LINKEDIN_JOB_URL_PATTERNS.some(pattern => pattern.test(href));
  if (!isJobPage) {
    return {
      isValid: false,
      isLinkedIn: true,
      isJobPage: false,
      errorMessage: "Please navigate to a LinkedIn Jobs page to use job extraction.",
    };
  }

  return {
    isValid: true,
    isLinkedIn: true,
    isJobPage: true,
  };
}

// ============ SITE DETECTION ============
export function detectSite(): "linkedin" | "unsupported" {
  const hostname = window.location.hostname.toLowerCase();
  return LINKEDIN_DOMAINS.some(domain => hostname.includes(domain)) 
    ? "linkedin" 
    : "unsupported";
}

export function isLinkedIn(): boolean {
  return detectSite() === "linkedin";
}

// ============ JOB DATA EXTRACTION ============
export interface ExtractionResult {
  success: boolean;
  data?: JobData;
  error?: string;
  confidence: number;
}

/**
 * Extract job data from a LinkedIn element with validation and error handling
 */
export function extractJobData(element: Element): JobData {
  // Validate we're on LinkedIn
  if (!isLinkedIn()) {
    console.warn("HireAll: Job extraction is only supported on LinkedIn");
    return createEmptyJobData("unsupported");
  }

  try {
    const jobData = extractLinkedInJob(element);
    
    // Validate extracted data
    if (!isValidJobData(jobData)) {
      console.warn("HireAll: Extracted job data is incomplete", {
        title: jobData.title,
        company: jobData.company,
      });
    }

    return jobData;
  } catch (error) {
    console.error("HireAll: LinkedIn extraction failed", error);
    return createFallbackJobData(element);
  }
}

/**
 * Extract job data with confidence scoring
 */
export function extractJobDataWithConfidence(element: Element): ExtractionResult {
  if (!isLinkedIn()) {
    return {
      success: false,
      error: "Job extraction is only supported on LinkedIn",
      confidence: 0,
    };
  }

  try {
    const jobData = extractLinkedInJob(element);
    const confidence = calculateConfidence(jobData);

    if (confidence < 0.3) {
      return {
        success: false,
        data: jobData,
        error: "Low confidence extraction - data may be incomplete",
        confidence,
      };
    }

    return {
      success: true,
      data: jobData,
      confidence,
    };
  } catch (error) {
    const fallback = createFallbackJobData(element);
    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error.message : "Extraction failed",
      confidence: 0.1,
    };
  }
}

/**
 * Validate that job data has minimum required fields
 */
function isValidJobData(data: JobData): boolean {
  return !!(
    data.title &&
    data.title !== "Unknown role" &&
    data.company &&
    data.company !== "Unknown company" &&
    data.title.length >= 2 &&
    data.company.length >= 2
  );
}

/**
 * Calculate confidence score for extracted data (0-1)
 */
function calculateConfidence(data: JobData): number {
  let score = 0;
  const weights = {
    title: 0.25,
    company: 0.25,
    location: 0.1,
    url: 0.1,
    description: 0.15,
    salary: 0.05,
    postedDate: 0.05,
    jobType: 0.05,
  };

  if (data.title && data.title !== "Unknown role") score += weights.title;
  if (data.company && data.company !== "Unknown company") score += weights.company;
  if (data.location && data.location !== "Location not listed") score += weights.location;
  if (data.url && data.url.includes("linkedin.com/jobs")) score += weights.url;
  if (data.description && data.description.length > 100) score += weights.description;
  if (data.salary) score += weights.salary;
  if (data.postedDate) score += weights.postedDate;
  if (data.jobType) score += weights.jobType;

  return Math.min(score, 1);
}

// ============ JOB CARD DETECTION ============
/**
 * Find all job cards on the current LinkedIn page
 */
export function findJobCards(): Element[] {
  if (!isLinkedIn()) {
    console.warn("HireAll: findJobCards only works on LinkedIn");
    return [];
  }

  const matches = new Set<Element>();

  for (const selector of LINKEDIN_JOB_CARD_SELECTORS) {
    try {
      document.querySelectorAll(selector).forEach((node) => {
        if (node instanceof Element) {
          // Avoid duplicate cards
          if (!isDuplicateCard(matches, node)) {
            matches.add(node);
          }
        }
      });
    } catch {
      // Ignore invalid selector errors
    }
  }

  const cards = Array.from(matches);
  console.debug(`HireAll: Found ${cards.length} job cards on LinkedIn`);
  return cards;
}

/**
 * Check if a card is a duplicate of an existing one
 */
function isDuplicateCard(existingCards: Set<Element>, newCard: Element): boolean {
  // Check if the new card contains an existing card or vice versa
  for (const existing of existingCards) {
    if (existing.contains(newCard) || newCard.contains(existing)) {
      return true;
    }
  }
  return false;
}

// ============ FALLBACK EXTRACTION ============
/**
 * Create fallback job data using basic selectors when primary extraction fails
 */
function createFallbackJobData(element: Element): JobData {
  const textContent = element.textContent || "";
  
  // Try to extract title from any heading
  const title = 
    element.querySelector("h1, h2, h3, [class*='title']")?.textContent?.trim() ||
    "Unknown role";

  // Try to extract company
  const company = 
    element.querySelector("[class*='company'], a[href*='/company/']")?.textContent?.trim() ||
    "Unknown company";

  // Try to extract location
  const location = 
    element.querySelector("[class*='location'], [class*='bullet']")?.textContent?.trim() ||
    "Location not listed";

  return {
    title: normalizeText(title),
    company: normalizeText(company),
    location: normalizeText(location),
    url: window.location.href,
    source: "linkedin",
    dateFound: new Date().toISOString(),
    isSponsored: false,
    metadata: {
      remote: false,
      extractionMethod: "fallback",
    },
  };
}

/**
 * Create empty job data for unsupported sites
 */
function createEmptyJobData(source: string): JobData {
  return {
    title: "Unknown role",
    company: "Unknown company",
    location: "Location not listed",
    url: window.location.href,
    source,
    dateFound: new Date().toISOString(),
    isSponsored: false,
    metadata: {
      remote: false,
      extractionMethod: "empty",
      unsupportedSite: true,
    },
  };
}

/**
 * Normalize text by removing excess whitespace
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ============ DEPRECATED EXPORTS (for backwards compatibility) ============
/**
 * @deprecated Use detectSite() instead
 */
export const JobDataExtractor = {
  detectSite,
  extractJobData,
  findJobCards,
  /** @deprecated LinkedIn only - always returns "linkedin" or "unsupported" */
  detectSiteOld: detectSite,
};

export default JobDataExtractor;
