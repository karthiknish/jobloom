import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createApplication = mutation({
  args: {
    jobId: v.id("jobs"),
    userId: v.id("users"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    appliedDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingApplication) {
      throw new Error("Application already exists for this job");
    }

    const applicationId = await ctx.db.insert("applications", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return applicationId;
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    notes: v.optional(v.string()),
    appliedDate: v.optional(v.number()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { applicationId, ...updates } = args;
    await ctx.db.patch(applicationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const addInterviewDate = mutation({
  args: {
    applicationId: v.id("applications"),
    interviewDate: v.number(),
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    const currentDates = application.interviewDates || [];
    const updatedDates = [...currentDates, args.interviewDate];

    await ctx.db.patch(args.applicationId, {
      interviewDates: updatedDates,
      updatedAt: Date.now(),
    });
  },
});

export const getApplicationsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const applicationsWithJobs = await Promise.all(
      applications.map(async (application) => {
        const job = await ctx.db.get(application.jobId);
        return {
          ...application,
          job,
        };
      })
    );

    return applicationsWithJobs;
  },
});

export const getApplicationsByStatus = query({
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
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .order("desc")
      .collect();

    const applicationsWithJobs = await Promise.all(
      applications.map(async (application) => {
        const job = await ctx.db.get(application.jobId);
        return {
          ...application,
          job,
        };
      })
    );

    return applicationsWithJobs;
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.applicationId);
  },
});