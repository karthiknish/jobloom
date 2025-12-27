/**
 * Job-related types
 */

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
  /** Raw salary string */
  salary?: string;
  /** Structured salary range information */
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  /** Required skills */
  skills?: string[];
  /** Specific job requirements */
  requirements?: string[];
  /** Employee benefits */
  benefits?: string[];
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
  /** Source of the job posting (e.g., LinkedIn, Indeed) */
  source: string;
  /** Timestamp when the job was found */
  dateFound: number;
  /** Standardized SOC code for the role */
  likelySocCode?: string;
  /** Confidence score for the SOC code match */
  socMatchConfidence?: number;
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
}

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
