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
  isPending?: boolean;
  logoUrl?: string;
  dateAdded?: string;
}

export function getStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    interested: createSVGString("target", 14),
    applied: createSVGString("checkCircle", 14),
    rejected: createSVGString("xCircle", 14),
    saved: createSVGString("bookmark", 14),
  };

  return statusIcons[status] || createSVGString("fileText", 14);
}

export function getStatusColor(status: string): { r: number; g: number; b: number } {
  // Status colors aligned with theme.ts EXT_COLORS
  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    interested: { r: 59, g: 130, b: 246 },    // Blue 500 (#3b82f6)
    applied: { r: 16, g: 185, b: 129 },       // Emerald 500 (#10b981) - primary color
    rejected: { r: 239, g: 68, b: 68 },       // Red 500 (#ef4444)
    saved: { r: 100, g: 116, b: 139 },        // Slate 500 (#64748b)
  };

  return statusColors[status] || { r: 100, g: 116, b: 139 };
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    interested: "Interested",
    applied: "Applied",
    rejected: "Rejected",
    saved: "Saved",
  };

  return statusLabels[status] || status;
}

function getCompanyColor(company: string): string {
  // Colors consistent with theme.ts - using Tailwind palette
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', // red, orange, amber, lime, emerald
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'  // cyan, blue, indigo, violet, pink
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getCompanyLogoHTML(company: string, logoUrl?: string): string {
  if (logoUrl) {
    // Use lazy loading for images to improve performance
    return `<img src="${logoUrl}" alt="${company}" class="company-logo-img" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="company-logo-placeholder" style="display:none; background-color: ${getCompanyColor(company)}">${company.charAt(0).toUpperCase()}</div>`;
  }

  const color = getCompanyColor(company);
  return `<div class="company-logo-placeholder" style="background-color: ${color}; color: white;">${company.charAt(0).toUpperCase()}</div>`;
}


export function createJobItemHTML(job: JobStatus, showEligibility?: boolean): string {
  const statusColor = getStatusColor(job.status);
  const statusIcon = getStatusIcon(job.status);

  // Helper for status badge style
  const statusStyle = `background: rgba(${statusColor.r}, ${statusColor.g}, ${statusColor.b}, 0.1); color: rgb(${statusColor.r}, ${statusColor.g}, ${statusColor.b});`;

  // Company Logo
  const companyLogoHTML = getCompanyLogoHTML(job.company, job.logoUrl);

  // Date formatting
  const dateDisplay = job.postedDate
    ? new Date(job.postedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Recently';

  const pendingClass = job.isPending ? 'pending-job' : '';
  const pendingBadge = job.isPending
    ? `<span class="tag" style="background: rgba(245, 158, 11, 0.1); color: rgb(245, 158, 11);" aria-label="Queued for sync">${createSVGString("clock", 12)} Queued</span>`
    : '';

  // Build aria-label for screen readers
  const ariaLabel = `${job.title} at ${job.company}${job.location ? `, ${job.location}` : ''}. Status: ${getStatusLabel(job.status)}${job.sponsored ? '. Visa sponsorship available' : ''}`;

  return `
    <div class="job-card ${pendingClass}" 
         role="article" 
         tabindex="0"
         aria-label="${ariaLabel}"
         aria-describedby="job-status-${job.id}"
         data-status="${job.status}" 
         data-sponsored="${job.sponsored}" 
         data-job-id="${job.id}" 
         style="${job.isPending ? 'opacity: 0.8; border-left: 3px solid #f59e0b;' : ''}">
      <div class="job-header">
        ${companyLogoHTML}
        <div class="job-info">
          <h4 class="job-title" title="${job.title}">${job.title}</h4>
          <div class="job-company">${job.company}</div>
          <div class="job-meta">
            <span>${job.location}</span>
            <span class="meta-dot" aria-hidden="true"></span>
            <span>${dateDisplay}</span>
          </div>
        </div>
      </div>

      
      <div class="job-tags">
        ${pendingBadge}
        <span class="tag" style="${statusStyle}">
          ${statusIcon} ${getStatusLabel(job.status)}
        </span>
        
        ${job.sponsored
      ? `<span class="tag tag-purple">${createSVGString("poundSterling", 12)} Visa Sponsorship</span>`
      : ''
    }
        
        ${showEligibility && !job.isPending
      ? `<span class="tag tag-blue badge-uk-checking" data-job-id="${job.id}">Checking eligibility...</span>`
      : ''
    }
        
        ${job.salary
      ? `<span class="tag tag-green">$ ${job.salary}</span>`
      : ''
    }
        
        ${job.remote
      ? `<span class="tag tag-orange">${createSVGString("globe", 12)} Remote</span>`
      : ''
    }
      </div>
      
      <div class="job-actions">
        <div class="sponsor-status" id="sponsor-status-${job.id}"></div>
        
        ${!job.isPending ? `
        <button class="btn-sm secondary" onclick="checkJobSponsor('${job.id}', '${job.company.replace(/'/g, "\\'")}')" ${!job.sponsored ? 'style="display:none;"' : ''}>
          Check Sponsor
        </button>
        
        ${job.status === 'saved'
        ? `<button class="btn-sm secondary" id="status-btn-${job.id}" onclick="changeJobStatus('${job.id}', 'interested')">Mark Interested</button>`
        : ''
      }
        
        ${job.status === 'interested'
        ? `<button class="btn-sm primary" id="status-btn-${job.id}" onclick="changeJobStatus('${job.id}', 'applied')">Mark Applied</button>`
        : ''
      }
        ` : '<span class="text-xs text-muted">Syncing...</span>'}
        
        ${job.url
      ? `<button class="btn-sm ghost" onclick="openJobUrl('${job.url.replace(/'/g, "\\'")}')">
            ${createSVGString("externalLink", 12)}
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
  const statusBadge = jobItem.querySelector('.tag') as HTMLElement;
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
    const existingButtons = actionsContainer.querySelectorAll('.btn-sm:not([onclick*="checkJobSponsor"]):not([onclick*="openJobUrl"])');
    existingButtons.forEach(btn => btn.remove());

    let actionButton = '';
    switch (newStatus) {
      case 'saved':
        actionButton = `<button class="btn-sm secondary" id="status-btn-${jobId}" onclick="changeJobStatus('${jobId}', 'interested')">Mark Interested</button>`;
        break;
      case 'interested':
        actionButton = `<button class="btn-sm primary" id="status-btn-${jobId}" onclick="changeJobStatus('${jobId}', 'applied')">Mark Applied</button>`;
        break;
    }

    if (actionButton) {
      // Insert before the view job button (last child)
      const viewJobBtn = actionsContainer.querySelector('.btn-sm.ghost');
      if (viewJobBtn) {
        viewJobBtn.insertAdjacentHTML('beforebegin', actionButton);
      } else {
        actionsContainer.insertAdjacentHTML('beforeend', actionButton);
      }
    }
  }
}
