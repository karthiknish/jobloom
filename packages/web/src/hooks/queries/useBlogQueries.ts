/**
 * Blog Query Hooks
 * 
 * TanStack Query hooks for blog-related data fetching and mutations.
 * 
 * @example
 * // Fetch all blogs
 * const { data: blogs, isLoading } = useBlogs();
 * 
 * // Fetch single blog
 * const { data: blog } = useBlog('my-post-slug');
 * 
 * // Create a new blog
 * const { mutate: createBlog } = useCreateBlog();
 * createBlog({ title: 'New Post', content: '...' });
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { fetchApi, queryPresets } from "./useQueryHelpers";

// Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featuredImage?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateBlogInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featuredImage?: string;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: string;
}

// Query Hooks

/**
 * Fetch all blog posts with optional filters
 */
export function useBlogs(filters?: {
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: queryKeys.blogs.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));
      
      const queryString = params.toString();
      const endpoint = `/api/blog${queryString ? `?${queryString}` : ""}`;
      
      return fetchApi<BlogListResponse>(endpoint);
    },
    ...queryPresets.user,
  });
}

/**
 * Fetch a single blog post by slug
 */
export function useBlog(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogs.detail(slug || ""),
    queryFn: () => fetchApi<BlogPost>(`/api/blog/${slug}`),
    enabled: !!slug,
    ...queryPresets.static,
  });
}

/**
 * Fetch blogs by category
 */
export function useBlogsByCategory(category: string) {
  return useQuery({
    queryKey: queryKeys.blogs.byCategory(category),
    queryFn: () => fetchApi<BlogListResponse>(`/api/blog?category=${category}`),
    enabled: !!category,
    ...queryPresets.user,
  });
}

// Mutation Hooks

/**
 * Create a new blog post
 */
export function useCreateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlogInput) =>
      fetchApi<BlogPost>("/api/blog", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      // Invalidate blog list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
    },
  });
}

/**
 * Update an existing blog post
 */
export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBlogInput) =>
      fetchApi<BlogPost>(`/api/blog/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (updatedBlog) => {
      // Update the specific blog in cache
      queryClient.setQueryData(
        queryKeys.blogs.detail(updatedBlog.slug),
        updatedBlog
      );
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
    },
  });
}

/**
 * Delete a blog post
 */
export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/blog/${id}`, { method: "DELETE" }),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.blogs.detail(deletedId) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
    },
  });
}

/**
 * Publish a draft blog post
 */
export function usePublishBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<BlogPost>(`/api/blog/${id}/publish`, { method: "POST" }),
    onSuccess: (publishedBlog) => {
      queryClient.setQueryData(
        queryKeys.blogs.detail(publishedBlog.slug),
        publishedBlog
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
    },
  });
}

/**
 * Unpublish a blog post (move to draft)
 */
export function useUnpublishBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<BlogPost>(`/api/blog/${id}/unpublish`, { method: "POST" }),
    onSuccess: (unpublishedBlog) => {
      queryClient.setQueryData(
        queryKeys.blogs.detail(unpublishedBlog.slug),
        unpublishedBlog
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
    },
  });
}
