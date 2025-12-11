import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../../constants";
import { JobStatus, createJobItemHTML, updateJobStatusDisplay } from "../../utils/jobStatus";
import { popupUI } from "../UI/PopupUI";
import { fetchSponsorRecord } from "../../sponsorship/lookup";
import { safeChromeStorageGet } from "../../utils/safeStorage";
import { isLikelyPlaceholderCompany, normalizeCompanyName } from "../../utils/companyName";

export class JobManager {
  private static instance: JobManager;
  private jobs: JobStatus[] = [];
  private activeFilter: string | undefined;
  
  private constructor() {}
  
  public static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }
  
  public async loadJobs(filterType?: string): Promise<void> {
    this.activeFilter = filterType;
    
    try {
      const { EnhancedJobBoardManager } = await import("../../enhancedAddToBoard");
      const allJobs = await EnhancedJobBoardManager.getInstance().getAllJobs();
      
      // Fetch pending jobs
      const { pendingJobs } = await safeChromeStorageGet("local", ["pendingJobs"], { pendingJobs: [] as any[] }, "JobManager");
      
      // Convert pending jobs to JobBoardEntry format for display
      const pendingEntries = pendingJobs.map((p: any) => ({
        id: p.id || `pending-${Date.now()}`,
        title: p.jobData.title,
        company: normalizeCompanyName(p.jobData.company || ""),
        location: p.jobData.location,
        url: p.jobData.url,
        status: p.status,
        dateAdded: new Date(p.timestamp).toISOString(),
        notes: "Queued for sync",
        salary: p.jobData.salary?.original,
        description: p.jobData.description,
        isPending: true // Flag for UI
      }));

      // Merge jobs (pending first)
      const mergedJobs = [...pendingEntries, ...allJobs];

      // Apply filters
      let filteredJobs = mergedJobs;
      if (filterType && filterType !== 'all') {
        filteredJobs = mergedJobs.filter(job => {
          switch (filterType) {
            case 'sponsored':
              return (job as any).isSponsored === true || (job as any).sponsorshipInfo?.isSponsored === true;
            case 'interested':
              return job.status === 'interested';
            case 'applied':
              return job.status === 'applied';
            case 'interviewing':
              return job.status === 'interviewing';
            default:
              return true;
          }
        });
      }
      
      // Map JobBoardEntry to JobStatus
      const mappedJobs: JobStatus[] = filteredJobs.map(job => ({
        id: job.id,
        title: job.title,
        company: normalizeCompanyName(job.company || ""),
        location: job.location,
        status: job.status,
        sponsored: (job as any).isSponsored || (job as any).sponsorshipInfo?.isSponsored || false,
        salary: job.salary,
        remote: (job as any).remoteWork,
        url: job.url,
        isPending: (job as any).isPending,
        logoUrl: (job as any).logoUrl, // Map logoUrl if available
        dateAdded: job.dateAdded
      }));
      
      this.jobs = mappedJobs;
      await this.renderJobs();
      
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.renderEmptyState(error instanceof Error ? error.message : 'Failed to load jobs');
    }
  }
  
  private async renderJobs(): Promise<void> {
    const jobList = document.getElementById("job-list") as HTMLElement;
    
    if (!jobList) return;
    
    if (this.jobs.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Update job count
    const jobCount = document.getElementById("jobs-count-display") as HTMLElement;
    if (jobCount) {
      jobCount.textContent = this.jobs.length.toString();
    }
    
    // Check if UK filters are enabled
    const ukFiltersEnabled = await this.checkUKFiltersEnabled();
    
    const jobsHTML = this.jobs.map(job => {
      // Add pending indicator if needed
      let html = createJobItemHTML(job, ukFiltersEnabled);
      if ((job as any).isPending) {
        // Inject pending badge (hacky but works without changing createJobItemHTML signature too much)
        html = html.replace('<div class="job-card">', '<div class="job-card pending-job" style="opacity: 0.7; border-left: 3px solid orange;">');
        html = html.replace('<h3 class="job-title">', '<h3 class="job-title"><span style="font-size: 10px; background: orange; color: white; padding: 2px 4px; border-radius: 4px; margin-right: 4px;">QUEUED</span>');
      }
      
      // If UK filters are enabled, check eligibility
      if (ukFiltersEnabled && job.sponsored && !(job as any).isPending) {
        this.checkUKEligibilityForJob(job.id);
      }
      
      return html;
    }).join('');
    
    jobList.innerHTML = jobsHTML;
    
    // Update active filter button
    popupUI.setActiveFilter(this.activeFilter);
  }
  
  private renderEmptyState(errorMessage?: string): void {
    const jobList = document.getElementById("job-list") as HTMLElement;
    const jobCount = document.getElementById("jobs-count-display") as HTMLElement;
    
    if (!jobList || !jobCount) return;
    
    jobCount.textContent = "0";
    
    const emptyHTML = `
      <div class="empty-state-container">
        <div class="empty-icon-wrapper">
          <span>📋</span>
        </div>
        <h3 class="empty-title">No jobs found</h3>
        <p class="empty-description">${errorMessage || 'Start highlighting jobs on job boards to see them here.'}</p>
        <button class="btn-empty-action" onclick="window.open('https://hireall.com/help', '_blank')">
          How to add jobs
        </button>
      </div>
    `;
    
    jobList.innerHTML = emptyHTML;
  }
  
  public async changeJobStatus(jobId: string, newStatus: string): Promise<void> {
    try {
      popupUI.showLoading(`status-btn-${jobId}`);
      
      const { EnhancedJobBoardManager } = await import("../../enhancedAddToBoard");
      const result = await EnhancedJobBoardManager.getInstance().updateJobStatus(jobId, newStatus as "interested" | "applied" | "interviewing" | "rejected" | "offered" | "withdrawn");
      
      if (result) {
        // Update the job in local array
        const jobIndex = this.jobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
          this.jobs[jobIndex].status = newStatus;
        }
        
        // Update UI
        updateJobStatusDisplay(jobId, newStatus);
        
        popupUI.showSuccess(`Job marked as ${newStatus}`);
        
        // Refresh jobs if we're not on 'all' filter
        if (this.activeFilter && this.activeFilter !== 'all') {
          setTimeout(() => this.loadJobs(this.activeFilter), 1000);
        }
      } else {
        throw new Error('Failed to update job status');
      }
      
    } catch (error) {
      console.error('Error updating job status:', error);
      popupUI.showError('Failed to update job status');
    } finally {
      popupUI.hideLoading(`status-btn-${jobId}`);
    }
  }
  
  public async checkJobSponsor(jobId: string, companyName: string): Promise<void> {
    try {
      const sponsorBtn = document.getElementById(`sponsor-btn-${jobId}`) as HTMLElement;
      const sponsorStatus = document.getElementById(`sponsor-status-${jobId}`) as HTMLElement;

      const normalizedCompany = normalizeCompanyName(companyName);
      if (!normalizedCompany || isLikelyPlaceholderCompany(normalizedCompany)) {
        if (sponsorBtn) sponsorBtn.style.display = '';
        if (sponsorStatus) {
          sponsorStatus.className = "sponsor-status error";
          sponsorStatus.textContent = "❌ Company name missing";
        }
        return;
      }
      
      if (sponsorBtn) sponsorBtn.style.display = 'none';
      if (sponsorStatus) {
        sponsorStatus.className = "sponsor-status checking";
        sponsorStatus.innerHTML = '<div class="spinner-small"></div> Checking...';
      }
      
      const record = await fetchSponsorRecord(normalizedCompany);

      if (!record) {
        sponsorStatus!.className = "sponsor-status not-licensed";
        sponsorStatus!.innerHTML = '❌ Not found in sponsor register';
        return;
      }

      const isActive = record.isActive !== false;
      const isLicensed = record.isLicensedSponsor;
      const isSkilledWorker = record.isSkilledWorker;

      if (!isActive) {
        sponsorStatus!.className = "sponsor-status not-licensed";
        sponsorStatus!.innerHTML = '⚠️ Sponsor inactive on UK register';
        return;
      }

      if (isLicensed && isSkilledWorker) {
        sponsorStatus!.className = "sponsor-status licensed";
        sponsorStatus!.innerHTML = '✅ Licensed Skilled Worker Sponsor';
      } else if (isSkilledWorker) {
        sponsorStatus!.className = "sponsor-status licensed-alt";
        sponsorStatus!.innerHTML = '📋 Skilled Worker Sponsor (license unverified)';
      } else if (isLicensed) {
        sponsorStatus!.className = "sponsor-status licensed-alt";
        sponsorStatus!.innerHTML = '📋 Licensed for other visa routes';
      } else {
        sponsorStatus!.className = "sponsor-status not-licensed";
        sponsorStatus!.innerHTML = '❌ Not a Skilled Worker sponsor';
      }
      
    } catch (error: any) {
      console.error('Error checking sponsor:', error);
      const sponsorStatus = document.getElementById(`sponsor-status-${jobId}`) as HTMLElement;
      
      if (error.code === 'NOT_LICENSED') {
        sponsorStatus!.className = "sponsor-status not-licensed";
        sponsorStatus!.innerHTML = '🔒 License required. <a href="#" onclick="chrome.tabs.create({url: chrome.runtime.getURL(\'options.html\')})">Upgrade now</a>';
      } else if (error.rateLimitInfo) {
        const resetIn = Math.ceil((error.rateLimitInfo.resetIn || 0) / 1000);
        sponsorStatus!.className = "sponsor-status rate-limited";
        sponsorStatus!.innerHTML = `⏱️ Rate limited. Try again in ${resetIn}s`;
      } else {
        sponsorStatus!.className = "sponsor-status error";
        sponsorStatus!.innerHTML = '❌ Error checking sponsor';
      }
    }
  }
  
  private async checkUKEligibilityForJob(jobId: string): Promise<void> {
    try {
      const job = this.jobs.find(j => j.id === jobId);
      if (!job || !job.sponsored) return;
      
      const eligibility = await this.checkUKEligibility(job);
      
      const eligibilityBadge = document.querySelector(`[data-job-id="${jobId}"].badge-uk-checking`) as HTMLElement;
      if (!eligibilityBadge) return;
      
      if (eligibility === null) {
        eligibilityBadge.style.display = 'none';
      } else if (eligibility) {
        eligibilityBadge.className = "job-badge badge-uk-eligible";
        eligibilityBadge.style.background = "rgba(5, 150, 105, 0.1)";
        eligibilityBadge.style.color = "#059669";
        eligibilityBadge.textContent = "🇬🇧 UK Eligible";
      } else {
        eligibilityBadge.className = "job-badge badge-uk-ineligible";
        eligibilityBadge.style.background = "rgba(220, 38, 38, 0.1)";
        eligibilityBadge.style.color = "#dc2626";
        eligibilityBadge.textContent = "🇬🇧 Not Eligible";
      }
      
    } catch (error) {
      console.error('Error checking UK eligibility:', error);
      const eligibilityBadge = document.querySelector(`[data-job-id="${jobId}"].badge-uk-checking`) as HTMLElement;
      if (eligibilityBadge) {
        eligibilityBadge.style.display = 'none';
      }
    }
  }
  
  private async checkUKEligibility(job: JobStatus): Promise<boolean | null> {
    try {
      // Get UK eligibility criteria from storage
      const criteria = await new Promise<any>((resolve) => {
        chrome.storage.local.get(['ukEligibilityCriteria'], resolve);
      });
      
      if (!criteria.ukEligibilityCriteria) {
        return null;
      }
      
      // Check if job meets criteria
      const { minSalary, requiredSkills, jobTypes } = criteria.ukEligibilityCriteria;
      
      // Check salary
      if (minSalary && job.salary) {
        const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''));
        if (salaryNum < minSalary) {
          return false;
        }
      }
      
      // Check job type (simplified - would need more sophisticated parsing)
      if (jobTypes && jobTypes.length > 0) {
        const title = job.title.toLowerCase();
        const hasMatchingType = jobTypes.some((type: string) => 
          title.includes(type.toLowerCase())
        );
        if (!hasMatchingType) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error checking UK eligibility:', error);
      return null;
    }
  }
  
  private checkUKFiltersEnabled(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      chrome.storage.local.get(['ukFiltersEnabled'], (result) => {
        resolve(result.ukFiltersEnabled || false);
      });
    });
  }
  
  public getJobs(): JobStatus[] {
    return this.jobs;
  }
  
  public getJobsCount(): number {
    return this.jobs.length;
  }
  
  public getSponsoredJobsCount(): number {
    return this.jobs.filter(job => job.sponsored).length;
  }
  
  public getAppliedJobsCount(): number {
    return this.jobs.filter(job => job.status === 'applied').length;
  }
}

// Export singleton instance
export const jobManager = JobManager.getInstance();
