import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const create = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("quickNotes", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getByJobId = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quickNotes")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("quickNotes"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.id, {
      note: args.note,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("quickNotes") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.id);
  },
});
