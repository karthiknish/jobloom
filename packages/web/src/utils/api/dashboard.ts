// utils/api/dashboard.ts
import { convexApi } from "../../services/api/convexApi";

export interface UserRecord {
  _id: string;
  clerkId: string;
}

export interface Application {
  _id: string;
  status: string;
  job?: {
    title?: string;
    company?: string;
    location?: string;
    isRecruitmentAgency?: boolean;
  };
  appliedDate?: string | number | Date;
  notes?: string;
}

export interface JobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
}

export const dashboardApi = {
  getUserByClerkId: async (clerkId: string): Promise<UserRecord> => {
    return convexApi.getUserByClerkId(clerkId);
  },

  getApplicationsByUser: async (userId: string): Promise<Application[]> => {
    return convexApi.getApplicationsByUser(userId);
  },

  getJobStats: async (userId: string): Promise<JobStats> => {
    return convexApi.getJobStats(userId);
  },

  updateApplicationStatus: async (applicationId: string, status: string): Promise<void> => {
    await convexApi.updateApplicationStatus(applicationId, status);
  }
};