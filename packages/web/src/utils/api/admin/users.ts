import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";
import { apiClient } from "@/lib/api/client";

// User Management Functions
export const userApi = {
  getUserStats: async (): Promise<any> => {
    // Verify admin access before fetching user stats
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get("/app/users/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getUsers: async (): Promise<any> => {
    // Verify admin access before fetching users
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get("/app/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getUser: async (userId: string): Promise<any> => {
    // Verify admin access before fetching user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get(`/app/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateUser: async (userId: string, userData: any): Promise<any> => {
    // Verify admin access before updating user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.put(`/app/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  deleteUser: async (userId: string): Promise<any> => {
    // Verify admin access before deleting user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.delete(`/app/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  setAdminUser: async (userId: string, _requesterId: string): Promise<void> => {
    // Verify admin access before granting admin privileges
    const requestingAdmin = await verifyAdminAccess();

    // Prevent self-demotion or self-promotion issues
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot modify your own admin status");
    }

    // Use API endpoint to update admin status
    await apiClient.post(`/app/users/${userId}/admin`, { makeAdmin: true });
  },

  removeAdminUser: async (
    userId: string,
    _requesterId: string
  ): Promise<void> => {
    // Verify admin access before removing admin privileges
    const requestingAdmin = await verifyAdminAccess();

    // Prevent self-demotion
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot remove your own admin status");
    }

    // Use API endpoint to update admin status
    await apiClient.post(`/app/users/${userId}/admin`, { makeAdmin: false });
  },

  createUser: async (userData: any): Promise<any> => {
    // Verify admin access before creating user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.post("/app/users", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
