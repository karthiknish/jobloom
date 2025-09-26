import { DEFAULT_WEB_APP_URL } from "./constants";
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
  isRecruitmentAgency?: boolean;
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
  isRecruitmentAgency?: boolean;
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
    return new Promise((resolve) => {
      chrome.storage.sync.get(["webAppUrl"], (result) => {
        resolve(result.webAppUrl || DEFAULT_WEB_APP_URL);
      });
    });
  }

  private static async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["firebaseUid", "userId"], (result) => {
        resolve(result.firebaseUid || result.userId || null);
      });
    });
  }

  private static async getOrCreateClientId(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["clientId"], (result) => {
        if (result.clientId) {
          resolve(result.clientId);
        } else {
          const newClientId =
            "ext-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now();
          chrome.storage.local.set({ clientId: newClientId }, () => {
            resolve(newClientId);
          });
        }
      });
    });
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
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user ID
      const userId = await this.getUserId();
      if (!userId) {
        return {
          success: false,
          message: "User not authenticated. Please sign in to Hireall.",
        };
      }

      // Get Web App URL
      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      // Generate client ID for rate limiting
      const clientId = await this.getOrCreateClientId();

      // Create job via web API with comprehensive LinkedIn data
      const response = await fetch(`${webAppUrl}/api/app/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          isRecruitmentAgency: jobData.isRecruitmentAgency || false,
          sponsorshipType: jobData.sponsorshipType || undefined,
          source: jobData.source || "extension",
          userId: userId,
        }),
      });

      if (response.status === 429) {
        return {
          success: false,
          message: "Rate limit exceeded. Please try again later.",
        };
      }

      if (response.ok) {
        let createdJobId: string | null = null;
        try {
          const created = await response.json();
          createdJobId = created || null;
        } catch {}

        // Create application with selected status if we have a job id
        if (createdJobId) {
          try {
            await fetch(`${webAppUrl}/api/app/applications`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobId: createdJobId,
                userId: userId,
                status: status,
                appliedDate: status === "applied" ? Date.now() : undefined,
              }),
            });
          } catch (e) {
            console.warn("Failed to create application with status", e);
          }
        }

        // Update local stats
        chrome.storage.local.get(["jobBoardStats"], (result) => {
          const stats = result.jobBoardStats || {
            totalAdded: 0,
            addedToday: 0,
            lastResetDate: new Date().toDateString(),
          };

          // Reset daily count if it's a new day
          const today = new Date().toDateString();
          if (stats.lastResetDate !== today) {
            stats.addedToday = 0;
            stats.lastResetDate = today;
          }

          stats.totalAdded++;
          stats.addedToday++;

          chrome.storage.local.set({ jobBoardStats: stats });
        });

        return {
          success: true,
          message: `Job added and status set to "${status}"`,
        };
      } else {
        const errorText = await response.text();
        if (errorText.includes("Rate limit exceeded")) {
          return {
            success: false,
            message: "Server rate limit exceeded. Please try again later.",
          };
        } else {
          return {
            success: false,
            message: "Failed to add job to board. Please try again.",
          };
        }
      }
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

      const base = (await this.getWebAppUrl()).replace(/\/$/, "");
      const clientId = await this.getOrCreateClientId();

      // Check if job already exists in user's job board
      const response = await fetch(
        `${base}/api/app/jobs/user/${encodeURIComponent(userId)}`
      );

      if (response.ok) {
        const userJobs = await response.json();

        // Check for duplicates (same company and similar title)
        return userJobs.some(
          (job: any) =>
            job.company.toLowerCase() === jobData.company.toLowerCase() &&
            this.similarTitles(job.title, jobData.title)
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
          message: "User not authenticated. Please sign in to Hireall.",
        };
      }

      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      // First, get the application for this job
      const applicationsResponse = await fetch(
        `${webAppUrl}/api/app/applications/user/${encodeURIComponent(userId)}`
      );

      if (!applicationsResponse.ok) {
        return {
          success: false,
          message: "Failed to fetch applications.",
        };
      }

      const applications = await applicationsResponse.json();
      const application = applications.find((app: any) => app.jobId === jobId);

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

      const updateResponse = await fetch(
        `${webAppUrl}/api/app/applications/${application.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok) {
        // Update local storage
        this.updateLocalJobStatus(jobId, newStatus, notes);

        return {
          success: true,
          message: `Job status updated to "${newStatus}"`,
        };
      } else {
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

      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      const response = await fetch(
        `${webAppUrl}/api/app/jobs/${encodeURIComponent(jobId)}`
      );

      if (response.ok) {
        const jobData = await response.json();

        // Get associated application data
        const applicationsResponse = await fetch(
          `${webAppUrl}/api/app/applications/user/${encodeURIComponent(userId)}`
        );

        let applicationData = null;
        if (applicationsResponse.ok) {
          const applications = await applicationsResponse.json();
          applicationData = applications.find(
            (app: any) => app.jobId === jobId
          );
        }

        return {
          ...jobData,
          applicationId: applicationData?.id,
          appliedDate: applicationData?.appliedDate,
          lastUpdated: applicationData?.updatedAt,
          interviewDate: applicationData?.interviewDate,
          status: applicationData?.status || "interested",
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting job details:", error);
      return null;
    }
  }

  public static async getAllJobs(): Promise<JobBoardEntry[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      // Get jobs
      const jobsResponse = await fetch(
        `${webAppUrl}/api/app/jobs/user/${encodeURIComponent(userId)}`
      );

      if (!jobsResponse.ok) return [];

      const jobs = await jobsResponse.json();

      // Get applications
      const applicationsResponse = await fetch(
        `${webAppUrl}/api/app/applications/user/${encodeURIComponent(userId)}`
      );

      let applications: any[] = [];
      if (applicationsResponse.ok) {
        applications = await applicationsResponse.json();
      }

      // Merge job and application data
      return jobs.map((job: any) => {
        const application = applications.find(
          (app: any) => app.jobId === job.id
        );
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

      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      const response = await fetch(`${webAppUrl}/api/app/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          userId,
          ...followUpData,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: "Follow-up scheduled successfully.",
        };
      } else {
        return {
          success: false,
          message: "Failed to schedule follow-up.",
        };
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