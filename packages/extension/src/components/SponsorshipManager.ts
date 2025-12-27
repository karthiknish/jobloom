import { sponsorBatchLimiter } from "../rateLimiter";
import { get } from "../apiClient";
import { fetchSponsorRecord as fetchSponsorLookup, SponsorLookupResult } from "../sponsorship/lookup";
import { sponsorshipCache, socCodeCache } from "../sponsorship/cache";
import { type JobData as JobDescriptionData } from "../parsers";
import { UserProfileManager, type UserVisaCriteria } from "../components/UserProfileManager";
import { ExtensionMessageHandler } from "../components/ExtensionMessageHandler";
import {
  UK_SALARY_THRESHOLDS,
  UK_HOURLY_RATES,
  UK_THRESHOLD_INFO,
  UK_RQF_LEVELS,
  getApplicableThreshold,
  formatSalaryGBP,
} from "@hireall/shared";
import type { UkThresholdType } from "@hireall/shared";

// ============ RETRY UTILITIES ============
const MAX_RETRIES = 2;
const INITIAL_DELAY_MS = 300;
const MAX_DELAY_MS = 2000;

const SPONSOR_LIMITER_OPERATION_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Execute a function with exponential backoff retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_DELAY_MS,
    maxDelay = MAX_DELAY_MS,
    shouldRetry = defaultShouldRetry,
  } = config;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error) || attempt === maxRetries) {
        console.warn(`Hireall: ${operationName} failed after ${attempt} attempts:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
      const delay = Math.min(baseDelay + jitter, maxDelay);

      console.debug(`Hireall: ${operationName} attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Default retry condition - retry on network/timeout errors, not on auth/validation errors
 */
function defaultShouldRetry(error: unknown): boolean {
  if (!error) return false;

  // Don't retry auth errors
  if (error && typeof error === 'object') {
    const statusCode = (error as any).statusCode;
    if (statusCode === 401 || statusCode === 403 || statusCode === 400 || statusCode === 404) {
      return false;
    }

    // Don't retry rate limit errors (should use rate limiter instead)
    if ((error as any).rateLimitInfo) {
      return false;
    }
  }

  // Check for network-related error messages
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Retry on network errors, timeouts, and server errors
  if (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('aborted') ||
    message.includes('unavailable') ||
    message.includes('econnreset') ||
    message.includes('socket hang up')
  ) {
    return true;
  }

  // Retry on 5xx server errors
  if (error && typeof error === 'object') {
    const statusCode = (error as any).statusCode;
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return true;
    }
  }

  return false;
}

// NOTE: Local caches removed - now using shared sponsorshipCache and socCodeCache from sponsorship/cache.ts

interface SocCodeDetails {
  code: string;
  jobType: string;
  relatedTitles: string[];
  eligibility: string;
  /** Occupation-specific minimum salary from 2024 ASHE data */
  goingRate?: number;
  /** RQF skill level (3-6+). July 2025 requires RQF 6 for most roles */
  rqfLevel?: number;
  /** Whether this occupation is on the Immigration Salary List */
  isOnISL?: boolean;
  /** Whether this occupation is on the Temporary Shortage List (expires Dec 2026) */
  isOnTSL?: boolean;
  /** Whether this is a Health & Care eligible role */
  isHealthCare?: boolean;
}

export interface UkEligibilityAssessment {
  eligible: boolean;
  reasons: string[];
  socCode?: string;
  socTitle?: string;
  socEligibility?: string;
  salaryThreshold?: number;
  salaryOffered?: number;
  meetsSalaryRequirement?: boolean;
  /** Type of threshold applied (general, isl, new_entrant, etc) */
  thresholdType?: UkThresholdType;
  /** Whether the occupation is on the Immigration Salary List */
  isOnISL?: boolean;
  /** Whether the occupation is on the Temporary Shortage List */
  isOnTSL?: boolean;
  /** RQF skill level of the occupation */
  rqfLevel?: number;
  /** Required hourly rate */
  hourlyRateRequired?: number;
}

export interface SponsorshipRecord {
  company: string;
  isSponsored: boolean;
  sponsorshipType?: string;
  route?: string;
  name?: string;
  city?: string;
  isSkilledWorker?: boolean;
  jobDescriptionSponsorshipMentioned?: boolean;
  jobDescriptionSponsorshipType?: string;
  jobDescriptionSponsorshipRequirements?: string[];
  socCode?: string;
  occupationTitle?: string;
  socEligibility?: string;
  skillMatchScore?: number;
  salary?: any;
  isAboveMinimumThreshold?: boolean;
  ukEligibility?: UkEligibilityAssessment;
}

export class SponsorshipManager {
  static async fetchSponsorRecord(
    company: string,
    jobDescription?: JobDescriptionData
  ): Promise<SponsorshipRecord | null> {
    const key = `manager:${company.toLowerCase().trim()}`;

    // Check cache first
    const cached = sponsorshipCache.get<SponsorshipRecord | null>(key);
    if (cached !== null && sponsorshipCache.has(key)) {
      if (!cached) {
        return null;
      }

      if (jobDescription) {
        return this.enhanceSponsorRecordWithJobContext({ ...cached }, jobDescription);
      }

      return { ...cached };
    }

    // Use getOrFetch for deduplication
    return sponsorshipCache.getOrFetch<SponsorshipRecord | null>(
      key,
      () => this.runWithSponsorLimit(async () => {
      console.debug("Hireall: Making API call for sponsor lookup:", company);
      try {
        // Extract location from job description if available
        const locationOptions = jobDescription?.company ? {
          location: jobDescription?.location || undefined,
        } : undefined;
        
        // Use retry wrapper for robust API calls
        const sponsorRecord = await withRetry(
          () => fetchSponsorLookup(company, locationOptions),
          `sponsorLookup(${company})`
        );
        if (sponsorRecord) {
          const baseRecord = this.mapApiRecordToSponsorship(sponsorRecord);
          if (jobDescription) {
            console.debug("Hireall: Enhancing sponsor record with job context for", company);
            return await this.enhanceSponsorRecordWithJobContext({ ...baseRecord }, jobDescription);
          }

          return baseRecord;
        }

        return null;
      } catch (e: any) {
        console.warn("Sponsorship lookup failed", e);
        if (e?.rateLimitInfo) {
          console.warn(
            `Rate limit hit for sponsor lookup: ${e.rateLimitInfo.remaining} remaining, resets in ${e.rateLimitInfo.resetIn}ms`
          );
        } else if (e?.statusCode === 401) {
          console.warn(`Authentication failed for sponsor lookup: ${e.message}`);
          try {
            const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
            if (syncResult?.userId) {
              console.log("Hireall: Auth state refreshed, retrying sponsor lookup");
              const retryRecord = await fetchSponsorLookup(company);
              if (retryRecord) {
                const baseRecord = this.mapApiRecordToSponsorship(retryRecord);
                sponsorshipCache.set(key, baseRecord);
                if (jobDescription) {
                  return await this.enhanceSponsorRecordWithJobContext({ ...baseRecord }, jobDescription);
                }
                return baseRecord;
              }
            }
          } catch (retryError) {
            console.warn("Hireall: Retry after auth refresh also failed", retryError);
          }
        } else if (e?.statusCode === 403) {
          console.warn(`Permission denied for sponsor lookup: ${e.message}`);
        } else if (e.message && e.message.includes('CORS')) {
          console.warn(`CORS error for sponsor lookup: ${e.message}`);
          console.info("Hireall: This is a server-side CORS issue. The extension is authenticated but the server needs to allow requests from LinkedIn.");
        } else if (e.message && e.message.includes('Failed to fetch')) {
          console.warn(`Network error for sponsor lookup: ${e.message}`);
          console.info("Hireall: This could be a CORS issue or network connectivity problem.");
        }

          return null;
        }
      })
    );
  }

  private static async runWithSponsorLimit<T>(fn: () => Promise<T>): Promise<T> {
    return sponsorBatchLimiter.add(() => withTimeout(fn(), SPONSOR_LIMITER_OPERATION_TIMEOUT_MS, "Sponsor lookup"));
  }

  private static mapApiRecordToSponsorship(record: SponsorLookupResult): SponsorshipRecord {
    return {
      company: record.name ?? record.company ?? "",
      isSponsored: record.eligibleForSponsorship,
      sponsorshipType: record.sponsorshipType ?? record.route,
      route: record.route,
      name: record.name ?? record.company,
      city: record.city,
      isSkilledWorker: record.isSkilledWorker,
    };
  }

  static async enhanceSponsorRecordWithJobContext(
    record: SponsorshipRecord,
    jobDescription?: JobDescriptionData
  ): Promise<SponsorshipRecord> {
    if (!jobDescription) return record;

    const enhanced: SponsorshipRecord = { ...record };

    enhanced.jobDescriptionSponsorshipMentioned = jobDescription.visaSponsorship?.mentioned || false;
    enhanced.jobDescriptionSponsorshipType = jobDescription.visaSponsorship?.type;
    enhanced.jobDescriptionSponsorshipRequirements = jobDescription.visaSponsorship?.requirements;

    if (jobDescription.socCode) {
      enhanced.socCode = jobDescription.socCode;
      enhanced.occupationTitle = jobDescription.socMatch?.title;
    }

    if (record.route && jobDescription.skills) {
      enhanced.skillMatchScore = this.calculateSkillMatchScore(record.route, jobDescription.skills);
    }

    if (jobDescription.salary) {
      enhanced.salary = jobDescription.salary;
      const relevantSalary = jobDescription.salary.min ?? jobDescription.salary.max;

      if (typeof relevantSalary === "number") {
        const thresholdResult = jobDescription.socCode
          ? this.getMinimumSalaryForSOC(jobDescription.socCode)
          : { threshold: UK_SALARY_THRESHOLDS.GENERAL, thresholdType: 'general' as UkThresholdType, hourlyRate: UK_HOURLY_RATES.STANDARD };
        enhanced.isAboveMinimumThreshold = relevantSalary >= thresholdResult.threshold;
      } else {
        enhanced.isAboveMinimumThreshold = undefined;
      }
    }

    if (jobDescription.socCode) {
      const socDetails = await this.fetchSocDetails(jobDescription.socCode);
      if (socDetails) {
        enhanced.socEligibility = socDetails.eligibility;
        if (!enhanced.occupationTitle) {
          enhanced.occupationTitle = socDetails.jobType;
        }
      }
      
      const userCriteria = await this.getUserCriteria();
      enhanced.ukEligibility = this.evaluateUkEligibility({
        jobDescription,
        socDetails,
        isSkilledWorker: enhanced.isSkilledWorker,
        userCriteria,
      });
    } else {
      const userCriteria = await this.getUserCriteria();
      enhanced.ukEligibility = this.evaluateUkEligibility({
        jobDescription,
        socDetails: null,
        isSkilledWorker: enhanced.isSkilledWorker,
        userCriteria,
      });
    }

    return enhanced;
  }

  private static async getUserCriteria(): Promise<UserVisaCriteria | undefined> {
    try {
      return await UserProfileManager.getUserVisaCriteria();
    } catch (error) {
      console.warn("Hireall: Failed to get user visa criteria", error);
      return undefined;
    }
  }

  static calculateSkillMatchScore(
    sponsorRoute: string,
    jobSkills: string[]
  ): number {
    if (!jobSkills || jobSkills.length === 0) return 0;

    const requiredSkills = this.getRequiredSkillsForSponsorRoute(sponsorRoute);
    const matches = jobSkills.filter((skill) =>
      requiredSkills.some((req) => skill.toLowerCase().includes(req.toLowerCase()))
    );

    return requiredSkills.length ? Math.round((matches.length / requiredSkills.length) * 100) : 0;
  }

  static getRequiredSkillsForSponsorRoute(sponsorRoute: string): string[] {
    const routeSkills: Record<string, string[]> = {
      "software developer": ["javascript", "python", "react", "node.js"],
      "data analyst": ["sql", "python", "excel", "tableau"],
      "project manager": ["project management", "agile", "scrum", "stakeholder management"],
      "marketing manager": ["marketing", "digital marketing", "seo", "analytics"],
      "software engineer": ["java", "python", "c++", "system design"],
    };

    return routeSkills[sponsorRoute.toLowerCase()] || [];
  }

  /**
   * Get the minimum salary threshold for a SOC code
   * Uses occupation-specific going rates from Firebase when available,
   * otherwise falls back to general threshold based on category
   */
  static getMinimumSalaryForSOC(
    socCode: string,
    options: {
      goingRate?: number;
      isOnISL?: boolean;
      isOnTSL?: boolean;
      isHealthCare?: boolean;
      isNewEntrant?: boolean;
    } = {}
  ): { threshold: number; thresholdType: UkThresholdType; hourlyRate: number } {
    const { goingRate, isOnISL, isOnTSL, isHealthCare, isNewEntrant } = options;

    // Determine which threshold category applies
    const thresholdInfo = getApplicableThreshold({
      isOnISL,
      isOnTSL,
      isHealthCare,
      isNewEntrant,
    });

    // The minimum is the higher of: category threshold OR occupation going rate
    const categoryThreshold = thresholdInfo.annualSalary;
    const effectiveThreshold = goingRate ? Math.max(categoryThreshold, goingRate) : categoryThreshold;

    return {
      threshold: effectiveThreshold,
      thresholdType: thresholdInfo.type,
      hourlyRate: thresholdInfo.hourlyRate,
    };
  }

  /**
   * @deprecated Use getMinimumSalaryForSOC with options instead
   * Legacy method for backward compatibility - returns just the threshold number
   */
  static getMinimumSalaryThreshold(socCode: string, goingRate?: number): number {
    const result = this.getMinimumSalaryForSOC(socCode, { goingRate });
    return result.threshold;
  }

  static clearCache(): void {
    sponsorshipCache.clear();
    socCodeCache.clear();
  }

  static getCacheSize(): number {
    return sponsorshipCache.size;
  }

  static async assessUkEligibility(jobDescription?: JobDescriptionData): Promise<UkEligibilityAssessment | undefined> {
    if (!jobDescription) return undefined;

    const socDetails = jobDescription.socCode ? await this.fetchSocDetails(jobDescription.socCode) : null;
    const userCriteria = await this.getUserCriteria();

    return this.evaluateUkEligibility({
      jobDescription,
      socDetails,
      isSkilledWorker: undefined,
      userCriteria,
    });
  }

  private static async fetchSocDetails(socCode: string): Promise<SocCodeDetails | null> {
    const normalized = socCode.trim();
    if (!normalized) return null;

    const cacheKey = `soc:${normalized}`;
    
    // Use shared cache with getOrFetch for deduplication
    return socCodeCache.getOrFetch<SocCodeDetails | null>(
      cacheKey,
      async () => {
        try {
          // Use retry wrapper for robust SOC code lookups
          const response = await withRetry(
            () => get<any>("/api/soc-codes/authenticated", { code: normalized, limit: 1 }, true),
            `fetchSocDetails(${normalized})`
          );
          const details = response.results?.[0];
          if (details) {
            const mapped: SocCodeDetails = {
              code: details.code ?? normalized,
              jobType: details.jobType ?? details.title ?? "",
              relatedTitles: details.relatedTitles ?? [],
              eligibility: details.eligibility ?? "Unknown",
              // New fields for July 2025 compliance
              goingRate: typeof details.goingRate === 'number' ? details.goingRate : undefined,
              rqfLevel: typeof details.rqfLevel === 'number' ? details.rqfLevel : undefined,
              isOnISL: details.isOnISL === true,
              isOnTSL: details.isOnTSL === true,
              isHealthCare: details.isHealthCare === true,
            };
            return mapped;
          }
        } catch (error) {
          console.warn("SponsorshipManager: failed to load SOC details", error);
          if (error instanceof Error && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
            console.info("Hireall: SOC details fetch failed due to CORS or network issue - this is a server-side configuration issue");
          }
        }

        return null;
      }
    );
  }

  private static evaluateUkEligibility(params: {
    jobDescription: JobDescriptionData;
    socDetails: SocCodeDetails | null;
    isSkilledWorker: boolean | undefined;
    userCriteria?: UserVisaCriteria;
  }): UkEligibilityAssessment {
    const { jobDescription, socDetails, isSkilledWorker, userCriteria } = params;
    const reasons: string[] = [];
    let eligible = true;

    const socCode = jobDescription.socCode;
    const offeredSalary = jobDescription.salary?.min ?? jobDescription.salary?.max;

    // Determine if user qualifies for any discounts
    const isNewEntrant = userCriteria?.ageCategory === 'under26' || 
                         userCriteria?.educationStatus === 'student' || 
                         userCriteria?.educationStatus === 'recentGraduate' ||
                         userCriteria?.educationStatus === 'graduateVisa' ||
                         userCriteria?.educationStatus === 'professionalTraining';
    
    const hasStemPhd = userCriteria?.phdStatus === 'stemPhd';
    const hasNonStemPhd = userCriteria?.phdStatus === 'nonStemPhd';

    // Determine threshold using SOC details from Firebase and user profile
    const thresholdResult = socCode
      ? this.getMinimumSalaryForSOC(socCode, {
        goingRate: socDetails?.goingRate,
        isOnISL: socDetails?.isOnISL,
        isOnTSL: socDetails?.isOnTSL,
        isHealthCare: socDetails?.isHealthCare,
        isNewEntrant,
      })
      : { 
          threshold: getApplicableThreshold({ 
            isNewEntrant, 
            hasStemPhd, 
            hasNonStemPhd 
          }).annualSalary, 
          thresholdType: getApplicableThreshold({ 
            isNewEntrant, 
            hasStemPhd, 
            hasNonStemPhd 
          }).type, 
          hourlyRate: UK_HOURLY_RATES.STANDARD 
        };

    let salaryThreshold = thresholdResult.threshold;

    // Apply user-defined minimum salary if it's higher than the legal minimum
    if (userCriteria?.minimumSalary && userCriteria.minimumSalary > salaryThreshold) {
      salaryThreshold = userCriteria.minimumSalary;
      reasons.push(`User-defined minimum salary of ${formatSalaryGBP(salaryThreshold)} applied`);
    }

    // SOC is optional: many listings do not include it.

    if (socDetails) {
      reasons.push(`SOC ${socDetails.code} (${socDetails.jobType}) classified as ${socDetails.eligibility}`);

      if (socDetails.eligibility.toLowerCase().includes("ineligible")) {
        eligible = false;
        reasons.push("Role not eligible under UK Skilled Worker visa");
      }

      // RQF Level check (July 2025 requires RQF 6 minimum)
      if (typeof socDetails.rqfLevel === 'number') {
        if (socDetails.rqfLevel < UK_RQF_LEVELS.MINIMUM_STANDARD) {
          if (socDetails.isOnTSL) {
            reasons.push(`RQF Level ${socDetails.rqfLevel} - eligible via Temporary Shortage List (until Dec 2026)`);
          } else {
            eligible = false;
            reasons.push(`RQF Level ${socDetails.rqfLevel} - below required Level ${UK_RQF_LEVELS.MINIMUM_STANDARD} (bachelor's equivalent)`);
          }
        } else {
          reasons.push(`RQF Level ${socDetails.rqfLevel} meets minimum skill requirement`);
        }
      }

      // ISL/TSL status
      if (socDetails.isOnISL) {
        reasons.push("Occupation on Immigration Salary List (discounted threshold applies)");
      }
      if (socDetails.isOnTSL) {
        reasons.push("Occupation on Temporary Shortage List (expires Dec 2026)");
      }

      // Going rate info
      if (socDetails.goingRate) {
        reasons.push(`Occupation going rate: ${formatSalaryGBP(socDetails.goingRate)}`);
      }
    }

    // Enhanced threshold information
    const thresholdLabel = UK_THRESHOLD_INFO[thresholdResult.thresholdType]?.label ?? 'General';

    if (salaryThreshold) {
      if (typeof offeredSalary === "number") {
        if (offeredSalary < salaryThreshold) {
          eligible = false;
          reasons.push(
            `Salary ${formatSalaryGBP(offeredSalary)} below ${thresholdLabel === 'General' && userCriteria?.minimumSalary ? 'user' : thresholdLabel} minimum of ${formatSalaryGBP(salaryThreshold)}`
          );
        } else {
          reasons.push(
            `Salary ${formatSalaryGBP(offeredSalary)} meets ${thresholdLabel === 'General' && userCriteria?.minimumSalary ? 'user' : thresholdLabel} minimum of ${formatSalaryGBP(salaryThreshold)}`
          );
        }
      } else {
        reasons.push(`${thresholdLabel === 'General' && userCriteria?.minimumSalary ? 'User' : thresholdLabel} minimum is ${formatSalaryGBP(salaryThreshold)} per year; salary not disclosed`);
      }
    }

    // Check user-defined required skills
    if (userCriteria?.jobCategories?.length && jobDescription.skills?.length) {
      const matchingCategories = userCriteria.jobCategories.filter(
        cat => jobDescription.skills?.some(skill => skill.toLowerCase().includes(cat.toLowerCase()))
      );
      
      if (matchingCategories.length > 0) {
        reasons.push(`Matches user-preferred categories: ${matchingCategories.join(', ')}`);
      }
    }

    // Check user-defined job types (using jobCategories as a proxy for preferred roles)
    if (userCriteria?.jobCategories?.length) {
      const title = (jobDescription.title || "").toLowerCase();
      const matchesJobType = userCriteria.jobCategories.some(cat => title.includes(cat.toLowerCase()));
      
      if (matchesJobType) {
        reasons.push(`Job title matches user-preferred roles`);
      }
    }

    if (jobDescription.visaSponsorship?.type === "Not Available") {
      eligible = false;
      reasons.push("Listing explicitly states visa sponsorship is not available");
    } else if (jobDescription.visaSponsorship?.mentioned && jobDescription.visaSponsorship?.type) {
      reasons.push(`Listing mentions ${jobDescription.visaSponsorship.type} visa support`);
    }

    if (isSkilledWorker === false) {
      eligible = false;
      reasons.push("Company not verified as Skilled Worker sponsor");
    }

    return {
      eligible,
      reasons: Array.from(new Set(reasons)),
      socCode,
      socTitle: socDetails?.jobType ?? jobDescription.socMatch?.title,
      socEligibility: socDetails?.eligibility,
      salaryThreshold,
      salaryOffered: typeof offeredSalary === "number" ? offeredSalary : undefined,
      meetsSalaryRequirement:
        typeof offeredSalary === "number"
          ? offeredSalary >= salaryThreshold
          : undefined,
      thresholdType: thresholdResult.thresholdType,
      hourlyRateRequired: thresholdResult.hourlyRate,
      isOnISL: socDetails?.isOnISL,
      isOnTSL: socDetails?.isOnTSL,
      rqfLevel: socDetails?.rqfLevel,
    };
  }

  private static formatSalary(value: number): string {
    return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  }
}
