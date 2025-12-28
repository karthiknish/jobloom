import { apiClient } from "@/lib/api/client";
import { CvAnalysis } from "@/types/api";

export class CvService {
  /**
   * Fetch all Resume analyses for a user
   */
  async getUserAnalyses(userId: string): Promise<CvAnalysis[]> {
    return apiClient.get<CvAnalysis[]>(`/app/cv-analysis/user/${userId}`);
  }

  /**
   * Fetch statistics for Resume analyses
   */
  async getAnalysisStats(userId: string): Promise<{
    totalAnalyses: number;
    completedAnalyses: number;
    averageScore: number;
    recentAnalysis?: CvAnalysis;
  }> {
    return apiClient.get(`/app/cv-analysis/stats/${userId}`);
  }
}

export const cvService = new CvService();
