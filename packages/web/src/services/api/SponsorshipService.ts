import { apiClient } from "@/lib/api/client";
import { SponsoredCompany, SponsorshipStats } from "@/types/api";

export class SponsorshipService {
  /**
   * Fetch all sponsored companies with optional filters
   */
  async getAllCompanies(filters?: Record<string, any>): Promise<SponsoredCompany[]> {
    const params = new URLSearchParams();
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }
    const queryString = params.toString();
    return apiClient.get<SponsoredCompany[]>(`/app/sponsorship/companies${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Fetch sponsorship statistics
   */
  async getStats(): Promise<SponsorshipStats> {
    return apiClient.get<SponsorshipStats>(`/app/sponsorship/stats`);
  }

  /**
   * Add a new sponsored company
   */
  async addCompany(data: {
    name: string;
    aliases: string[];
    sponsorshipType: string;
    description?: string;
    website?: string;
    industry?: string;
    createdBy: string;
  }): Promise<{ companyId: string }> {
    return apiClient.post<{ companyId: string }>(`/app/sponsorship/companies`, data);
  }

  /**
   * Fetch all sponsorship rules
   */
  async getAllRules(): Promise<any[]> {
    return apiClient.get<any[]>(`/app/sponsorship/rules`);
  }

  /**
   * Add a new sponsorship rule
   */
  async addRule(data: {
    name: string;
    description: string;
    jobSite: string;
    selectors: string[];
    keywords: string[];
    isActive: boolean;
  }): Promise<{ ruleId: string }> {
    return apiClient.post<{ ruleId: string }>(`/app/sponsorship/rules`, data);
  }

  /**
   * Update the status of a sponsorship rule
   */
  async updateRuleStatus(ruleId: string, isActive: boolean): Promise<void> {
    return apiClient.patch(`/app/sponsorship/rules/${ruleId}/status`, { isActive });
  }
}

export const sponsorshipService = new SponsorshipService();
