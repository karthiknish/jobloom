import { DEFAULT_WEB_APP_URL } from "./constants";
// addToBoard.ts - Utility functions for adding jobs to the user's board

interface JobData {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  dateFound: string;
}

interface JobBoardEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  dateAdded: string;
  status: "interested" | "applied" | "interviewing" | "rejected" | "offer";
  notes: string;
  salary?: string;
  sponsorshipInfo?: {
    isSponsored: boolean;
    sponsorshipType?: string;
  };
  isRecruitmentAgency?: boolean;
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
          message: "User not authenticated. Please sign in to Jobloom.",
        };
      }

      // Get Web App URL
      const webAppUrl = (await this.getWebAppUrl()).replace(/\/$/, "");

      // Generate client ID for rate limiting
      const clientId = await this.getOrCreateClientId();

      // Create job via web API
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
          isSponsored: jobData.isSponsored,
          isRecruitmentAgency: jobData.isRecruitmentAgency || false,
          source: "extension",
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
}