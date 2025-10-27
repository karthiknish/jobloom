import { getAuthClient } from "@/firebase/client";
import { verifyAdminAccess } from "./auth";

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
    const url = new URL("/api/blog/admin/posts", window.location.origin);
    if (status && status !== "all") {
      url.searchParams.set("status", status);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  getBlogStats: async (): Promise<any> => {
    // Verify admin access before fetching blog stats
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/blog/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  createBlogPost: async (postData: any): Promise<any> => {
    // Verify admin access before creating blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/blog/admin/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create blog post");
    }

    return response.json();
  },

  updateBlogPost: async (postId: string, postData: any): Promise<any> => {
    // Verify admin access before updating blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/blog/admin/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update blog post");
    }

    return response.json();
  },

  deleteBlogPost: async (postId: string): Promise<any> => {
    // Verify admin access before deleting blog post
    await verifyAdminAccess();

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/blog/admin/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete blog post");
    }

    return response.json();
  },
};
