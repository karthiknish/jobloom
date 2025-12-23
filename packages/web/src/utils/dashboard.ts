import { Application } from '@/types/dashboard';

export function calculateResponseRate(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const responded = applications.filter(
    (a) => a.status !== 'interested' && a.status !== 'applied'
  ).length;
  return Math.round((responded / applications.length) * 100);
}

export function calculateOfferRate(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const offered = applications.filter((a) => a.status === 'offered').length;
  return Math.round((offered / applications.length) * 100);
}

export function getStatusCounts(applications: Application[]) {
  const counts = {
    interested: 0,
    applied: 0,
    offered: 0,
    rejected: 0,
  };

  applications.forEach((app) => {
    if (app.status in counts) {
      counts[app.status as keyof typeof counts]++;
    }
  });

  return counts;
}

export function getWeeklyActivity(applications: Application[]) {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activity = last7Days.map((date) => ({
    date,
    count: applications.filter((a) => {
      const appDate = new Date(a.createdAt).toISOString().split('T')[0];
      return appDate === date;
    }).length,
  }));

  return activity;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getAgencyJobsPercentage(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const agency = applications.filter((a) => a.job?.isRecruitmentAgency).length;
  return Math.round((agency / applications.length) * 100);
}

/**
 * Calculate application funnel data
 * Interested -> Applied -> Offered
 */
export function calculateFunnelData(applications: Application[]) {
  const total = applications.length;
  if (total === 0) return [];

  const interested = applications.length;
  const applied = applications.filter(a => 
    ['applied', 'offered', 'rejected'].includes(a.status)
  ).length;
  const offered = applications.filter(a => a.status === 'offered').length;

  return [
    { stage: 'Interested', count: interested, percentage: 100 },
    { stage: 'Applied', count: applied, percentage: calculatePercentage(applied, interested) },
    { stage: 'Offered', count: offered, percentage: calculatePercentage(offered, applied) },
  ];
}

/**
 * Calculate average time from application to offer in days
 */
export function calculateTimeToOffer(applications: Application[]): number | null {
  const offers = applications.filter(a => a.status === 'offered' && (a.appliedDate || a.createdAt));
  if (offers.length === 0) return null;

  const totalDays = offers.reduce((acc, app) => {
    const startDate = app.appliedDate || app.createdAt;
    const days = Math.floor((app.updatedAt - startDate) / (1000 * 60 * 60 * 24));
    return acc + Math.max(0, days);
  }, 0);

  return Math.round(totalDays / offers.length);
}

/**
 * Get response rate analytics by company
 */
export function getResponseRateByCompany(applications: Application[]) {
  const companyStats: Record<string, { total: number; responded: number }> = {};

  applications.forEach(app => {
    const company = app.job?.company || 'Unknown';
    if (!companyStats[company]) {
      companyStats[company] = { total: 0, responded: 0 };
    }
    companyStats[company].total++;
    if (['offered', 'rejected'].includes(app.status)) {
      companyStats[company].responded++;
    }
  });

  return Object.entries(companyStats)
    .map(([name, stats]) => ({
      name,
      rate: calculatePercentage(stats.responded, stats.total),
      total: stats.total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

/**
 * Get success rate by job type
 */
export function getSuccessRateByJobType(applications: Application[]) {
  const typeStats: Record<string, { total: number; offered: number }> = {};

  applications.forEach(app => {
    const type = app.job?.jobType || 'Other';
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, offered: 0 };
    }
    typeStats[type].total++;
    if (app.status === 'offered') {
      typeStats[type].offered++;
    }
  });

  return Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      rate: calculatePercentage(stats.offered, stats.total),
      total: stats.total
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate salary growth across offers
 */
export function calculateSalaryGrowth(applications: Application[]) {
  const offers = applications
    .filter(a => a.status === 'offered' && (a.job?.salaryRange?.min || a.job?.salary))
    .sort((a, b) => a.createdAt - b.createdAt);

  if (offers.length < 2) return null;

  const getSalaryValue = (app: Application): number => {
    if (app.job?.salaryRange?.min) return app.job.salaryRange.min;
    const match = app.job?.salary?.match(/\d+/g);
    return match ? parseInt(match.join('')) : 0;
  };

  const firstSalary = getSalaryValue(offers[0]);
  const lastSalary = getSalaryValue(offers[offers.length - 1]);

  if (firstSalary === 0 || lastSalary === 0) return null;

  return {
    growth: calculatePercentage(lastSalary - firstSalary, firstSalary),
    first: firstSalary,
    last: lastSalary
  };
}

/**
 * Calculate salary distribution and metrics
 */
export function calculateSalaryMetrics(applications: Application[]) {
  const salaries = applications
    .map(app => {
      if (app.job?.salaryRange?.min && app.job?.salaryRange?.max) {
        return (app.job.salaryRange.min + app.job.salaryRange.max) / 2;
      }
      if (app.job?.salaryRange?.min) return app.job.salaryRange.min;
      if (app.job?.salaryRange?.max) return app.job.salaryRange.max;
      
      // Try to parse from string
      const match = app.job?.salary?.replace(/,/g, '').match(/\d+/g);
      if (match && match.length >= 2) {
        return (parseInt(match[0]) + parseInt(match[1])) / 2;
      } else if (match && match.length === 1) {
        return parseInt(match[0]);
      }
      return null;
    })
    .filter((s): s is number => s !== null && s > 1000); // Filter out small numbers that might not be annual salary

  if (salaries.length === 0) return null;

  const sorted = [...salaries].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
  const median = sorted[Math.floor(sorted.length / 2)];

  return { min, max, avg, median, count: salaries.length, all: sorted };
}

export function calculateSuccessRate(applications: Application[]): number {
  return calculateOfferRate(applications);
}

export function getWeeklyApplications(applications: Application[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return applications.filter((a) => a.createdAt >= weekAgo).length;
}

export function getSponsoredJobsPercentage(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const sponsored = applications.filter((a) => a.job?.isSponsored).length;
  return Math.round((sponsored / applications.length) * 100);
}

export function formatApplicationDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function filterApplications(applications: Application[], searchTerm: string, statusFilter: string, companyFilter: string): Application[] {
  return applications.filter((app) => {
    const matchesSearch = 
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesCompany = companyFilter === "all" || app.job?.company === companyFilter;
    
    return matchesSearch && matchesStatus && matchesCompany;
  });
}

export function getUniqueCompanies(applications: Application[]): string[] {
  const companies = applications
    .map((app) => app.job?.company)
    .filter((company): company is string => !!company);
  return Array.from(new Set(companies)).sort();
}
