import { NextRequest, NextResponse } from "next/server";

// Sample blog posts data for demonstration
const sampleBlogPosts = [
  {
    _id: "1",
    title: "10 Essential Skills Every Job Seeker Needs in 2025",
    slug: "essential-skills-job-seekers-2025",
    excerpt: "Discover the most in-demand skills that will make you stand out in today's competitive job market.",
    content: "# 10 Essential Skills Every Job Seeker Needs in 2025\n\nIn today's rapidly evolving job market, staying ahead of the curve is crucial for career success.\n\n## 1. Digital Literacy\n\nTechnology proficiency is now a baseline requirement.\n\n## 2. Data Analysis\n\nUnderstanding data trends is increasingly important.\n\n## 3. Communication Skills\n\nSoft skills remain crucial for success.",
    category: "Career Development",
    tags: ["skills", "career"],
    featuredImage: "https://images.pexels.com/photos/3184430/pexels-photo-3184430.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    author: {
      id: "admin",
      name: "HireAll Team",
      email: "team@hireall.com"
    },
    publishedAt: { _seconds: Date.now() / 1000 },
    createdAt: { _seconds: Date.now() / 1000 },
    updatedAt: { _seconds: Date.now() / 1000 },
    readingTime: 5,
    viewCount: 0,
    likeCount: 0
  },
  {
    _id: "2",
    title: "How to Ace Your Technical Interview",
    slug: "ace-technical-interview-guide",
    excerpt: "Master the art of technical interviews with proven strategies.",
    content: "# How to Ace Your Technical Interview\n\nTechnical interviews can be intimidating, but preparation is key.\n\n## Preparation Strategies\n\nPractice coding problems regularly and understand algorithms.\n\n## During the Interview\n\nCommunicate your thought process clearly.\n\n## Key Tips\n\nStay calm and ask clarifying questions when needed.",
    category: "Interview Preparation",
    tags: ["interview", "technical"],
    featuredImage: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    author: {
      id: "admin",
      name: "HireAll Team",
      email: "team@hireall.com"
    },
    publishedAt: { _seconds: Date.now() / 1000 },
    createdAt: { _seconds: Date.now() / 1000 },
    updatedAt: { _seconds: Date.now() / 1000 },
    readingTime: 3,
    viewCount: 0,
    likeCount: 0
  },
  {
    _id: "3",
    title: "Building a Personal Brand",
    slug: "building-personal-brand-career",
    excerpt: "Learn how to build a compelling personal brand for career growth.",
    content: "# Building a Personal Brand\n\nYour personal brand is how others perceive you professionally.\n\n## Key Components\n\n- Professional identity\n- Values and beliefs\n- Online presence\n\n## Getting Started\n\nDefine your unique value proposition and create consistent content.\n\n## Networking\n\nBuild genuine professional relationships online.",
    category: "Career Development",
    tags: ["personal branding", "career"],
    featuredImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    author: {
      id: "admin",
      name: "HireAll Team",
      email: "team@hireall.com"
    },
    publishedAt: { _seconds: Date.now() / 1000 },
    createdAt: { _seconds: Date.now() / 1000 },
    updatedAt: { _seconds: Date.now() / 1000 },
    readingTime: 4,
    viewCount: 0,
    likeCount: 0
  }
];

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    let posts = [...sampleBlogPosts];

    // Apply filters
    if (category) {
      posts = posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
    }

    if (tag) {
      posts = posts.filter(post => post.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: posts.length,
        pages: Math.ceil(posts.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  }
}
