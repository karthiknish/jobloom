import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";

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
    const response = await fetch("/api/app/users/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  getUsers: async (): Promise<any> => {
    // Verify admin access before fetching users
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/app/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  getUser: async (userId: string): Promise<any> => {
    // Verify admin access before fetching user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  updateUser: async (userId: string, userData: any): Promise<any> => {
    // Verify admin access before updating user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user");
    }

    return response.json();
  },

  deleteUser: async (userId: string): Promise<any> => {
    // Verify admin access before deleting user
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/app/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }

    return response.json();
  },

  setAdminUser: async (userId: string, _requesterId: string): Promise<void> => {
    // Verify admin access before granting admin privileges
    const requestingAdmin = await verifyAdminAccess();

    // Prevent self-demotion or self-promotion issues
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot modify your own admin status");
    }

    // Use API endpoint to update admin status
    const response = await fetch(`/api/app/users/${userId}/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ makeAdmin: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to grant admin privileges");
    }
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
    const response = await fetch(`/api/app/users/${userId}/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ makeAdmin: false }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove admin privileges");
    }
  },
};
