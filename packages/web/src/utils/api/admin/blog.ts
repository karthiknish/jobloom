import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";
import { apiClient } from "@/lib/api/client";

// Blog Management Functions
export const blogApi = {
  getBlogPosts: async (status?: string): Promise<any> => {
    // Verify admin access before fetching blog posts
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    let endpoint = "/blog/admin/posts";
    if (status && status !== "all") {
      endpoint += `?status=${status}`;
    }

    return apiClient.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getBlogPost: async (postId: string): Promise<any> => {
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get(`/blog/admin/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getBlogStats: async (): Promise<any> => {
    // Verify admin access before fetching blog stats
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.get("/blog/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  createBlogPost: async (postData: any): Promise<any> => {
    // Verify admin access before creating blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.post("/blog/admin/posts", postData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateBlogPost: async (postId: string, postData: any): Promise<any> => {
    // Verify admin access before updating blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.put(`/blog/admin/posts/${postId}`, postData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  deleteBlogPost: async (postId: string): Promise<any> => {
    // Verify admin access before deleting blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    return apiClient.delete(`/blog/admin/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
