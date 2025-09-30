import { Application, Job } from "@/types/dashboard";
import { GREETING_CONFIG } from "@/constants/dashboard";

export function getGreeting(): string {
  const hours = new Date().getHours();
  
  if (hours >= GREETING_CONFIG.morning.start && hours < GREETING_CONFIG.morning.end) {
    return GREETING_CONFIG.morning.greeting;
  } else if (hours >= GREETING_CONFIG.afternoon.start && hours < GREETING_CONFIG.afternoon.end) {
    return GREETING_CONFIG.afternoon.greeting;
  } else {
    return GREETING_CONFIG.evening.greeting;
  }
}

export function filterApplications(
  applications: Application[],
  statusFilter: string,
  searchTerm: string,
  companyFilter: string
): Application[] {
  let filtered = applications;

  // Status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter((app) => app.status === statusFilter);
  }

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (app) =>
        app.job?.title.toLowerCase().includes(term) ||
        app.job?.company.toLowerCase().includes(term) ||
        app.job?.location.toLowerCase().includes(term)
    );
  }

  // Company filter
  if (companyFilter !== "all") {
    filtered = filtered.filter((app) => app.job?.company === companyFilter);
  }

  return filtered;
}

export function getUniqueCompanies(applications: Application[]): string[] {
  const companies = applications
    .map((app) => app.job?.company)
    .filter(Boolean) as string[];
  return Array.from(new Set(companies)).sort();
}

export function calculateDaysSince(date: number): number {
  return Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
}

export function formatApplicationDate(date: number): string {
  const daysSince = calculateDaysSince(date);
  return daysSince === 0 ? "Today" : `${daysSince} day${daysSince !== 1 ? "s" : ""} ago`;
}

export function calculateSuccessRate(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const offered = applications.filter((a) => a.status === "offered").length;
  return Math.round((offered / applications.length) * 100);
}

export function calculateInterviewRate(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const interviewing = applications.filter((a) => a.status === "interviewing").length;
  return Math.round((interviewing / applications.length) * 100);
}

export function calculateResponseRate(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const responded = applications.filter(
    (a) => a.status !== "applied" && a.status !== "interested"
  ).length;
  return Math.round((responded / applications.length) * 100);
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

export function getAgencyJobsPercentage(applications: Application[]): number {
  if (applications.length === 0) return 0;
  const agency = applications.filter((a) => a.job?.isRecruitmentAgency).length;
  return Math.round((agency / applications.length) * 100);
}