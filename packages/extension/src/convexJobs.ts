import { executeConvexQuery, executeConvexMutation } from "./convex";

interface JobData {
  userId: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  source: string;
  salary?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  jobId?: string;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  qualifications?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  dateFound: number;
  likelySocCode?: string;
  socCode?: string;
  socMatchConfidence?: number;
  socMatch?: {
    code: string;
    title: string;
    confidence: number;
    matchedKeywords: string[];
    relatedTitles: string[];
    eligibility: string;
  };
  department?: string;
  seniority?: string;
  employmentType?: string;
  locationType?: string;
  extractedKeywords?: string[];
  normalizedTitle?: string;
  normalizedUrl?: string;
  jobIdentifier: string;
  visaSponsorship?: {
    mentioned: boolean;
    available: boolean;
    type?: string;
    requirements?: string[];
  };
  status?: "interested" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";
  notes?: string;
  tags?: string[];
  applicantCount?: number;
  easyApply?: boolean;
  companyLogo?: string;
  extractionMethod?: string;
  unsupportedSite?: boolean;
}

export async function saveJobToConvex(data: JobData): Promise<string> {
  const jobId = await executeConvexMutation("jobs:create", data);
  console.log("[Hireall:Job] Saved job to Convex:", jobId);
  return jobId;
}

export async function updateJobInConvex(
  id: string,
  updates: Partial<JobData>
): Promise<void> {
  await executeConvexMutation("jobs:update", {
    id,
    updates,
  });
  console.log("[Hireall:Job] Updated job in Convex:", id);
}

export async function getJobsByStatus(
  userId: string,
  status: "interested" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn"
): Promise<any[]> {
  const jobs = await executeConvexQuery("jobs:getByStatus", {
    userId,
    status,
  });
  return jobs;
}

export async function getJobStats(userId: string): Promise<any> {
  const stats = await executeConvexQuery("jobs:getStats", {
    userId,
  });
  return stats;
}

export async function deleteJobFromConvex(id: string): Promise<void> {
  await executeConvexMutation("jobs:remove", {
    id,
  });
  console.log("[Hireall:Job] Deleted job from Convex:", id);
}

export async function saveQuickNoteToConvex(
  userId: string,
  jobId: string,
  note: string
): Promise<string> {
  const noteId = await executeConvexMutation("quickNotes:create", {
    userId,
    jobId,
    note,
  });
  return noteId;
}

export async function updateQuickNoteInConvex(
  id: string,
  note: string
): Promise<void> {
  await executeConvexMutation("quickNotes:update", {
    id,
    note,
  });
}

export async function getQuickNotesForJob(jobId: string): Promise<any[]> {
  const notes = await executeConvexQuery("quickNotes:getByJobId", {
    jobId,
  });
  return notes;
}
