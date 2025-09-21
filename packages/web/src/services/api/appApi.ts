// services/api/appApi.ts (backed by Firebase Admin endpoints)
import type {
  CvAnalysis,
  SponsoredCompany,
  SponsorshipStats,
} from "../../types/api";

// Generic API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Base API client
class AppApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/app";
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message ||
          `API request failed with status ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return response.json();
  }

  // User endpoints (Firebase userId)
  async getUserById(userId: string) {
    return this.request<{
      _id: string;
      userId: string; // Firebase user ID
      isAdmin?: boolean;
      email: string;
      name: string;
      createdAt: number;
    }>(`/users/${userId}`);
  }


  async getAllUsers() {
    return this.request<
      Array<{
        _id: string;
        email: string;
        name: string;
        isAdmin?: boolean;
        createdAt: number;
      }>
    >(`/users`);
  }

  // Job endpoints
  async getJobStats(userId: string) {
    return this.request<{
      totalJobs: number;
      sponsoredJobs: number;
      totalApplications: number;
      jobsToday: number;
      recruitmentAgencyJobs?: number;
      byStatus: Record<string, number>;
    }>(`/jobs/stats/${userId}`);
  }

  // Application endpoints
  async getApplicationsByUser(userId: string) {
    return this.request<
      Array<{
        _id: string;
        jobId: string;
        userId: string;
        status: string;
        appliedDate?: number;
        notes?: string;
        interviewDates?: number[];
        followUpDate?: number;
        createdAt: number;
        updatedAt: number;
        job?: {
          _id: string;
          title: string;
          company: string;
          location: string;
          url?: string;
          description?: string;
          salary?: string;
          isSponsored: boolean;
          isRecruitmentAgency?: boolean;
          source: string;
          dateFound: number;
          userId: string;
        };
      }>
    >(`/applications/user/${userId}`);
  }

  async updateApplicationStatus(applicationId: string, status: string) {
    return this.request(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Sponsorship endpoints
  async getAllSponsoredCompanies() {
    return this.request<SponsoredCompany[]>(`/sponsorship/companies`);
  }

  async getSponsorshipStats() {
    return this.request<SponsorshipStats>(`/sponsorship/stats`);
  }

  async addSponsoredCompany(data: {
    name: string;
    aliases: string[];
    sponsorshipType: string;
    description?: string;
    website?: string;
    industry?: string;
    createdBy: string;
  }) {
    return this.request<{ companyId: string }>(`/sponsorship/companies`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Sponsorship rules endpoints
  async getAllSponsorshipRules() {
    return this.request<
      Array<{
        _id: string;
        name: string;
        description: string;
        jobSite: string;
        selectors: string[];
        keywords: string[];
        isActive: boolean;
        createdAt: number;
        updatedAt: number;
      }>
    >(`/sponsorship/rules`);
  }

  async addSponsorshipRule(data: {
    name: string;
    description: string;
    jobSite: string;
    selectors: string[];
    keywords: string[];
    isActive: boolean;
  }) {
    return this.request<{ ruleId: string }>(`/sponsorship/rules`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSponsorshipRuleStatus(ruleId: string, isActive: boolean) {
    return this.request(`/sponsorship/rules/${ruleId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  }

  // CV Analysis endpoints
  async getUserCvAnalyses(userId: string) {
    return this.request<CvAnalysis[]>(`/cv-analysis/user/${userId}`);
  }

  async getCvAnalysisStats(userId: string) {
    return this.request<{
      totalAnalyses: number;
      completedAnalyses: number;
      averageScore: number;
      recentAnalysis?: CvAnalysis;
    }>(`/cv-analysis/stats/${userId}`);
  }

  // Contact endpoints
  async createContact(data: { name: string; email: string; message: string }) {
    return this.request(`/contacts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async isUserAdmin(userId: string) {
    return this.request<boolean>(`/admin/is-admin/${userId}`);
  }

  async setAdminUser(userId: string, requesterId: string) {
    return this.request(`/admin/set-admin`, {
      method: "POST",
      body: JSON.stringify({ userId, requesterId }),
    });
  }

  async removeAdminUser(userId: string, requesterId: string) {
    return this.request(`/admin/remove-admin`, {
      method: "POST",
      body: JSON.stringify({ userId, requesterId }),
    });
  }
}

// Export singleton instance
export const appApi = new AppApiClient();
