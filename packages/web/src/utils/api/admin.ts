// utils/api/admin.ts
import { convexApi } from "../../services/api/convexApi";
import type { SponsoredCompany, SponsorshipStats } from "../../types/convex";

export interface UserRecord {
  _id: string;
  clerkId?: string;
  isAdmin?: boolean;
  email: string;
  name: string;
  createdAt: number;
}

export interface SponsorshipRule {
  _id: string;
  name: string;
  description: string;
  jobSite: string;
  selectors: string[];
  keywords: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
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
  },

  isUserAdmin: async (userId: string): Promise<boolean> => {
    return convexApi.isUserAdmin(userId);
  },

  setAdminUser: async (userId: string, requesterId: string): Promise<void> => {
    await convexApi.setAdminUser(userId, requesterId);
  },

  removeAdminUser: async (userId: string, requesterId: string): Promise<void> => {
    await convexApi.removeAdminUser(userId, requesterId);
  },

  // User management
  getAllUsers: async (): Promise<UserRecord[]> => {
    return convexApi.getAllUsers();
  },

  // Sponsorship rules
  getAllSponsorshipRules: async (): Promise<SponsorshipRule[]> => {
    return convexApi.getAllSponsorshipRules();
  },

  addSponsorshipRule: async (data: {
    name: string;
    description: string;
    jobSite: string;
    selectors: string[];
    keywords: string[];
    isActive: boolean;
  }): Promise<{ ruleId: string }> => {
    return convexApi.addSponsorshipRule(data);
  },

  updateSponsorshipRuleStatus: async (ruleId: string, isActive: boolean): Promise<void> => {
    await convexApi.updateSponsorshipRuleStatus(ruleId, isActive);
  }
};