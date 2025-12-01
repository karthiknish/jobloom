// Enhanced add to board functionality with improved job extraction and SOC matching
import { get, post, put } from "./apiClient";
import { safeChromeStorageGet } from "./utils/safeStorage";
import EnhancedJobParser, { EnhancedJobData, SocCodeMatch } from "./enhancedJobParser";

interface JobBoardEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  dateAdded: string;
  status: "interested" | "applied" | "interviewing" | "rejected" | "offered" | "withdrawn";
  notes: string;
  salary?: string;
  description?: string;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored?: boolean;
  sponsorshipType?: string;
  socCode?: string;
  socMatchConfidence?: number;
  department?: string;
  seniority?: string;
  employmentType?: string;
  locationType?: string;
}

interface PendingJob {
  id: string;
  jobData: EnhancedJobData;
  status: "interested" | "applied";
  timestamp: number;
  retryCount: number;
}

export class EnhancedJobBoardManager {
  private static instance: EnhancedJobBoardManager;
  private cache = new Map<string, EnhancedJobData>();
  private socCodeCache = new Map<string, SocCodeMatch>();
  private isSyncing = false;

  static getInstance(): EnhancedJobBoardManager {
    if (!EnhancedJobBoardManager.instance) {
      EnhancedJobBoardManager.instance = new EnhancedJobBoardManager();
      EnhancedJobBoardManager.instance.initSync();
    }
    return EnhancedJobBoardManager.instance;
  }

  private initSync() {
    // Check for pending jobs periodically
    setInterval(() => this.processPendingJobs(), 60000); // Every minute
    
    // Check when coming online
    window.addEventListener('online', () => this.processPendingJobs());
    
    // Initial check
    this.processPendingJobs();
  }

  // Enhanced job extraction with SOC matching
  async extractAndAnalyzeJob(document: Document, url: string): Promise<EnhancedJobData | null> {
    try {
      // Check cache first
      if (this.cache.has(url)) {
        return this.cache.get(url)!;
      }

      // Extract job data using enhanced parser
      const jobData = await EnhancedJobParser.extractJobFromPage(document, url);
      if (!jobData) {
        console.warn("Failed to extract job data from:", url);
        return null;
      }

      // Fetch SOC codes for matching
      const socCodes = await this.fetchSocCodes();
      
      // Perform fuzzy matching
      const socMatch = await EnhancedJobParser.matchToSocCode(jobData, socCodes);
      
      if (socMatch) {
        jobData.likelySocCode = socMatch.code;
        jobData.socMatchConfidence = socMatch.confidence;
        jobData.matchedSocTitles = socMatch.relatedTitles;
        
        // Cache SOC match
        this.socCodeCache.set(jobData.normalizedTitle, socMatch);
      }

      // Cache the extracted data
      this.cache.set(url, jobData);
      
      console.log("Enhanced job extraction completed:", {
        title: jobData.title,
        socCode: jobData.likelySocCode,
        confidence: jobData.socMatchConfidence,
        skills: jobData.skills.length,
        department: jobData.department
      });

      return jobData;
    } catch (error) {
      console.error("Enhanced job extraction failed:", error);
      return null;
    }
  }

  // Fetch SOC codes for fuzzy matching
  private async fetchSocCodes(): Promise<any[]> {
    try {
      // Use authenticated endpoint with fuzzy matching support
      const response = await get<any>("/api/soc-codes/authenticated", { fuzzy: "true", limit: 100 });
      return response.results || [];
    } catch (error) {
      console.error("SOC code fetch failed:", error);
      return [];
    }
  }

  // Queue job for offline/retry processing
  private async queueJob(jobData: EnhancedJobData, status: "interested" | "applied"): Promise<void> {
    try {
      const { pendingJobs } = await safeChromeStorageGet("local", ["pendingJobs"], { pendingJobs: [] as PendingJob[] }, "enhancedAddToBoard");
      
      const newPendingJob: PendingJob = {
        id: crypto.randomUUID(),
        jobData,
        status,
        timestamp: Date.now(),
        retryCount: 0
      };

      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ pendingJobs: [...pendingJobs, newPendingJob] }, () => resolve());
      });

      console.log("Job queued for sync:", jobData.company);
    } catch (error) {
      console.error("Failed to queue job:", error);
    }
  }

  // Process pending jobs queue
  private async processPendingJobs(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    try {
      this.isSyncing = true;
      const { pendingJobs } = await safeChromeStorageGet("local", ["pendingJobs"], { pendingJobs: [] as PendingJob[] }, "enhancedAddToBoard");

      if (pendingJobs.length === 0) return;

      console.log(`Processing ${pendingJobs.length} pending jobs...`);
      const remainingJobs: PendingJob[] = [];

      for (const job of pendingJobs) {
        try {
          // Try to add to board
          await this.addToBoard(job.jobData, job.status, true); // true = isRetry
          console.log("Successfully synced pending job:", job.jobData.company);
        } catch (error) {
          console.error("Failed to sync pending job:", error);
          
          // Keep in queue if retry count < 5
          if (job.retryCount < 5) {
            remainingJobs.push({
              ...job,
              retryCount: job.retryCount + 1
            });
          }
        }
      }

      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ pendingJobs: remainingJobs }, () => resolve());
      });

    } catch (error) {
      console.error("Error processing pending jobs:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Enhanced add to board with better data extraction
  async addToBoard(jobData: EnhancedJobData, status: "interested" | "applied" = "interested", isRetry = false): Promise<JobBoardEntry | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Check if job already exists
      const existingJob = await this.checkJobExists(jobData.url, userId);
      if (existingJob) {
        console.log("Job already exists in board:", existingJob.id);
        return existingJob;
      }

      // Create job entry with enhanced data
      const jobPayload = {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        url: jobData.url,
        description: jobData.description,
        salary: jobData.salary?.original || jobData.salary?.min?.toString(),
        salaryRange: jobData.salary ? {
          min: jobData.salary.min,
          max: jobData.salary.max,
          currency: jobData.salary.currency,
          period: jobData.salary.period
        } : undefined,
        skills: jobData.skills,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        jobType: jobData.employmentType,
        experienceLevel: jobData.seniority,
        remoteWork: jobData.remoteWork,
        companySize: jobData.companySize,
        industry: jobData.department, // Use department as industry for now
        postedDate: jobData.postedDate,
        applicationDeadline: jobData.applicationDeadline,
        isSponsored: jobData.isSponsored,
        sponsorshipType: jobData.sponsorshipType,
        source: jobData.source,
        userId: userId,
        // Enhanced fields
        normalizedTitle: jobData.normalizedTitle,
        extractedKeywords: jobData.extractedKeywords,
        likelySocCode: jobData.likelySocCode,
        socMatchConfidence: jobData.socMatchConfidence,
        department: jobData.department,
        seniority: jobData.seniority,
        employmentType: jobData.employmentType,
        locationType: jobData.locationType
      };

      // Create job first
      const jobResponse = await post<{ id: string }>("/api/app/jobs", jobPayload);
      const createdJobId = jobResponse.id;

      if (!createdJobId) {
        throw new Error("Failed to create job entry");
      }

      // Create application entry
      const applicationPayload = {
        jobId: createdJobId,
        userId: userId,
        status: status,
        appliedDate: status === "applied" ? Date.now() : undefined,
        notes: this.generateJobNotes(jobData)
      };

      const applicationResponse = await post<{ id: string }>("/api/app/applications", applicationPayload);

      // Create job board entry
      const jobBoardEntry: JobBoardEntry = {
        id: createdJobId,
        company: jobData.company,
        title: jobData.title,
        location: jobData.location,
        url: jobData.url,
        dateAdded: new Date().toISOString(),
        status: status,
        notes: applicationPayload.notes || "",
        salary: jobPayload.salary,
        description: jobData.description,
        skills: jobData.skills,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        remoteWork: jobData.remoteWork,
        companySize: jobData.companySize,
        industry: jobData.department,
        postedDate: jobData.postedDate,
        applicationDeadline: jobData.applicationDeadline,
        isSponsored: jobData.isSponsored,
        sponsorshipType: jobData.sponsorshipType,
        socCode: jobData.likelySocCode,
        socMatchConfidence: jobData.socMatchConfidence,
        department: jobData.department,
        seniority: jobData.seniority,
        employmentType: jobData.employmentType,
        locationType: jobData.locationType
      };

      // Update local storage
      await this.updateLocalStorage(jobBoardEntry);

      console.log("Successfully added job to board:", {
        id: createdJobId,
        title: jobData.title,
        company: jobData.company,
        socCode: jobData.likelySocCode,
        status: status
      });

      return jobBoardEntry;

    } catch (error: any) {
      console.error("Failed to add job to board:", error);
      
      // If this is not a retry and it's a network/server error, queue it
      if (!isRetry && (
        !navigator.onLine || 
        error.message?.includes("Failed to fetch") || 
        error.message?.includes("NetworkError") ||
        error.code === "RATE_LIMITED" ||
        error.code === "SERVER_ERROR" ||
        error.code === "SERVICE_UNAVAILABLE"
      )) {
        console.log("Queueing job for later sync due to error:", error.message);
        await this.queueJob(jobData, status);
        
        // Return a temporary "optimistic" entry so UI updates
        return {
          id: "pending-" + crypto.randomUUID(),
          company: jobData.company,
          title: jobData.title,
          location: jobData.location,
          url: jobData.url,
          dateAdded: new Date().toISOString(),
          status: status,
          notes: "Queued for sync",
          salary: jobData.salary?.original,
          description: jobData.description,
          skills: jobData.skills,
          isSponsored: jobData.isSponsored,
          sponsorshipType: jobData.sponsorshipType,
          socCode: jobData.likelySocCode,
          socMatchConfidence: jobData.socMatchConfidence
        } as JobBoardEntry;
      }
      
      throw error;
    }
  }

  // Generate intelligent notes based on job analysis
  private generateJobNotes(jobData: EnhancedJobData): string {
    const notes: string[] = [];

    // Add SOC code information
    if (jobData.likelySocCode) {
      notes.push(`SOC Code: ${jobData.likelySocCode} (Confidence: ${(jobData.socMatchConfidence * 100).toFixed(1)}%)`);
      if (jobData.matchedSocTitles.length > 0) {
        notes.push(`Related roles: ${jobData.matchedSocTitles.slice(0, 3).join(", ")}`);
      }
    }

    // Add department and seniority insights
    if (jobData.department) {
      notes.push(`Department: ${jobData.department}`);
    }
    if (jobData.seniority) {
      notes.push(`Seniority: ${jobData.seniority}`);
    }

    // Add key skills summary
    if (jobData.skills.length > 0) {
      notes.push(`Key skills: ${jobData.skills.slice(0, 5).join(", ")}`);
    }

    // Add location type
    if (jobData.locationType) {
      notes.push(`Location: ${jobData.locationType}`);
    }

    // Add extracted keywords
    if (jobData.extractedKeywords.length > 0) {
      notes.push(`Keywords: ${jobData.extractedKeywords.slice(0, 5).join(", ")}`);
    }

    // Add salary information
    if (jobData.salary) {
      notes.push(`Salary: ${jobData.salary.original}`);
    }

    return notes.join(" | ");
  }

  // Enhanced job existence check
  private async checkJobExists(url: string, userId: string): Promise<JobBoardEntry | null> {
    try {
      // Check local storage first (faster and works offline)
      const { jobBoardData } = await safeChromeStorageGet("local", ["jobBoardData"], { jobBoardData: [] as JobBoardEntry[] }, "enhancedAddToBoard");
      const localMatch = jobBoardData.find(job => job.url === url);
      if (localMatch) {
        return localMatch;
      }

      // If online, check API to be sure
      if (navigator.onLine) {
        const userJobs = await get<any[]>(`/api/app/jobs/user/${encodeURIComponent(userId)}`);
        const existingJob = userJobs.find(job => job.url === url);
        if (existingJob) {
          return this.mapToJobBoardEntry(existingJob);
        }
      }
      
      return null;
    } catch (error) {
      console.warn("Failed to check job existence:", error);
      return null;
    }
  }

  // Map API response to JobBoardEntry format
  private mapToJobBoardEntry(jobData: any): JobBoardEntry {
    return {
      id: jobData._id || jobData.id,
      company: jobData.company,
      title: jobData.title,
      location: jobData.location,
      url: jobData.url,
      dateAdded: jobData.createdAt || jobData.dateAdded,
      status: jobData.status || "interested",
      notes: jobData.notes || "",
      salary: jobData.salary,
      description: jobData.description,
      skills: jobData.skills,
      requirements: jobData.requirements,
      benefits: jobData.benefits,
      remoteWork: jobData.remoteWork,
      companySize: jobData.companySize,
      industry: jobData.industry,
      postedDate: jobData.postedDate,
      applicationDeadline: jobData.applicationDeadline,
      isSponsored: jobData.isSponsored,
      sponsorshipType: jobData.sponsorshipType,
      socCode: jobData.likelySocCode,
      socMatchConfidence: jobData.socMatchConfidence,
      department: jobData.department,
      seniority: jobData.seniority,
      employmentType: jobData.employmentType,
      locationType: jobData.locationType
    };
  }

  // Update local storage for offline access
  private async updateLocalStorage(jobEntry: JobBoardEntry): Promise<void> {
    try {
      const { jobBoardData } = await safeChromeStorageGet("local", ["jobBoardData"], { jobBoardData: [] as JobBoardEntry[] }, "enhancedAddToBoard");
      
      const updatedData = [...jobBoardData, jobEntry];
      
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ jobBoardData: updatedData }, () => resolve());
      });
      
      // Update stats
      await this.updateJobStats();
    } catch (error) {
      console.warn("Failed to update local storage:", error);
    }
  }

  // Update job statistics
  private async updateJobStats(): Promise<void> {
    try {
      const { jobBoardData } = await safeChromeStorageGet("local", ["jobBoardData"], { jobBoardData: [] as JobBoardEntry[] }, "enhancedAddToBoard");
      
      const stats = {
        totalJobs: jobBoardData.length,
        jobsToday: jobBoardData.filter(job => {
          const jobDate = new Date(job.dateAdded);
          const today = new Date();
          return jobDate.toDateString() === today.toDateString();
        }).length,
        interested: jobBoardData.filter(job => job.status === "interested").length,
        applied: jobBoardData.filter(job => job.status === "applied").length,
        interviewing: jobBoardData.filter(job => job.status === "interviewing").length,
        remoteJobs: jobBoardData.filter(job => job.remoteWork).length,
        sponsoredJobs: jobBoardData.filter(job => job.isSponsored).length,
        departments: [...new Set(jobBoardData.map(job => job.department).filter(Boolean))]
      };
      
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ jobBoardStats: stats }, () => resolve());
      });
    } catch (error) {
      console.warn("Failed to update job stats:", error);
    }
  }

  // Get user ID from storage
  private async getUserId(): Promise<string | null> {
    try {
      const { firebaseUid, userId } = await safeChromeStorageGet("sync", ["firebaseUid", "userId"], { firebaseUid: null, userId: null }, "enhancedAddToBoard");
      return firebaseUid || userId;
    } catch (error) {
      console.error("Failed to get user ID:", error);
      return null;
    }
  }

  // Get all jobs from board with enhanced filtering
  async getAllJobs(filters?: {
    status?: string;
    department?: string;
    seniority?: string;
    locationType?: string;
    isSponsored?: boolean;
    minSocConfidence?: number;
  }): Promise<JobBoardEntry[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const userJobs = await get<any[]>(`/api/app/jobs/user/${encodeURIComponent(userId)}`);
      let jobs = userJobs.map(job => this.mapToJobBoardEntry(job));

      // Apply filters
      if (filters) {
        if (filters.status) {
          jobs = jobs.filter(job => job.status === filters.status);
        }
        if (filters.department) {
          jobs = jobs.filter(job => job.department === filters.department);
        }
        if (filters.seniority) {
          jobs = jobs.filter(job => job.seniority === filters.seniority);
        }
        if (filters.locationType) {
          jobs = jobs.filter(job => job.locationType === filters.locationType);
        }
        if (filters.isSponsored !== undefined) {
          jobs = jobs.filter(job => job.isSponsored === filters.isSponsored);
        }
        if (filters.minSocConfidence !== undefined) {
          jobs = jobs.filter(job => (job.socMatchConfidence || 0) >= filters.minSocConfidence!);
        }
      }

      // Sort by date added (newest first)
      jobs.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

      return jobs;
    } catch (error) {
      console.error("Failed to get all jobs:", error);
      return [];
    }
  }

  // Update job status with enhanced tracking
  async updateJobStatus(jobId: string, status: string, notes?: string): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get current applications to find the right one
      const applications = await get<any[]>(`/api/app/applications/user/${encodeURIComponent(userId)}`);
      const application = applications.find(app => app.jobId === jobId);

      if (application) {
        const updateData = {
          status: status,
          notes: notes || application.notes,
          updatedAt: Date.now()
        };

        await put(`/api/app/applications/${application._id}`, updateData);
        
        // Update local storage
        await this.updateLocalJobStatus(jobId, status, notes);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to update job status:", error);
      return false;
    }
  }

  // Update local job status
  private async updateLocalJobStatus(jobId: string, status: string, notes?: string): Promise<void> {
    try {
      const { jobBoardData } = await safeChromeStorageGet("local", ["jobBoardData"], { jobBoardData: [] as JobBoardEntry[] }, "enhancedAddToBoard");
      
      const updatedData = jobBoardData.map(job => {
        if (job.id === jobId) {
          return {
            ...job,
            status: status as any,
            notes: notes || job.notes
          };
        }
        return job;
      });
      
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ jobBoardData: updatedData }, () => resolve());
      });
      
      await this.updateJobStats();
    } catch (error) {
      console.warn("Failed to update local job status:", error);
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.socCodeCache.clear();
  }
}

export default EnhancedJobBoardManager;
