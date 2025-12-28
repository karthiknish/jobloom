/**
 * Job filtering and export utilities for extension popup
 * Provides search/filter functionality and CSV export
 */

export interface JobBoardEntry {
  id: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  dateAdded: string;
  status: string;
  notes?: string;
  salary?: string;
  isSponsored?: boolean;
  sponsorshipType?: string;
  socCode?: string;
  department?: string;
  seniority?: string;
}

export interface JobFilterOptions {
  searchTerm?: string;
  status?: string;
  isSponsored?: boolean;
}

/**
 * Filter jobs based on search term and status
 */
export function filterJobs(jobs: JobBoardEntry[], options: JobFilterOptions): JobBoardEntry[] {
  let filtered = [...jobs];

  // Filter by status
  if (options.status && options.status !== 'all') {
    if (options.status === 'sponsored') {
      filtered = filtered.filter(job => job.isSponsored === true);
    } else {
      filtered = filtered.filter(job => job.status === options.status);
    }
  }

  // Filter by sponsorship
  if (options.isSponsored !== undefined) {
    filtered = filtered.filter(job => job.isSponsored === options.isSponsored);
  }

  // Filter by search term
  if (options.searchTerm && options.searchTerm.trim()) {
    const term = options.searchTerm.toLowerCase().trim();
    filtered = filtered.filter(job => {
      const searchFields = [
        job.title,
        job.company,
        job.location,
        job.notes,
        job.salary,
        job.department,
        job.seniority
      ].filter(Boolean);
      
      return searchFields.some(field => field!.toLowerCase().includes(term));
    });
  }

  return filtered;
}

/**
 * Export jobs to CSV format
 */
export function exportJobsToCsv(jobs: JobBoardEntry[], filename?: string): void {
  if (jobs.length === 0) {
    console.warn('No jobs to export');
    return;
  }

  const headers = [
    'Title',
    'Company',
    'Location',
    'Status',
    'Applied Date',
    'Salary',
    'URL',
    'Sponsored',
    'Notes'
  ];

  const escapeField = (value: string | undefined | null): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = jobs.map(job => [
    escapeField(job.title),
    escapeField(job.company),
    escapeField(job.location),
    escapeField(job.status),
    escapeField(job.dateAdded ? new Date(job.dateAdded).toLocaleDateString() : ''),
    escapeField(job.salary),
    escapeField(job.url),
    escapeField(job.isSponsored ? 'Yes' : 'No'),
    escapeField(job.notes)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `hireall-jobs-${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
