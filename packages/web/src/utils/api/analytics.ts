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

export interface TimeSeriesPoint {
  date: string;
  signups: number;
  applications: number;
  revenue: number;
}

export interface TimeSeriesResponse {
  data: TimeSeriesPoint[];
  range: string;
  count: number;
  timestamp: string;
}

export const analyticsApi = {
  getAdminAnalytics: () => apiClient.get<AdminAnalyticsResponse>("/admin/analytics"),
  getTimeSeriesAnalytics: (range: string = "30d") => 
    apiClient.get<TimeSeriesResponse>(`/admin/analytics/time-series?range=${range}`),
};
