import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const create = mutation({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    contentId: v.string(),
    sentiment: v.string(),
    context: v.optional(v.string()),
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
    await ctx.db.insert("ai_feedback", {
      ...args,
      createdAt: now,
    });
  },
});
