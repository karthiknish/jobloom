import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    let jobsQuery = ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await jobsQuery.take(args.limit);
    }

    return await jobsQuery.collect();
  },
});

export const getById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByStatus = query({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("jobs")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    source: v.string(),
    salary: v.optional(v.string()),
    salaryRange: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        currency: v.optional(v.string()),
        period: v.optional(v.string()),
      })
    ),
    jobId: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    requirements: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    qualifications: v.optional(v.array(v.string())),
    jobType: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    remoteWork: v.optional(v.boolean()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    postedDate: v.optional(v.string()),
    applicationDeadline: v.optional(v.string()),
    isSponsored: v.boolean(),
    isRecruitmentAgency: v.optional(v.boolean()),
    sponsorshipType: v.optional(v.string()),
    dateFound: v.number(),
    likelySocCode: v.optional(v.string()),
    socCode: v.optional(v.string()),
    socMatchConfidence: v.optional(v.number()),
    socMatch: v.optional(
      v.object({
        code: v.string(),
        title: v.string(),
        confidence: v.number(),
        matchedKeywords: v.array(v.string()),
        relatedTitles: v.array(v.string()),
        eligibility: v.string(),
      })
    ),
    department: v.optional(v.string()),
    seniority: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    locationType: v.optional(v.string()),
    extractedKeywords: v.optional(v.array(v.string())),
    normalizedTitle: v.optional(v.string()),
    normalizedUrl: v.optional(v.string()),
    jobIdentifier: v.string(),
    visaSponsorship: v.optional(
      v.object({
        mentioned: v.boolean(),
        available: v.boolean(),
        type: v.optional(v.string()),
        requirements: v.optional(v.array(v.string())),
      })
    ),
    status: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("applied"),
        v.literal("interviewing"),
        v.literal("offered"),
        v.literal("rejected"),
        v.literal("withdrawn")
      )
    ),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    applicantCount: v.optional(v.number()),
    easyApply: v.optional(v.boolean()),
    companyLogo: v.optional(v.string()),
    extractionMethod: v.optional(v.string()),
    unsupportedSite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const jobId = await ctx.db.insert("jobs", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return jobId;
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    updates: v.object({
      title: v.optional(v.string()),
      company: v.optional(v.string()),
      location: v.optional(v.string()),
      url: v.optional(v.string()),
      description: v.optional(v.string()),
      source: v.optional(v.string()),
      salary: v.optional(v.string()),
      salaryRange: v.optional(
        v.object({
          min: v.optional(v.number()),
          max: v.optional(v.number()),
          currency: v.optional(v.string()),
          period: v.optional(v.string()),
        })
      ),
      jobId: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      requirements: v.optional(v.array(v.string())),
      benefits: v.optional(v.array(v.string())),
      qualifications: v.optional(v.array(v.string())),
      jobType: v.optional(v.string()),
      experienceLevel: v.optional(v.string()),
      remoteWork: v.optional(v.boolean()),
      companySize: v.optional(v.string()),
      industry: v.optional(v.string()),
      postedDate: v.optional(v.string()),
      applicationDeadline: v.optional(v.string()),
      isSponsored: v.optional(v.boolean()),
      isRecruitmentAgency: v.optional(v.boolean()),
      sponsorshipType: v.optional(v.string()),
      dateFound: v.optional(v.number()),
      likelySocCode: v.optional(v.string()),
      socCode: v.optional(v.string()),
      socMatchConfidence: v.optional(v.number()),
      socMatch: v.optional(
        v.object({
          code: v.string(),
          title: v.string(),
          confidence: v.number(),
          matchedKeywords: v.array(v.string()),
          relatedTitles: v.array(v.string()),
          eligibility: v.string(),
        })
      ),
      department: v.optional(v.string()),
      seniority: v.optional(v.string()),
      employmentType: v.optional(v.string()),
      locationType: v.optional(v.string()),
      extractedKeywords: v.optional(v.array(v.string())),
      normalizedTitle: v.optional(v.string()),
      normalizedUrl: v.optional(v.string()),
      jobIdentifier: v.optional(v.string()),
      visaSponsorship: v.optional(
        v.object({
          mentioned: v.boolean(),
          available: v.boolean(),
          type: v.optional(v.string()),
          requirements: v.optional(v.array(v.string())),
        })
      ),
      status: v.optional(
        v.union(
          v.literal("interested"),
          v.literal("applied"),
          v.literal("interviewing"),
          v.literal("offered"),
          v.literal("rejected"),
          v.literal("withdrawn")
        )
      ),
      notes: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      applicantCount: v.optional(v.number()),
      easyApply: v.optional(v.boolean()),
      companyLogo: v.optional(v.string()),
      extractionMethod: v.optional(v.string()),
      unsupportedSite: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const totalJobs = jobs.length;
    const sponsoredJobs = jobs.filter((job) => job.isSponsored).length;
    const jobsToday = jobs.filter(
      (job) => job.createdAt >= Date.now() - 24 * 60 * 60 * 1000
    ).length;
    const recruitmentAgencyJobs = jobs.filter(
      (job) => job.isRecruitmentAgency
    ).length;

    const byStatus: Record<string, number> = {};
    for (const status of [
      "interested",
      "applied",
      "interviewing",
      "offered",
      "rejected",
      "withdrawn",
    ]) {
      byStatus[status] = jobs.filter((job) => job.status === status).length;
    }

    return {
      totalJobs,
      sponsoredJobs,
      totalApplications: byStatus.applied || 0,
      jobsToday,
      recruitmentAgencyJobs,
      byStatus,
    };
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    // Ideally check for admin auth here, but for now we rely on API route auth
    return await ctx.db.query("jobs").collect();
  },
});
