// utils/api/cvEvaluator.ts
import { convexApi } from "../../services/api/convexApi";
import type { CvAnalysis } from "../../types/convex";

export interface UserRecord {
  _id: string;
  clerkId: string;
}

export interface CvStats {
  totalAnalyses: number;
  completedAnalyses: number;
  averageScore: number;
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
    return convexApi.getCvAnalysisStats(userId);
  },

  deleteCvAnalysis: async (analysisId: string): Promise<void> => {
    return convexApi.request(`/cv-analysis/${analysisId}`, { method: "DELETE" });
  }
};