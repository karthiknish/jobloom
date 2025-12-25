import { apiClient } from "@/lib/api/client";

export interface AdminAnalyticsResponse {
  users?: {
    total?: number;
    newThisMonth?: number;
    premium?: number;
    free?: number;
  };
  activeUsers?: {
    weekly?: number;
  };
  features?: {
    cvAnalyses?: number;
  };
  applications?: {
    total?: number;
  };
  events?: {
    top?: Array<{ event: string; count: number }>;
  };
}

export const analyticsApi = {
  getAdminAnalytics: () => apiClient.get<AdminAnalyticsResponse>("/admin/analytics"),
};
