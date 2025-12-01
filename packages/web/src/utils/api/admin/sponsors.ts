import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";

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

    console.log('[sponsorApi.getSponsors] Fetching from:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sponsorApi.getSponsors] Error response:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[sponsorApi.getSponsors] Response data:', data);
    return data;
  },

  createSponsor: async (sponsorData: any): Promise<any> => {
    // Verify admin access before creating sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/app/sponsorship/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sponsorData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create sponsor");
    }

    return response.json();
  },

  updateSponsor: async (sponsorId: string, sponsorData: any): Promise<any> => {
    // Verify admin access before updating sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/sponsorship/companies/${sponsorId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sponsorData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update sponsor");
    }

    return response.json();
  },

  deleteSponsor: async (sponsorId: string): Promise<any> => {
    // Verify admin access before deleting sponsor
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/sponsorship/companies/${sponsorId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete sponsor");
    }

    return response.json();
  },

  getSponsorshipStats: async (): Promise<any> => {
    // Verify admin access before fetching sponsorship stats
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/app/sponsorship/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
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
    const response = await fetch("/api/app/sponsorship/rules", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  addSponsorshipRule: async (ruleData: any): Promise<any> => {
    // Verify admin access before adding sponsorship rule
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/app/sponsorship/rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ruleData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  updateSponsorshipRuleStatus: async (ruleId: string, isActive: boolean): Promise<any> => {
    // Verify admin access before updating sponsorship rule
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/sponsorship/rules/${ruleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
