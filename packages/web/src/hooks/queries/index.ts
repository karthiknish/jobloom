/**
 * Query Hooks Module
 * 
 * Central export point for all TanStack Query hooks.
 * Import from this file for convenience:
 * 
 * @example
 * import { useBlogs, useBlog, queryKeys } from '@/hooks/queries';
 */

// Query keys factory
export { queryKeys } from "./queryKeys";

// Query helpers and utilities
export {
  queryPresets,
  useInvalidateQueries,
  fetchApi,
  type QueryOptions,
  type MutationOptions,
} from "./useQueryHelpers";

// Domain-specific hooks
export {
  // Blog queries
  useBlogs,
  useBlog,
  useBlogsByCategory,
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  usePublishBlog,
  useUnpublishBlog,
  // Types
  type BlogPost,
  type BlogListResponse,
  type CreateBlogInput,
  type UpdateBlogInput,
} from "./useBlogQueries";
export * from "./useAdminQueries";

// Re-export TanStack Query essentials for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
