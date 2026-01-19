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

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("resumeVersions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("resumeVersions") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.id);
    if (resume && resume.userId !== userId) {
      throw new Error("Unauthorized");
    }
    return resume;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    fileName: v.string(),
    fileUrl: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileSize: v.number(),
    contentType: v.string(),
    parsedContent: v.optional(v.string()),
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
    const resumeId = await ctx.db.insert("resumeVersions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return resumeId;
  },
});

export const updateParsedContent = mutation({
  args: {
    id: v.id("resumeVersions"),
    parsedContent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.id);
    if (!resume || resume.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      parsedContent: args.parsedContent,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("resumeVersions") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.id);
    if (!resume || resume.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
