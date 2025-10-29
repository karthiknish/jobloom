import { fetchSponsorRecord, SponsorLookupResult } from "./lookup";

export interface SponsorJobData {
  company: string;
  isSponsored?: boolean;
  sponsorshipType?: string | null;
  [key: string]: any;
}

export interface HighlightableJob {
  element: Element;
  data: SponsorJobData;
}

export interface SponsorHighlightResult {
  totalJobs: number;
  sponsoredMatches: number;
}

export interface SponsorHighlightDependencies {
  checkRateLimit(): Promise<boolean>;
  applyHighlight(element: Element, sponsorshipType: string): void;
  addJobToBoard(jobData: SponsorJobData): void | Promise<void>;
  onCompanyEvaluated?: (company: string, record: SponsorLookupResult | null) => void;
  onHighlightApplied?: (job: HighlightableJob, record: SponsorLookupResult | null) => void;
  log?: (level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) => void;
}

function shouldTreatAsSponsored(record: SponsorLookupResult | null): boolean {
  if (!record) return false;
  if (record.isActive === false) return false;
  if (record.eligibleForSponsorship) return true;
  if (record.isLicensedSponsor && record.isSkilledWorker) return true;
  if (record.isSkilledWorker) return true;
  return false;
}

export async function highlightSponsoredJobs(
  jobs: HighlightableJob[],
  dependencies: SponsorHighlightDependencies
): Promise<SponsorHighlightResult> {
  const { checkRateLimit, applyHighlight, addJobToBoard, onCompanyEvaluated, onHighlightApplied, log } = dependencies;

  if (jobs.length === 0) {
    return { totalJobs: 0, sponsoredMatches: 0 };
  }

  const rateAllowed = await checkRateLimit();
  if (!rateAllowed) {
    log?.("warn", "Sponsor highlight skipped due to rate limit", { totalJobs: jobs.length });
    return { totalJobs: jobs.length, sponsoredMatches: 0 };
  }

  const uniqueCompanies = Array.from(
    new Set(
      jobs
        .map((job) => job.data?.company?.trim())
        .filter((company): company is string => Boolean(company))
    )
  );

  const companyResults = new Map<string, SponsorLookupResult | null>();

  for (const company of uniqueCompanies) {
    try {
      const record = await fetchSponsorRecord(company);
      companyResults.set(company, record);
      onCompanyEvaluated?.(company, record ?? null);
    } catch (error) {
      log?.("warn", "Sponsor lookup failed", { company, error: error instanceof Error ? error.message : String(error) });
      companyResults.set(company, null);
      onCompanyEvaluated?.(company, null);
    }
  }

  let sponsoredMatches = 0;

  for (const job of jobs) {
    const company = job.data?.company?.trim();
    if (!company) {
      continue;
    }

    const record = companyResults.get(company) ?? null;
    const isSponsored = shouldTreatAsSponsored(record);

    if (isSponsored) {
      job.data.isSponsored = true;
      job.data.sponsorshipType = record?.sponsorshipType || record?.route || "sponsored";
      applyHighlight(job.element, job.data.sponsorshipType ?? "sponsored");
      addJobToBoard(job.data);
      sponsoredMatches += 1;
      onHighlightApplied?.(job, record);
      continue;
    }

    job.data.isSponsored = false;
    job.data.sponsorshipType = job.data.sponsorshipType ?? null;
    onHighlightApplied?.(job, record);
  }

  const result: SponsorHighlightResult = {
    totalJobs: jobs.length,
    sponsoredMatches,
  };

  log?.("info", "Sponsor highlight completed", { ...result });
  return result;
}
