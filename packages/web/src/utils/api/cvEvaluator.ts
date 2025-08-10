// utils/api/cvEvaluator.ts
import { convexApi } from "../../services/api/convexApi";
import type { CvAnalysis } from "../../types/convex";

export interface UserRecord {
  _id: string;
  clerkId: string;
}

export interface CvStats {
  total: number;
  averageScore: number;
  averageKeywords: number;
  successRate: number;
  totalAnalyses?: number;
  completedAnalyses?: number;
  recentAnalysis?: CvAnalysis;
}

export const cvEvaluatorApi = {
  getUserByClerkId: async (clerkId: string): Promise<UserRecord> => {
    return convexApi.getUserByClerkId(clerkId);
  },

  getUserCvAnalyses: async (userId: string): Promise<CvAnalysis[]> => {
    return convexApi.getUserCvAnalyses(userId);
  },

  getCvAnalysisStats: async (userId: string): Promise<CvStats> => {
    type StatsWithExtras = {
      totalAnalyses?: number;
      completedAnalyses?: number;
      averageScore?: number;
      recentAnalysis?: CvAnalysis;
      averageKeywords?: number;
      successRate?: number;
    };
    const stats: StatsWithExtras = await convexApi.getCvAnalysisStats(userId);
    return {
      total: stats.totalAnalyses ?? 0,
      averageScore: stats.averageScore ?? 0,
      averageKeywords: stats.averageKeywords ?? 0,
      successRate: stats.successRate ?? 0,
      totalAnalyses: stats.totalAnalyses,
      completedAnalyses: stats.completedAnalyses,
      recentAnalysis: stats.recentAnalysis,
    };
  },

  deleteCvAnalysis: async (analysisId: string): Promise<void> => {
    return convexApi.request(`/cv-analysis/${analysisId}`, { method: "DELETE" });
  }
};