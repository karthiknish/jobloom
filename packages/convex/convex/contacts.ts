import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("contacts", {
      ...args,
      createdAt: now,
    });
  },
}); 