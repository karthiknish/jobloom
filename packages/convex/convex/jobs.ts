import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit, RateLimitError } from "./rateLimiting";

// Helper function to get client identifier
function getClientIdentifier(ctx: any): string {
  const userId = ctx.auth?.getUserIdentity()?.subject;
  if (userId) return `user:${userId}`;
  
  const clientIP = ctx.request?.headers?.['x-forwarded-for'] || 
                   ctx.request?.headers?.['x-real-ip'] || 
                   'unknown';
  return `ip:${clientIP}`;
}

export const createJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    salary: v.optional(v.string()),
    isSponsored: v.boolean(),
    isRecruitmentAgency: v.optional(v.boolean()),
    source: v.string(),
    userId: v.id("users"),
    clientId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Rate limiting
    const identifier = args.clientId || getClientIdentifier(ctx);
    const rateLimitResult = await checkRateLimit(ctx, "createJob", identifier);
    
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        "createJob"
      );
    }
    const existingJob = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();

    if (existingJob) {
      return existingJob._id;
    }

    const jobId = await ctx.db.insert("jobs", {
      ...args,
      dateFound: Date.now(),
    });

    return jobId;
  },
});

export const getJobsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getSponsoredJobs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isSponsored"), true))
      .order("desc")
      .collect();
  },
});

export const getRecruitmentAgencyJobs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRecruitmentAgency"), true))
      .order("desc")
      .collect();
  },
});

export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    salary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    await ctx.db.patch(jobId, updates);
  },
});

export const deleteJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  },
});

// Job Import Functions
export const importJobsFromCSV = mutation({
  args: {
    userId: v.id("users"),
    jobs: v.array(
      v.object({
        title: v.string(),
        company: v.string(),
        location: v.string(),
        url: v.string(),
        description: v.optional(v.string()),
        salary: v.optional(v.string()),
        isSponsored: v.boolean(),
        isRecruitmentAgency: v.optional(v.boolean()),
        source: v.string(), // "csv", "api", etc.
      })
    ),
    clientId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Rate limiting
    const identifier = args.clientId || getClientIdentifier(ctx);
    const rateLimitResult = await checkRateLimit(ctx, "importJobsFromCSV", identifier);
    
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        "importJobsFromCSV"
      );
    }
    
    const importedJobIds = [];
    const skippedJobs = [];
    
    for (const jobData of args.jobs) {
      try {
        // Check if job already exists
        const existingJob = await ctx.db
          .query("jobs")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("url"), jobData.url))
          .first();
        
        if (existingJob) {
          skippedJobs.push(jobData.url);
          continue;
        }
        
        // Insert new job
        const jobId = await ctx.db.insert("jobs", {
          ...jobData,
          userId: args.userId,
          dateFound: Date.now(),
        });
        
        importedJobIds.push(jobId);
      } catch (error) {
        console.error("Error importing job:", error);
        // Continue with other jobs even if one fails
      }
    }
    
    return {
      importedCount: importedJobIds.length,
      skippedCount: skippedJobs.length,
      importedJobIds,
      skippedUrls: skippedJobs,
    };
  },
});

// Mock API for job board integrations (to be replaced with real API calls)
export const importJobsFromAPI = mutation({
  args: {
    userId: v.id("users"),
    source: v.string(), // "linkedin", "indeed", etc.
    searchQuery: v.optional(v.string()),
    location: v.optional(v.string()),
    clientId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Rate limiting
    const identifier = args.clientId || getClientIdentifier(ctx);
    const rateLimitResult = await checkRateLimit(ctx, "importJobsFromAPI", identifier);
    
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        "importJobsFromAPI"
      );
    }
    
    // This is a mock implementation - in a real app, you would:
    // 1. Call the actual job board API
    // 2. Parse the response
    // 3. Transform the data to match our schema
    // 4. Import the jobs
    
    // For now, we'll return mock data to demonstrate the structure
    const mockJobs = [
      {
        title: "Software Engineer",
        company: "Tech Corp",
        location: "San Francisco, CA",
        url: "https://example.com/jobs/123",
        description: "Exciting opportunity for a software engineer...",
        salary: "$120,000 - $150,000",
        isSponsored: true,
        isRecruitmentAgency: false,
        source: args.source,
      },
      {
        title: "Product Manager",
        company: "Innovation Inc",
        location: "New York, NY",
        url: "https://example.com/jobs/124",
        description: "Lead product development for our flagship product...",
        salary: "$130,000 - $160,000",
        isSponsored: false,
        isRecruitmentAgency: false,
        source: args.source,
      }
    ];
    
    const importedJobIds = [];
    const skippedJobs = [];
    
    for (const jobData of mockJobs) {
      try {
        // Check if job already exists
        const existingJob = await ctx.db
          .query("jobs")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("url"), jobData.url))
          .first();
        
        if (existingJob) {
          skippedJobs.push(jobData.url);
          continue;
        }
        
        // Insert new job
        const jobId = await ctx.db.insert("jobs", {
          ...jobData,
          userId: args.userId,
          dateFound: Date.now(),
        });
        
        importedJobIds.push(jobId);
      } catch (error) {
        console.error("Error importing job:", error);
        // Continue with other jobs even if one fails
      }
    }
    
    return {
      importedCount: importedJobIds.length,
      skippedCount: skippedJobs.length,
      importedJobIds,
      skippedUrls: skippedJobs,
      source: args.source,
    };
  },
});

export const getJobStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const jobsToday = jobs.filter(job => job.dateFound >= todayTimestamp).length;
    const sponsoredJobs = jobs.filter(job => job.isSponsored).length;
    const recruitmentAgencyJobs = jobs.filter(job => job.isRecruitmentAgency).length;
    const totalApplications = applications.length;

    return {
      totalJobs: jobs.length,
      jobsToday,
      sponsoredJobs,
      recruitmentAgencyJobs,
      totalApplications,
      applicationsByStatus: {
        interested: applications.filter(app => app.status === "interested").length,
        applied: applications.filter(app => app.status === "applied").length,
        interviewing: applications.filter(app => app.status === "interviewing").length,
        offered: applications.filter(app => app.status === "offered").length,
        rejected: applications.filter(app => app.status === "rejected").length,
        withdrawn: applications.filter(app => app.status === "withdrawn").length,
      }
    };
  },
});