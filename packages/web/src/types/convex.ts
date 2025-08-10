import type { Doc } from "../../convex/_generated/dataModel";

// Define Id type for Convex
export type Id<T extends string> = string & { __tableName: T };

// Define types for the sponsored companies
export type SponsoredCompany = Doc<"sponsoredCompanies">;

// Define types for CV analysis
export type CvAnalysis = Doc<"cvAnalyses">;

// Define types for sponsorship stats
export interface SponsorshipStats {
  totalSponsoredCompanies: number;
  industryStats: Record<string, number>;
  sponsorshipTypeStats: Record<string, number>;
}

// Define type for company sponsorship check results
export interface CompanySponsorshipResult {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}