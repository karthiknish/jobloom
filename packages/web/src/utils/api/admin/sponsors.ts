import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";
import { apiClient } from "@/lib/api/client";

// Sponsors Management Functions
export const sponsorApi = {
  getSponsors: async (filters?: {
    search?: string;
    industry?: string;
    sponsorshipType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    // Verify admin access before fetching sponsors
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const url = new URL("/api/app/sponsorship/companies", window.location.origin);
    
    if (filters) {
      if (filters.search) url.searchParams.set("search", filters.search);
      if (filters.industry) url.searchParams.set("industry", filters.industry);
      if (filters.sponsorshipType) url.searchParams.set("sponsorshipType", filters.sponsorshipType);
      if (filters.status) url.searchParams.set("status", filters.status);
      if (filters.page) url.searchParams.set("page", filters.page.toString());
      if (filters.limit) url.searchParams.set("limit", filters.limit.toString());
    }

    const endpoint = url.pathname.replace("/api", "") + url.search;
    console.log('[sponsorApi.getSponsors] Fetching from:', endpoint);

    return apiClient.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  createSponsor: async (sponsorData: any): Promise<any> => {
    // Verify admin access before creating sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.post("/app/sponsorship/companies", sponsorData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateSponsor: async (sponsorId: string, sponsorData: any): Promise<any> => {
    // Verify admin access before updating sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.put(`/app/sponsorship/companies/${sponsorId}`, sponsorData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  deleteSponsor: async (sponsorId: string): Promise<any> => {
    // Verify admin access before deleting sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.delete(`/app/sponsorship/companies/${sponsorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getSponsorshipStats: async (): Promise<any> => {
    // Verify admin access before fetching sponsorship stats
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get("/app/sponsorship/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Sponsorship rules functions
  getAllSponsorshipRules: async (): Promise<any> => {
    // Verify admin access before fetching sponsorship rules
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get("/app/sponsorship/rules", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  addSponsorshipRule: async (ruleData: any): Promise<any> => {
    // Verify admin access before adding sponsorship rule
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.post("/app/sponsorship/rules", ruleData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateSponsorshipRuleStatus: async (ruleId: string, isActive: boolean): Promise<any> => {
    // Verify admin access before updating sponsorship rule
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.put(`/app/sponsorship/rules/${ruleId}`, { isActive }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
