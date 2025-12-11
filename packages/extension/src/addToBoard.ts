import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from "./constants";
import { get, post, put } from "./apiClient";
import { safeChromeStorageGet } from "./utils/safeStorage";
// addToBoard.ts - Utility functions for adding jobs to the user's board

interface JobData {
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

interface JobBoardEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  dateAdded: string;
  status:
    | "interested"
    | "applied"
    | "interviewing"
    | "rejected"
    | "offered"
    | "withdrawn";
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
  interviewDate?: string;
  offerDetails?: {
    salary?: string;
    startDate?: string;
    notes?: string;
  };
}

interface ApplicationData {
  id: string;
  jobId: string;
  userId: string;
  status:
    | "interested"
    | "applied"
    | "interviewing"
    | "rejected"
    | "offered"
    | "withdrawn";
  appliedDate?: number;
  interviewDate?: number;
  notes?: string;
  followUps?: FollowUpData[];
  createdAt: string;
  updatedAt: string;
}

interface FollowUpData {
  id: string;
  applicationId: string;
  type: "email" | "call" | "interview" | "follow_up";
  scheduledDate: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export class JobBoardManager {
  private static async getWebAppUrl(): Promise<string> {
    const { webAppUrl } = await safeChromeStorageGet<{ webAppUrl: string }>(
      "sync",
      ["webAppUrl"],
      { webAppUrl: DEFAULT_WEB_APP_URL },
      "job board webAppUrl"
    );

    return sanitizeBaseUrl(typeof webAppUrl === "string" && webAppUrl.trim() ? webAppUrl : DEFAULT_WEB_APP_URL);
  }

  private static async getUserId(): Promise<string | null> {
    // Check if extension context is still valid
    if (typeof chrome === "undefined" || !chrome.storage) {
      console.debug("Hireall: Extension context invalidated during getUserId");
      return null;
    }

    try {
      const result = await Promise.race([
        safeChromeStorageGet<{
          firebaseUid: string | null;
          userId: string | null;
        }>(
          "sync",
          ["firebaseUid", "userId"],
          { firebaseUid: null, userId: null },
          "job board user id"
        ),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error("Storage timeout")), 5000)
        )
      ]);

      if (!result) {
        console.debug("Hireall: Storage result is null");
        return null;
      }

      const { firebaseUid, userId } = result;
      const resolvedId = typeof firebaseUid === "string" && firebaseUid.trim().length
        ? firebaseUid
        : typeof userId === "string" && userId.trim().length
        ? userId
        : null;

      return resolvedId;
    } catch (error) {
      console.debug("Hireall: getUserId failed", error);
      return null;
    }
  }

  // Enhanced job validation and deduplication
  private static async validateAndDeduplicateJob(jobData: JobData): Promise<{ isValid: boolean; reason?: string }> {
    // Check required fields
    if (!jobData.title || !jobData.company) {
      return { isValid: false, reason: "Missing required job information (title and company)" };
    }

    // Check if job already exists
    const exists = await this.checkIfJobExists(jobData);
    if (exists) {
      return { isValid: false, reason: "This job is already in your board" };
    }

    // Validate job title quality
    if (jobData.title.length < 3 || jobData.title.length > 200) {
      return { isValid: false, reason: "Job title appears to be invalid" };
    }

    // Validate company name
    if (jobData.company.length < 2 || jobData.company.length > 100) {
      return { isValid: false, reason: "Company name appears to be invalid" };
    }

    return { isValid: true };
  }

  // Enhanced job scoring and priority calculation
  private static calculateJobScore(jobData: JobData): number {
    let score = 0;

    // Sponsorship status (highest priority)
    if (jobData.isSponsored) {
      score += 40;
      if (jobData.sponsorshipType === 'visa_sponsorship') score += 10;
    }

    // Recent posting (higher priority for newer jobs)
    if (jobData.postedDate) {
      const daysSincePosted = Math.floor((Date.now() - new Date(jobData.postedDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePosted <= 3) score += 20;
      else if (daysSincePosted <= 7) score += 15;
      else if (daysSincePosted <= 14) score += 10;
      else if (daysSincePosted <= 30) score += 5;
    }

    // Salary information
    if (jobData.salary || jobData.salaryRange) {
      score += 15;
      if (jobData.salaryRange?.min && jobData.salaryRange.min > 50000) score += 10;
    }

    // Remote work availability
    if (jobData.remoteWork) {
      score += 10;
    }

    // Company size (medium to large companies often more stable)
    if (jobData.companySize) {
      if (jobData.companySize.includes('1000+') || jobData.companySize.includes('Large')) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  // Enhanced notification system
  private static async showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<void> {
    try {
      // Try Chrome notifications first
      if (chrome.notifications) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'HireAll - Job Board',
          message: message
        });
      } else {
        // Fallback to console and localStorage
        console.log(`[HireAll ${type.toUpperCase()}] ${message}`);
        localStorage.setItem('__hireall_notification', JSON.stringify({
          message,
          type,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  public static async addToBoard(
    jobData: JobData
  ): Promise<{ success: boolean; message: string }> {
    return this.addToBoardWithStatus(jobData, "interested");
  }

  public static async addToBoardWithStatus(
    jobData: JobData,
    status:
      | "interested"
      | "applied"
      | "interviewing"
      | "offered"
      | "rejected"
      | "withdrawn" = "interested"
  ): Promise<{ success: boolean; message: string; jobScore?: number }> {
    try {
      // Check if extension context is still valid
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.debug("Hireall: Extension context invalidated, cannot add job to board");
        return {
          success: false,
          message: "Extension context invalidated. Please refresh the page and try again.",
        };
      }

      // Get user ID and verify authentication
      const userId = await this.getUserId();
      if (!userId) {
        await this.showNotification("Please sign in to add jobs to your board.", "error");
        return {
          success: false,
          message: "Please sign in to add jobs to your board.",
        };
      }

      // Validate job data
      const validation = await this.validateAndDeduplicateJob(jobData);
      if (!validation.isValid) {
        await this.showNotification(validation.reason || "Invalid job data", "warning");
        return {
          success: false,
          message: validation.reason || "Invalid job data",
        };
      }

      // Calculate job score for priority
      const jobScore = this.calculateJobScore(jobData);

      // Create job via API client with enhanced data
      let createdJobId: string | null = null;
      try {
        createdJobId = await Promise.race([
          post<string>("/api/app/jobs", {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          url: jobData.url,
          description: jobData.description || undefined,
          salary: jobData.salary || undefined,
          salaryRange: jobData.salaryRange || undefined,
          skills: jobData.skills || [],
          requirements: jobData.requirements || [],
          benefits: jobData.benefits || [],
          jobType: jobData.jobType || undefined,
          experienceLevel: jobData.experienceLevel || undefined,
          remoteWork: jobData.remoteWork || false,
          companySize: jobData.companySize || undefined,
          industry: jobData.industry || undefined,
          postedDate: jobData.postedDate || undefined,
          applicationDeadline: jobData.applicationDeadline || undefined,
          isSponsored: jobData.isSponsored,
          sponsorshipType: jobData.sponsorshipType || undefined,
          source: jobData.source || "extension",
          userId: userId,
          jobScore: jobScore, // Add the calculated score
          }),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("API timeout")), 10000)
          )
        ]);
      } catch (e: any) {
        const msg = e?.message || "";
        
        // Provide specific error messages based on the error
        if (msg.includes("Authentication required") || msg.includes("Authentication failed")) {
          return {
            success: false,
            message: "Please sign in to add jobs to your board.",
          };
        } else if (msg.includes("429") || msg.includes("Too many requests")) {
          return {
            success: false,
            message: "Rate limit exceeded. Please try again later.",
          };
        } else if (msg.includes("Permission denied")) {
          return {
            success: false,
            message: "Permission denied. Please check your account access.",
          };
        } else if (msg.includes("User ID does not match")) {
          return {
            success: false,
            message: "Authentication mismatch. Please sign in again.",
          };
        }
        
        console.error("Job creation error:", e);
        return {
          success: false,
          message: "Failed to add job. Please try again.",
        };
      }

      if (createdJobId) {
        try {
          await post("/api/app/applications", {
            jobId: createdJobId,
            userId: userId,
            status: status,
            appliedDate: status === "applied" ? Date.now() : undefined,
          });
        } catch (e) {
          console.warn("Failed to create application with status", e);
        }
      }

      // Update local stats
      (async () => {
        const { jobBoardStats: existingStats } = await safeChromeStorageGet<{
          jobBoardStats: Record<string, unknown> | undefined;
        }>(
          "local",
          ["jobBoardStats"],
          { jobBoardStats: undefined },
          "job board stats"
        );

        const stats: {
          totalAdded: number;
          addedToday: number;
          lastResetDate: string;
        } = existingStats && typeof existingStats === "object"
          ? {
              totalAdded: Number((existingStats as Record<string, unknown>).totalAdded ?? 0),
              addedToday: Number((existingStats as Record<string, unknown>).addedToday ?? 0),
              lastResetDate:
                typeof (existingStats as Record<string, unknown>).lastResetDate === "string" &&
                (existingStats as Record<string, unknown>).lastResetDate
                  ? String((existingStats as Record<string, unknown>).lastResetDate)
                  : new Date().toDateString(),
            }
          : {
              totalAdded: 0,
              addedToday: 0,
              lastResetDate: new Date().toDateString(),
            };

        const today = new Date().toDateString();
        if (stats.lastResetDate !== today) {
          stats.addedToday = 0;
          stats.lastResetDate = today;
        }

        stats.totalAdded = (stats.totalAdded || 0) + 1;
        stats.addedToday = (stats.addedToday || 0) + 1;

        try {
          if (chrome.storage?.local?.set) {
            chrome.storage.local.set({ jobBoardStats: stats }, () => {
              if (chrome.runtime?.lastError) {
                console.warn("Hireall: job board stats update failed", chrome.runtime.lastError.message);
              }
            });
          }
        } catch (error) {
          console.warn("Hireall: job board stats update threw", error);
        }
      })();

      // Show success notification with job score
      const scoreText = jobScore >= 80 ? "High Priority" : jobScore >= 60 ? "Medium Priority" : "Standard Priority";
      await this.showNotification(
        `${jobData.title} at ${jobData.company} added successfully (${scoreText})`,
        "success"
      );

      return {
        success: true,
        message: `Job added and status set to "${status}" (${scoreText})`,
        jobScore
      };
    } catch (error) {
      console.error("Error adding job to board:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  }

  public static async checkIfJobExists(jobData: JobData): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      if (!userId) return false;

      // Check if job already exists in user's job board
      const userJobs = await get<any[]>(
        `/api/app/jobs/user/${encodeURIComponent(userId)}`
      );

      if (Array.isArray(userJobs)) {
        return userJobs.some(
          (job: any) =>
            typeof job?.company === "string" &&
            job.company.toLowerCase() === jobData.company.toLowerCase() &&
            this.similarTitles(String(job.title ?? ""), jobData.title)
        );
      }

      return false;
    } catch (error) {
      console.error("Error checking if job exists:", error);
      return false;
    }
  }

  private static similarTitles(title1: string, title2: string): boolean {
    // Simple similarity check - normalize and compare
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);

    // Check if one title contains the other or they're very similar
    return (
      norm1.includes(norm2) ||
      norm2.includes(norm1) ||
      this.levenshteinDistance(norm1, norm2) <
        Math.min(norm1.length, norm2.length) * 0.3
    );
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Status Management Methods
  public static async updateJobStatus(
    jobId: string,
    newStatus:
      | "interested"
      | "applied"
      | "interviewing"
      | "rejected"
      | "offered"
      | "withdrawn",
    notes?: string,
    additionalData?: {
      interviewDate?: number;
      appliedDate?: number;
      offerDetails?: any;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return {
          success: false,
          message: "Please sign in to update job status.",
        };
      }

      // Get all user applications via api client
      let applications: ApplicationData[] = [];
      try {
        applications = await get<ApplicationData[]>(
          `/api/app/applications/user/${encodeURIComponent(userId)}`
        );
      } catch (error: any) {
        console.error("Failed to fetch applications:", error);
        let errorMessage = "Failed to fetch applications.";
        if (error?.message?.includes("Authentication")) {
          errorMessage = "Please sign in to update job status.";
        }
        return { success: false, message: errorMessage };
      }
      const application = applications.find((app) => app.jobId === jobId);

      if (!application) {
        return {
          success: false,
          message: "Application not found for this job.",
        };
      }

      // Update the application status
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (additionalData) {
        if (additionalData.appliedDate) {
          updateData.appliedDate = additionalData.appliedDate;
        }
        if (additionalData.interviewDate) {
          updateData.interviewDate = additionalData.interviewDate;
        }
        if (additionalData.offerDetails) {
          updateData.offerDetails = additionalData.offerDetails;
        }
      }

      try {
        await put(`/api/app/applications/${application.id}`, updateData);
        // Update local storage
        this.updateLocalJobStatus(jobId, newStatus, notes);
        return {
          success: true,
          message: `Job status updated to "${newStatus}"`,
        };
      } catch {
        return {
          success: false,
          message: "Failed to update job status. Please try again.",
        };
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  }

  public static async getJobDetails(
    jobId: string
  ): Promise<JobBoardEntry | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      let jobData: any = null;
      try {
        jobData = await get(`/api/app/jobs/${encodeURIComponent(jobId)}`);
      } catch {
        return null;
      }

      let applications: ApplicationData[] = [];
      try {
        applications = await get<ApplicationData[]>(
          `/api/app/applications/user/${encodeURIComponent(userId)}`
        );
      } catch (err) {
        console.warn("Failed to fetch applications for job details", err);
      }

      const applicationData = applications.find((app) => app.jobId === jobId);

      return {
        ...jobData,
        applicationId: applicationData?.id,
        appliedDate: applicationData?.appliedDate,
        lastUpdated: applicationData?.updatedAt,
        interviewDate: applicationData?.interviewDate,
        status: applicationData?.status || "interested",
      };

    } catch (error) {
      console.error("Error getting job details:", error);
      return null;
    }
  }

  public static async getAllJobs(): Promise<JobBoardEntry[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      let jobs: any[] = [];
      try {
        jobs = await get<any[]>(
          `/api/app/jobs/user/${encodeURIComponent(userId)}`
        );
      } catch {
        return [];
      }
      let applications: ApplicationData[] = [];
      try {
        applications = await get<ApplicationData[]>(
          `/api/app/applications/user/${encodeURIComponent(userId)}`
        );
      } catch (err) {
        console.warn("Failed to fetch applications for jobs list", err);
      }

      // Merge job and application data
      return jobs.map((job: any) => {
        const application = applications.find((app) => app.jobId === job.id);
        return {
          ...job,
          applicationId: application?.id,
          appliedDate: application?.appliedDate,
          lastUpdated: application?.updatedAt,
          interviewDate: application?.interviewDate,
          status: application?.status || "interested",
          notes: application?.notes || "",
        };
      });
    } catch (error) {
      console.error("Error getting all jobs:", error);
      return [];
    }
  }

  public static async addFollowUp(
    applicationId: string,
    followUpData: {
      type: "email" | "call" | "interview" | "follow_up";
      scheduledDate: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return {
          success: false,
          message: "User not authenticated.",
        };
      }

      try {
        await post("/api/app/follow-ups", {
          applicationId,
          userId,
          ...followUpData,
        });
        return { success: true, message: "Follow-up scheduled successfully." };
      } catch {
        return { success: false, message: "Failed to schedule follow-up." };
      }
    } catch (error) {
      console.error("Error adding follow-up:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  }

  private static updateLocalJobStatus(
    jobId: string,
    newStatus: string,
    notes?: string
  ): void {
    // Update local storage stats
    chrome.storage.local.get(["jobBoardData"], (result) => {
      const jobs = result.jobBoardData || [];
      const jobIndex = jobs.findIndex((job: any) => job.id === jobId);

      if (jobIndex !== -1) {
        jobs[jobIndex].status = newStatus;
        jobs[jobIndex].lastUpdated = new Date().toISOString();
        if (notes) {
          jobs[jobIndex].notes = notes;
        }

        chrome.storage.local.set({ jobBoardData: jobs });
      }
    });
  }

  // Bulk operations
  public static async bulkUpdateStatus(
    jobIds: string[],
    newStatus:
      | "interested"
      | "applied"
      | "interviewing"
      | "rejected"
      | "offered"
      | "withdrawn",
    notes?: string
  ): Promise<{ success: boolean; message: string; updated: number }> {
    let updated = 0;
    let errors = 0;

    for (const jobId of jobIds) {
      try {
        const result = await this.updateJobStatus(jobId, newStatus, notes);
        if (result.success) {
          updated++;
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
        console.error(`Error updating job ${jobId}:`, error);
      }
    }

    return {
      success: updated > 0,
      message: `Updated ${updated} jobs${
        errors > 0 ? ` (${errors} failed)` : ""
      }`,
      updated,
    };
  }

  // Analytics and insights
  public static async getJobStats(): Promise<{
    totalJobs: number;
    statusBreakdown: Record<string, number>;
    sponsoredJobs: number;
    appliedThisWeek: number;
    interviewRate: number;
  }> {
    try {
      const jobs = await this.getAllJobs();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalJobs: jobs.length,
        statusBreakdown: {} as Record<string, number>,
        sponsoredJobs: jobs.filter((job) => job.sponsorshipInfo?.isSponsored)
          .length,
        appliedThisWeek: jobs.filter((job) => {
          const appliedDate = job.appliedDate
            ? new Date(job.appliedDate)
            : null;
          return appliedDate && appliedDate >= weekAgo;
        }).length,
        interviewRate: 0,
      };

      // Calculate status breakdown
      jobs.forEach((job) => {
        stats.statusBreakdown[job.status] =
          (stats.statusBreakdown[job.status] || 0) + 1;
      });

      // Calculate interview rate
      const appliedCount = stats.statusBreakdown.applied || 0;
      const interviewCount = stats.statusBreakdown.interviewing || 0;
      stats.interviewRate =
        appliedCount > 0 ? (interviewCount / appliedCount) * 100 : 0;

      return stats;
    } catch (error) {
      console.error("Error getting job stats:", error);
      return {
        totalJobs: 0,
        statusBreakdown: {},
        sponsoredJobs: 0,
        appliedThisWeek: 0,
        interviewRate: 0,
      };
    }
  }
}