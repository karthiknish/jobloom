import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to check if user is admin
export const isUserAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.isAdmin === true;
  },
});

// Mutation to set user as admin (protected by existing admin check)
export const setAdminUser = mutation({
  args: { 
    userId: v.id("users"),
    requesterId: v.id("users") // ID of user making the request
  },
  handler: async (ctx, args) => {
    // First check if requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || !requester.isAdmin) {
      throw new Error("Unauthorized: Only admins can set other users as admin");
    }
    
    // Set user as admin
    await ctx.db.patch(args.userId, { isAdmin: true });
  },
});

// Mutation to remove admin privileges (protected by existing admin check)
export const removeAdminUser = mutation({
  args: { 
    userId: v.id("users"),
    requesterId: v.id("users") // ID of user making the request
  },
  handler: async (ctx, args) => {
    // First check if requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || !requester.isAdmin) {
      throw new Error("Unauthorized: Only admins can remove admin privileges");
    }
    
    // Remove admin privileges
    await ctx.db.patch(args.userId, { isAdmin: false });
  },
});