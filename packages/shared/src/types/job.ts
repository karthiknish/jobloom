/**
 * Job-related types
 */

export type JobSite = 'linkedin' | 'indeed' | 'reed' | 'totaljobs' | 'cvlibrary' | 'glassdoor' | 'generic' | 'unknown';

export interface SalaryInfo {
  min?: number;
  max?: number;
  currency: string;
  period: string;
  original: string;
}

export interface VisaSponsorshipInfo {
  mentioned: boolean;
  available: boolean;
  type?: string;
  requirements?: string[];
}

export interface SocCodeMatch {
  code: string;
  title: string;
  confidence: number;
  matchedKeywords: string[];
  relatedTitles: string[];
  eligibility: string;
}

// Re-declare KanbanStatus locally to avoid circular import with application.ts
type KanbanStatus =
  | "interested"
  | "applied"
  | "offered"
  | "rejected"
  | "withdrawn";

/**
 * Represents a job posting, either scraped or manually entered.
 */
export interface Job {
  /** Unique identifier for the job */
  _id: string;
  /** User who saved/found this job */
  userId: string;
  /** Job title */
  title: string;
  /** Company name */
  company: string;
  /** Primary location of the job */
  location: string;
  /** URL to the original job posting */
  url?: string;
  /** Full job description */
  description?: string;
  /** Source of the job posting (e.g., LinkedIn, Indeed) */
  source: JobSite | string;
  /** Structured salary info from parser or raw salary string */
  salary?: string | SalaryInfo | null;
  /** Structured salary range information (legacy/simplified) */
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  } | null;
  /** Legacy jobId used in the extension */
  jobId?: string;
  /** Required skills */
  skills?: string[];
  /** Specific job requirements */
  requirements?: string[];
  /** Employee benefits */
  benefits?: string[];
  /** Required qualifications */
  qualifications?: string[];
  /** Type of job (Full-time, Contract, etc.) */
  jobType?: string;
  /** Required experience level */
  experienceLevel?: string;
  /** Whether the job allows remote work */
  remoteWork?: boolean;
  /** Approximate company size */
  companySize?: string;
  /** Industry of the company */
  industry?: string;
  /** Date the job was originally posted */
  postedDate?: string;
  /** Date when applications close */
  applicationDeadline?: string;
  /** Whether the company is known to sponsor visas */
  isSponsored: boolean;
  /** Whether the posting is from a recruitment agency */
  isRecruitmentAgency?: boolean;
  /** Type of sponsorship offered */
  sponsorshipType?: string;
  /** Timestamp when the job was found */
  dateFound: number | string;
  /** Standardized SOC code for the role */
  likelySocCode?: string;
  /** Legacy SOC code field used in some components */
  socCode?: string;
  /** Confidence score for the SOC code match */
  socMatchConfidence?: number;
  /** Complete SOC match details if available */
  socMatch?: SocCodeMatch;
  /** Company department */
  department?: string;
  /** Level of seniority */
  seniority?: string;
  /** Type of employment (e.g., permanent) */
  employmentType?: string;
  /** Type of location (e.g., onsite, hybrid) */
  locationType?: string;
  /** Keywords extracted from the description */
  extractedKeywords?: string[];
  /** Normalized title for matching */
  normalizedTitle?: string;
  /** URL that has been cleaned of tracking parameters */
  normalizedUrl?: string;
  /** Unique identifier for the job on its source site */
  jobIdentifier: string;
  /** Detailed visa sponsorship info */
  visaSponsorship?: VisaSponsorshipInfo;
  /** Legacy status field */
  status?: KanbanStatus;
  /** Legacy notes field */
  notes?: string;
  /** Legacy tags field */
  tags?: string[];
  /** Timestamp when created */
  createdAt?: number;
  /** Timestamp when last updated */
  updatedAt?: number;
  /** Number of applicants for this job */
  applicantCount?: number;
  /** Whether job has LinkedIn Easy Apply */
  easyApply?: boolean;
  /** Company logo URL */
  companyLogo?: string;
  /** Method used for extraction (normal, fallback, empty) */
  extractionMethod?: string;
  /** True if site is not supported */
  unsupportedSite?: boolean;
}

/**
 * Represents job data extracted or manually entered before being persisted.
 * Excludes backend-specific fields like _id and userId.
 */
export type JobData = Omit<Job, "_id" | "userId">;

/**
 * Statistics for the jobs and applications dashboard.
 */
export interface JobStats {
  /** Total number of jobs found */
  totalJobs: number;
  /** Number of sponsored jobs */
  sponsoredJobs: number;
  /** Total number of applications created */
  totalApplications: number;
  /** Number of jobs found today */
  jobsToday: number;
  /** Number of jobs from recruitment agencies */
  recruitmentAgencyJobs?: number;
  /** Breakdown of applications by status */
  byStatus: Record<string, number>;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  location?: string;
  url?: string;
  description?: string;
  salaryRange?: Job['salaryRange'];
  tags?: string[];
  status?: KanbanStatus;
}

export interface CreateJobResponse {
  id: string;
  message?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id?: string;
}
