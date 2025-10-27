import { createSVGString } from "./icons";

export interface JobStatus {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  sponsored: boolean;
  salary?: string;
  remote?: boolean;
  description?: string;
  postedDate?: string;
  url?: string;
}

export function getStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    interested: createSVGString("target", 14),
    applied: createSVGString("checkCircle", 14),
    interviewing: createSVGString("users", 14),
    rejected: createSVGString("xCircle", 14),
    saved: createSVGString("bookmark", 14),
  };
  
  return statusIcons[status] || createSVGString("fileText", 14);
}

export function getStatusColor(status: string): { r: number; g: number; b: number } {
  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    interested: { r: 59, g: 130, b: 246 },
    applied: { r: 34, g: 197, b: 94 },
    interviewing: { r: 168, g: 85, b: 247 },
    rejected: { r: 239, g: 68, b: 68 },
    saved: { r: 107, g: 114, b: 128 },
  };
  
  return statusColors[status] || { r: 107, g: 114, b: 128 };
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    interested: "Interested",
    applied: "Applied",
    interviewing: "Interviewing",
    rejected: "Rejected",
    saved: "Saved",
  };
  
  return statusLabels[status] || status;
}

export function createJobItemHTML(job: JobStatus, showEligibility?: boolean): string {
  const statusColor = getStatusColor(job.status);
  const statusIcon = getStatusIcon(job.status);
  
  return `
    <div class="job-item" data-status="${job.status}" data-sponsored="${job.sponsored}" data-job-id="${job.id}">
      <div class="job-item-header">
        <div class="job-info">
          <h4 class="job-title">${job.title}</h4>
          <div class="job-company">${job.company}</div>
          <div class="job-meta">${job.location} • ${job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recently'}</div>
        </div>
      </div>
      
      <div class="job-badges">
        <span class="job-badge" style="background: rgba(${statusColor.r}, ${statusColor.g}, ${statusColor.b}, 0.1); color: rgb(${statusColor.r}, ${statusColor.g}, ${statusColor.b});">
          ${statusIcon} ${getStatusLabel(job.status)}
        </span>
        
        ${job.sponsored 
          ? `<span class="job-badge badge-sponsored">${createSVGString("poundSterling", 12)} Visa Sponsorship</span>` 
          : ''
        }
        
        ${showEligibility 
          ? `<span class="job-badge badge-uk-checking" data-job-id="${job.id}">Checking eligibility...</span>`
          : ''
        }
        
        ${job.salary 
          ? `<span class="job-badge badge-salary">$ ${job.salary}</span>` 
          : ''
        }
        
        ${job.remote 
          ? `<span class="job-badge badge-remote">${createSVGString("globe", 12)} Remote</span>` 
          : ''
        }
      </div>
      
      <div class="job-actions">
        <div class="sponsor-status" id="sponsor-status-${job.id}"></div>
        
        <button class="job-action-btn" onclick="checkJobSponsor('${job.id}', '${job.company.replace(/'/g, "\\'")}')" ${!job.sponsored ? 'style="display:none;"' : ''}>
          Check Sponsor
        </button>
        
        ${job.status === 'saved' 
          ? `<button class="job-action-btn" id="status-btn-${job.id}" onclick="changeJobStatus('${job.id}', 'interested')">Mark Interested</button>`
          : ''
        }
        
        ${job.status === 'interested' 
          ? `<button class="job-action-btn primary" id="status-btn-${job.id}" onclick="changeJobStatus('${job.id}', 'applied')">Mark Applied</button>`
          : ''
        }
        
        ${job.status === 'applied' 
          ? `<button class="job-action-btn" id="status-btn-${job.id}" onclick="changeJobStatus('${job.id}', 'interviewing')">Interviewing</button>`
          : ''
        }
        
        ${job.url 
          ? `<button class="job-action-btn" onclick="openJobUrl('${job.url.replace(/'/g, "\\'")}')">
            ${createSVGString("externalLink", 12)} View Job
          </button>`
          : ''
        }
      </div>
    </div>
  `;
}

export function updateJobStatusDisplay(jobId: string, newStatus: string): void {
  const jobItem = document.querySelector(`[data-job-id="${jobId}"]`) as HTMLElement;
  if (!jobItem) return;
  
  // Update data attribute
  jobItem.dataset.status = newStatus;
  
  // Update status badge
  const statusBadge = jobItem.querySelector('.job-badge') as HTMLElement;
  if (statusBadge) {
    const statusColor = getStatusColor(newStatus);
    const statusIcon = getStatusIcon(newStatus);
    statusBadge.style.background = `rgba(${statusColor.r}, ${statusColor.g}, ${statusColor.b}, 0.1)`;
    statusBadge.style.color = `rgb(${statusColor.r}, ${statusColor.g}, ${statusColor.b})`;
    statusBadge.innerHTML = `${statusIcon} ${getStatusLabel(newStatus)}`;
  }
  
  // Update action buttons
  const actionsContainer = jobItem.querySelector('.job-actions');
  if (actionsContainer) {
    const existingButtons = actionsContainer.querySelectorAll('.job-action-btn:not([onclick*="checkJobSponsor"]):not([onclick*="openJobUrl"])');
    existingButtons.forEach(btn => btn.remove());
    
    let actionButton = '';
    switch (newStatus) {
      case 'saved':
        actionButton = `<button class="job-action-btn" id="status-btn-${jobId}" onclick="changeJobStatus('${jobId}', 'interested')">Mark Interested</button>`;
        break;
      case 'interested':
        actionButton = `<button class="job-action-btn primary" id="status-btn-${jobId}" onclick="changeJobStatus('${jobId}', 'applied')">Mark Applied</button>`;
        break;
      case 'applied':
        actionButton = `<button class="job-action-btn" id="status-btn-${jobId}" onclick="changeJobStatus('${jobId}', 'interviewing')">Interviewing</button>`;
        break;
    }
    
    if (actionButton) {
      actionsContainer.insertAdjacentHTML('beforeend', actionButton);
    }
  }
}
