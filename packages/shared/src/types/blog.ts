/**
 * Blog-related types
 */

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category: string;
  featuredImage?: string;
  readingTime?: number;
  viewCount: number;
  likeCount: number;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: number;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  postsByCategory: Record<string, number>;
}
