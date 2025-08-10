// utils/api/dashboard.ts
import { convexApi } from "../../services/api/convexApi";

export interface Job {
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
}

export interface Application {
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
  job?: Job;
}

export interface JobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
  byStatus: Record<string, number>;
}

export const dashboardApi = {
  getUserByClerkId: async (clerkId: string): Promise<{ _id: string; clerkId: string }> => {
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
  },

  createJob: async (data: Partial<Job>): Promise<{ jobId: string }> => {
    // This would need to be implemented in your Convex backend
    return convexApi.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createApplication: async (data: Partial<Application>): Promise<{ applicationId: string }> => {
    // This would need to be implemented in your Convex backend
    return convexApi.request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateApplication: async (applicationId: string, data: Partial<Application>): Promise<void> => {
    // This would need to be implemented in your Convex backend
    await convexApi.request(`/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteApplication: async (applicationId: string): Promise<void> => {
    // This would need to be implemented in your Convex backend
    await convexApi.request(`/applications/${applicationId}`, {
      method: "DELETE",
    });
  }
};