import { sponsorBatchLimiter } from "../rateLimiter";
import { get } from "../apiClient";
import { JobDescriptionData } from "../jobDescriptionParser";

// Sponsorship lookup cache & concurrency limiter utilities
const sponsorshipCache = new Map<string, SponsorshipRecord | null>();
const sponsorshipInFlight = new Map<string, Promise<SponsorshipRecord | null>>();
const socDetailsCache = new Map<string, SocCodeDetails | null>();

interface SocCodeDetails {
  code: string;
  jobType: string;
  relatedTitles: string[];
  eligibility: string;
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
    const key = company.toLowerCase().trim();

    if (sponsorshipCache.has(key)) {
      const cached = sponsorshipCache.get(key);
      if (!cached) {
        return null;
      }

      if (jobDescription) {
        return this.enhanceSponsorRecordWithJobContext({ ...cached }, jobDescription);
      }

      return { ...cached };
    }

    if (sponsorshipInFlight.has(key)) {
      return sponsorshipInFlight.get(key) ?? null;
    }

    const lookupPromise = this.runWithSponsorLimit(async () => {
      try {
        const data = await get<any>("/api/app/sponsorship/companies", { q: company, limit: 1 });
        const rec = data.results?.[0] || null;

        if (rec) {
          const baseRecord = this.mapApiRecordToSponsorship(rec);
          sponsorshipCache.set(key, baseRecord);

          if (jobDescription) {
            return await this.enhanceSponsorRecordWithJobContext({ ...baseRecord }, jobDescription);
          }

          return baseRecord;
        }

        sponsorshipCache.set(key, null);
        return null;
      } catch (e: any) {
        console.warn("Sponsorship lookup failed", e);
        if (e?.rateLimitInfo) {
          console.warn(
            `Rate limit hit for sponsor lookup: ${e.rateLimitInfo.remaining} remaining, resets in ${e.rateLimitInfo.resetIn}ms`
          );
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

    sponsorshipInFlight.set(key, lookupPromise);
    return lookupPromise;
  }

  private static async runWithSponsorLimit<T>(fn: () => Promise<T>): Promise<T> {
    return sponsorBatchLimiter.add(fn);
  }

  private static mapApiRecordToSponsorship(record: any): SponsorshipRecord {
    return {
      company: record.name ?? record.company ?? "",
      isSponsored: record.eligibleForSponsorship !== false,
      sponsorshipType: record.route ?? record.sponsorshipType,
      route: record.route,
      name: record.name ?? record.company,
      city: record.city,
      isSkilledWorker: record.isSkilledWorker ?? record.eligibleForSponsorship ?? false,
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
      enhanced.occupationTitle = jobDescription.occupationTitle;
    }

    if (record.route && jobDescription.skills) {
      enhanced.skillMatchScore = this.calculateSkillMatchScore(record.route, jobDescription.skills);
    }

    if (jobDescription.salary) {
      enhanced.salary = jobDescription.salary;
      const relevantSalary = jobDescription.salary.min ?? jobDescription.salary.max;

      if (typeof relevantSalary === "number") {
        const socThreshold = jobDescription.socCode
          ? this.getMinimumSalaryForSOC(jobDescription.socCode)
          : 25600;
        enhanced.isAboveMinimumThreshold = relevantSalary >= socThreshold;
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
      enhanced.ukEligibility = this.evaluateUkEligibility({
        jobDescription,
        socDetails,
        isSkilledWorker: enhanced.isSkilledWorker,
      });
    } else {
      enhanced.ukEligibility = this.evaluateUkEligibility({
        jobDescription,
        socDetails: null,
        isSkilledWorker: enhanced.isSkilledWorker,
      });
    }

    return enhanced;
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

  static getMinimumSalaryForSOC(socCode: string): number {
    const minimumSalaries: Record<string, number> = {
      "1111": 62400,
      "1120": 45900,
      "1131": 45900,
      "1132": 41500,
      "1150": 52500,
      "2136": 45900,
      "2135": 45900,
      "2137": 35100,
      "2139": 45900,
      "3543": 37900,
      "2473": 29100,
      "2211": 45900,
      "2212": 29100,
      "2213": 37900,
      "2214": 41500,
      "2122": 45900,
      "2123": 45900,
      "2126": 45900,
      "2315": 33500,
      "4131": 29100,
      "2431": 45900,
      "4111": 25600,
      "3533": 37900,
      "3534": 45900,
      "5311": 29100,
      "5312": 29100,
      "5434": 29100,
      "9234": 25600,
      "9235": 25600,
    };

    return minimumSalaries[socCode] ?? 25600;
  }

  static clearCache(): void {
    sponsorshipCache.clear();
    sponsorshipInFlight.clear();
    socDetailsCache.clear();
  }

  static getCacheSize(): number {
    return sponsorshipCache.size;
  }

  static async assessUkEligibility(jobDescription?: JobDescriptionData): Promise<UkEligibilityAssessment | undefined> {
    if (!jobDescription) return undefined;

    const socDetails = jobDescription.socCode ? await this.fetchSocDetails(jobDescription.socCode) : null;

    return this.evaluateUkEligibility({
      jobDescription,
      socDetails,
      isSkilledWorker: undefined,
    });
  }

  private static async fetchSocDetails(socCode: string): Promise<SocCodeDetails | null> {
    const normalized = socCode.trim();
    if (!normalized) return null;

    if (socDetailsCache.has(normalized)) {
      return socDetailsCache.get(normalized) ?? null;
    }

    try {
      const response = await get<any>("/api/soc-codes", { code: normalized, limit: 1 }, true);
      const details = response.results?.[0];
      if (details) {
        const mapped: SocCodeDetails = {
          code: details.code ?? normalized,
          jobType: details.jobType ?? details.title ?? "",
          relatedTitles: details.relatedTitles ?? [],
          eligibility: details.eligibility ?? "Unknown",
        };
        socDetailsCache.set(normalized, mapped);
        return mapped;
      }
    } catch (error) {
      console.warn("SponsorshipManager: failed to load SOC details", error);
    }

    socDetailsCache.set(normalized, null);
    return null;
  }

  private static evaluateUkEligibility(params: {
    jobDescription: JobDescriptionData;
    socDetails: SocCodeDetails | null;
    isSkilledWorker: boolean | undefined;
  }): UkEligibilityAssessment {
    const { jobDescription, socDetails, isSkilledWorker } = params;
    const reasons: string[] = [];
    let eligible = true;

    const socCode = jobDescription.socCode;
    const salaryThreshold = socCode ? this.getMinimumSalaryForSOC(socCode) : undefined;
    const offeredSalary = jobDescription.salary?.min ?? jobDescription.salary?.max;

    if (!socCode) {
      eligible = false;
      reasons.push("No SOC code detected in job description");
    }

    if (socDetails) {
      reasons.push(`SOC ${socDetails.code} (${socDetails.jobType}) classified as ${socDetails.eligibility}`);
      if (socDetails.eligibility.toLowerCase().includes("ineligible")) {
        eligible = false;
        reasons.push("Role not eligible under UK Skilled Worker visa");
      }
    } else if (socCode) {
      eligible = false;
      reasons.push("Unable to verify SOC code against UK Home Office list");
    }

    if (salaryThreshold) {
      if (typeof offeredSalary === "number") {
        if (offeredSalary < salaryThreshold) {
          eligible = false;
          reasons.push(
            `Salary £${this.formatSalary(offeredSalary)} below Skilled Worker minimum of £${this.formatSalary(salaryThreshold)}`
          );
        } else {
          reasons.push(
            `Salary £${this.formatSalary(offeredSalary)} meets Skilled Worker minimum of £${this.formatSalary(salaryThreshold)}`
          );
        }
      } else {
        reasons.push(`Minimum salary requirement is £${this.formatSalary(salaryThreshold)} per year; salary not disclosed`);
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
      socTitle: socDetails?.jobType ?? jobDescription.occupationTitle,
      socEligibility: socDetails?.eligibility,
      salaryThreshold,
      salaryOffered: typeof offeredSalary === "number" ? offeredSalary : undefined,
      meetsSalaryRequirement:
        typeof offeredSalary === "number" && typeof salaryThreshold === "number"
          ? offeredSalary >= salaryThreshold
          : undefined,
    };
  }

  private static formatSalary(value: number): string {
    return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  }
}
