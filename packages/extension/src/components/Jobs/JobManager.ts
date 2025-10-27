import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../../constants";
import { get } from "../../apiClient";
import { JobStatus, createJobItemHTML, updateJobStatusDisplay } from "../../utils/jobStatus";
import { popupUI } from "../UI/PopupUI";

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
      const { JobBoardManager } = await import("../../addToBoard");
      const allJobs = await JobBoardManager.getAllJobs();
      
      // Apply filters
      let filteredJobs = allJobs;
      if (filterType && filterType !== 'all') {
        filteredJobs = allJobs.filter(job => {
          switch (filterType) {
            case 'sponsored':
              return job.sponsorshipInfo?.isSponsored === true;
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
        company: job.company,
        location: job.location,
        status: job.status,
        sponsored: job.sponsorshipInfo?.isSponsored || false,
        salary: job.salary,
        remote: job.remoteWork,
        url: job.url
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
    const jobCount = document.getElementById("jobs-count") as HTMLElement;
    if (jobCount) {
      jobCount.textContent = `${this.jobs.length} job${this.jobs.length !== 1 ? 's' : ''}`;
    }
    
    // Check if UK filters are enabled
    const ukFiltersEnabled = await this.checkUKFiltersEnabled();
    
    const jobsHTML = this.jobs.map(job => {
      const jobHTML = createJobItemHTML(job, ukFiltersEnabled);
      
      // If UK filters are enabled, check eligibility
      if (ukFiltersEnabled && job.sponsored) {
        this.checkUKEligibilityForJob(job.id);
      }
      
      return jobHTML;
    }).join('');
    
    jobList.innerHTML = jobsHTML;
    
    // Update active filter button
    popupUI.setActiveFilter(this.activeFilter);
  }
  
  private renderEmptyState(errorMessage?: string): void {
    const jobList = document.getElementById("job-list") as HTMLElement;
    const jobCount = document.getElementById("jobs-count") as HTMLElement;
    
    if (!jobList || !jobCount) return;
    
    jobCount.textContent = "0 jobs";
    
    const emptyHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No jobs found</h3>
        <p>${errorMessage || 'Start highlighting jobs on job boards to see them here.'}</p>
        <button class="action-btn" style="margin-top: 16px; padding: 8px 16px; font-size: 12px;" onclick="document.querySelector('.nav-tab[data-tab=&quot;jobs&quot;]').click()">
          <div class="action-icon primary">🎯</div>
          <div class="action-content">
            <span>How to add jobs</span>
            <span style="font-size: 11px; opacity: 0.8;">Highlight job descriptions on any job board</span>
          </div>
        </button>
      </div>
    `;
    
    jobList.innerHTML = emptyHTML;
  }
  
  public async changeJobStatus(jobId: string, newStatus: string): Promise<void> {
    try {
      popupUI.showLoading(`status-btn-${jobId}`);
      
      const { JobBoardManager } = await import("../../addToBoard");
      const result = await JobBoardManager.updateJobStatus(jobId, newStatus as "interested" | "applied" | "interviewing" | "rejected" | "offered" | "withdrawn");
      
      if (result.success) {
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
        throw new Error(result.message || 'Failed to update job status');
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
      
      if (sponsorBtn) sponsorBtn.style.display = 'none';
      if (sponsorStatus) {
        sponsorStatus.className = "sponsor-status checking";
        sponsorStatus.innerHTML = '<div class="spinner-small"></div> Checking...';
      }
      
      const data = await get<any>("/api/app/sponsorship/companies", {
        companyName: companyName
      });
      
      if (data.error) {
        if (data.rateLimitInfo) {
          const resetIn = Math.ceil((data.rateLimitInfo.resetIn || 0) / 1000);
          sponsorStatus!.className = "sponsor-status rate-limited";
          sponsorStatus!.innerHTML = `⏱️ Rate limited. Try again in ${resetIn}s`;
        } else if (data.code === 'NOT_LICENSED') {
          sponsorStatus!.className = "sponsor-status not-licensed";
          sponsorStatus!.innerHTML = '🔒 License required. <a href="#" onclick="chrome.tabs.create({url: chrome.runtime.getURL(\'options.html\')})">Upgrade now</a>';
        } else {
          throw new Error(data.error);
        }
        return;
      }
      
      const result = data.result;
      
      if (result.isLicensedSponsor && result.isSponsorForAOrB) {
        sponsorStatus!.className = "sponsor-status licensed";
        sponsorStatus!.innerHTML = '✅ Licensed A/B Sponsor';
      } else if (result.isSponsorForAOrB) {
        sponsorStatus!.className = "sponsor-status licensed-alt";
        sponsorStatus!.innerHTML = '📋 A/B Sponsor (License unverified)';
      } else {
        sponsorStatus!.className = result.reason === 'not_skilled_worker'
          ? "sponsor-status not-skilled"
          : "sponsor-status not-licensed";
        sponsorStatus!.innerHTML = result.reason === 'not_skilled_worker'
          ? '⚠️ Not on skilled worker list'
          : '❌ Not an A/B Sponsor';
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
