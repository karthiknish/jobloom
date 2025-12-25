/**
 * @deprecated This file is preserved for backwards compatibility only.
 * Use EnhancedJobBoardManager from './enhancedAddToBoard' for all new code.
 * 
 * Migration guide:
 * - EnhancedJobBoardManager.getInstance().addToBoard(jobData)
 * - EnhancedJobBoardManager.getInstance().getAllJobs(filters)
 * - EnhancedJobBoardManager.getInstance().updateJobStatus(jobId, status)
 */

// Re-export EnhancedJobBoardManager as the primary export
export { EnhancedJobBoardManager } from "./enhancedAddToBoard";

// Legacy type exports for backwards compatibility
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
  dateFound: string;
  source: string;
}

export interface JobBoardEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  dateAdded: string;
  status: "interested" | "applied" | "rejected" | "offered" | "withdrawn";
  notes: string;
  salary?: string;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  sponsorshipInfo?: {
    isSponsored: boolean;
    sponsorshipType?: string;
  };
  ukEligibility?: boolean | null;
  applicationId?: string;
  appliedDate?: string;
  lastUpdated?: string;
  offerDetails?: {
    salary?: string;
    startDate?: string;
    notes?: string;
  };
}

export interface ApplicationData {
  id: string;
  jobId: string;
  userId: string;
  status: "interested" | "applied" | "rejected" | "offered" | "withdrawn";
  appliedDate?: number;
  notes?: string;
  followUps?: FollowUpData[];
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpData {
  id: string;
  applicationId: string;
  type: "email" | "call" | "follow_up";
  scheduledDate: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

/**
 * @deprecated Use EnhancedJobBoardManager.getInstance() instead.
 * This alias is provided for backwards compatibility during migration.
 */
import { EnhancedJobBoardManager } from "./enhancedAddToBoard";
export const JobBoardManager = EnhancedJobBoardManager;