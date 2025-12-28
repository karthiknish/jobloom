/**
 * Sponsorship-related types
 */

export interface SponsoredCompany {
  _id: string;
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SponsorshipStats {
  totalSponsoredCompanies: number;
  industryStats: Record<string, number>;
  sponsorshipTypeStats: Record<string, number>;
}

export interface CompanySponsorshipResult {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}

export interface SponsorLookupResult {
  id?: string;
  name: string;
  company: string;
  city?: string;
  route?: string;
  typeRating?: string;
  sponsorshipType?: string;
  isActive: boolean;
  eligibleForSponsorship: boolean;
  isLicensedSponsor: boolean;
  isSkilledWorker: boolean;
  lastUpdated?: string | number | null;
  source?: string;
  raw?: any;
  matchConfidence?: number;
  nameMatch?: 'exact' | 'partial' | 'fuzzy' | 'none';
  locationMatch?: 'exact' | 'partial' | 'none' | 'not_provided';
}

export interface SponsorLookupOptions {
  city?: string;
  location?: string;
}
