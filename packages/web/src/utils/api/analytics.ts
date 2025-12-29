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
  aiFeedback?: {
    total: number;
    positive: number;
    negative: number;
    sentimentScore: number;
    thisWeek: number;
    byType: Record<string, { total: number; positive: number; negative: number }>;
  };
}

export const analyticsApi = {
  getAdminAnalytics: () => apiClient.get<AdminAnalyticsResponse>("/admin/analytics"),
};
