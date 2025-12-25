export interface ImportJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  source: string;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  importedJobIds: string[];
  skippedUrls: string[];
  source?: string;
}
