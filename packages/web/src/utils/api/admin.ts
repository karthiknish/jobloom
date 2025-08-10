// utils/api/admin.ts
import { convexApi } from "../../services/api/convexApi";
import type { SponsoredCompany, SponsorshipStats } from "../../types/convex";

export interface UserRecord {
  _id: string;
  clerkId: string;
}

export const adminApi = {
  getUserByClerkId: async (clerkId: string): Promise<UserRecord> => {
    return convexApi.getUserByClerkId(clerkId);
  },

  getAllSponsoredCompanies: async (): Promise<SponsoredCompany[]> => {
    return convexApi.getAllSponsoredCompanies();
  },

  getSponsorshipStats: async (): Promise<SponsorshipStats> => {
    return convexApi.getSponsorshipStats();
  },

  addSponsoredCompany: async (data: {
    name: string;
    aliases: string[];
    sponsorshipType: string;
    description?: string;
    website?: string;
    industry?: string;
    createdBy: string;
  }): Promise<{ companyId: string }> => {
    return convexApi.addSponsoredCompany(data);
  }
};