import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("applications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const application = await ctx.db.get(args.id);
    if (application && application.userId !== userId) {
      throw new Error("Unauthorized");
    }
    return application;
  },
});

export const getByJobId = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applications")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    notes: v.optional(v.string()),
    resumeVersionId: v.optional(v.id("resumeVersions")),
    coverLetter: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const applicationId = await ctx.db.insert("applications", {
      ...args,
      appliedAt: args.status === "applied" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
    return applicationId;
  },
});

export const update = mutation({
  args: {
    id: v.id("applications"),
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
    resumeVersionId: v.optional(v.id("resumeVersions")),
    coverLetter: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const application = await ctx.db.get(args.id);
    if (!application || application.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const { id, ...rest } = args;
    const updates: any = { ...rest, updatedAt: now };

    if (args.status) {
      if (args.status === "applied" && !application.appliedAt) {
        updates.appliedAt = now;
      }
      if (args.status === "interviewing" && !application.interviewedAt) {
        updates.interviewedAt = [now];
      } else if (args.status === "interviewing" && application.interviewedAt) {
        updates.interviewedAt = [...application.interviewedAt, now];
      }
      if (args.status === "offered" && !application.offeredAt) {
        updates.offeredAt = now;
      }
      if (args.status === "rejected" && !application.rejectedAt) {
        updates.rejectedAt = now;
      }
      if (args.status === "withdrawn" && !application.withdrawnAt) {
        updates.withdrawnAt = now;
      }
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const application = await ctx.db.get(args.id);
    if (!application || application.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
