/**
 * Query Keys Factory
 * 
 * Centralized query key management for consistent cache invalidation.
 * Uses a factory pattern for type-safe, hierarchical query keys.
 * 
 * @example
 * // Get all blogs
 * queryKeys.blogs.all()  // ['blogs']
 * 
 * // Get a single blog by slug
 * queryKeys.blogs.detail('my-post')  // ['blogs', 'detail', 'my-post']
 * 
 * // Invalidate all blogs
 * queryClient.invalidateQueries({ queryKey: queryKeys.blogs.all() })
 */

// Base query key types for type safety
type QueryKeyFactory<T extends string> = {
  all: () => readonly [T];
  lists: () => readonly [T, "list"];
  list: (filters?: Record<string, unknown>) => readonly [T, "list", Record<string, unknown>?];
  details: () => readonly [T, "detail"];
  detail: (id: string) => readonly [T, "detail", string];
};

/**
 * Create a query key factory for a given entity
 */
function createQueryKeyFactory<T extends string>(entity: T): QueryKeyFactory<T> {
  return {
    all: () => [entity] as const,
    lists: () => [entity, "list"] as const,
    list: (filters?: Record<string, unknown>) => 
      filters ? [entity, "list", filters] as const : [entity, "list"] as const,
    details: () => [entity, "detail"] as const,
    detail: (id: string) => [entity, "detail", id] as const,
  };
}

/**
 * Centralized query keys for the application
 * 
 * Organized by domain/feature area for easy discovery and maintenance.
 */
export const queryKeys = {
  // Blog queries
  blogs: {
    ...createQueryKeyFactory("blogs"),
    byCategory: (category: string) => ["blogs", "category", category] as const,
    byTag: (tag: string) => ["blogs", "tag", tag] as const,
  },

  // User management (admin)
  users: {
    ...createQueryKeyFactory("users"),
    stats: () => ["users", "stats"] as const,
    recent: (limit: number) => ["users", "recent", limit] as const,
  },

  // Jobs/Applications
  jobs: {
    ...createQueryKeyFactory("jobs"),
    byStatus: (status: string) => ["jobs", "status", status] as const,
    stats: () => ["jobs", "stats"] as const,
    dashboard: () => ["jobs", "dashboard"] as const,
  },

  // Applications
  applications: {
    ...createQueryKeyFactory("applications"),
    byJob: (jobId: string) => ["applications", "job", jobId] as const,
    byUser: (userId: string) => ["applications", "user", userId] as const,
    stats: () => ["applications", "stats"] as const,
  },

  // CV/Resume analysis
  cvAnalysis: {
    ...createQueryKeyFactory("cvAnalysis"),
    history: (userId: string) => ["cvAnalysis", "history", userId] as const,
    stats: (userId: string) => ["cvAnalysis", "stats", userId] as const,
    limits: () => ["cvAnalysis", "limits"] as const,
  },

  // Volunteers
  volunteers: {
    ...createQueryKeyFactory("volunteers"),
    pending: () => ["volunteers", "pending"] as const,
    approved: () => ["volunteers", "approved"] as const,
  },

  // Contact submissions
  contacts: {
    ...createQueryKeyFactory("contacts"),
    unread: () => ["contacts", "unread"] as const,
  },

  // Sponsors
  sponsors: {
    ...createQueryKeyFactory("sponsors"),
    active: () => ["sponsors", "active"] as const,
    rules: () => ["sponsors", "rules"] as const,
  },

  // Learning modules
  learning: {
    ...createQueryKeyFactory("learning"),
    modules: () => ["learning", "modules"] as const,
    progress: (userId: string) => ["learning", "progress", userId] as const,
  },

  // Reports/Analytics
  reports: {
    all: () => ["reports"] as const,
    summary: () => ["reports", "summary"] as const,
    analytics: (period: string) => ["reports", "analytics", period] as const,
  },

  // Global search
  search: {
    all: () => ["search"] as const,
    results: (query: string) => ["search", "results", query] as const,
    suggestions: (query: string) => ["search", "suggestions", query] as const,
  },

  // Subscription
  subscription: {
    all: () => ["subscription"] as const,
    current: () => ["subscription", "current"] as const,
    usage: () => ["subscription", "usage"] as const,
  },

  // Feedback
  feedback: {
    ...createQueryKeyFactory("feedback"),
    byUser: (userId: string) => ["feedback", "user", userId] as const,
  },
} as const;

// Export type for query key inference
export type QueryKeys = typeof queryKeys;
