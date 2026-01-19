import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const activitiesQuery = ctx.db
      .query("activities")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await activitiesQuery.take(args.limit);
    }

    return await activitiesQuery.collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.optional(v.id("jobs")),
    applicationId: v.optional(v.id("applications")),
    type: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    await ctx.db.insert("activities", {
      ...args,
      createdAt: now,
    });
  },
});
