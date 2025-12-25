import { apiClient } from "@/lib/api/client";
import type { BlogPost } from "@/types/api";

export interface BlogListResponse {
  posts: BlogPost[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const blogApi = {
  getPost: (slug: string) => apiClient.get<BlogPost>(`/blog/posts/${slug}`),

  getPosts: (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);

    const query = searchParams.toString();
    const suffix = query ? `?${query}` : "";
    return apiClient.get<BlogListResponse>(`/blog/posts${suffix}`);
  },

  getRelated: (limit = 3) => apiClient.get<{ posts: BlogPost[] }>(`/blog/posts?limit=${limit}`),

  likePost: (slug: string) => apiClient.post(`/blog/posts/${slug}`),
};
