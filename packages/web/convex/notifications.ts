import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const list = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
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

    let notificationsQuery;
    
    if (args.unreadOnly) {
       notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_userId_read", (q) => 
          q.eq("userId", args.userId).eq("read", false)
        )
        .order("desc"); // Assuming we might want recently unread? But index is by_userId_read, not sorting by time. 
        // Wait, "by_userId_read" index is ["userId", "read"]. It doesn't include createdAt.
        // We probably need to sort in memory or use an index that includes createdAt if we want sorted results.
        // But schema has .index("by_userId_read", ["userId", "read"])
        // and .index("by_userId_createdAt", ["userId", "createdAt"])
        
        // If I use by_userId_read, I can't sort by createdAt efficiently if it's not in the index.
        // However, usually we want notifications sorted by time.
        // So maybe better to query by userId, order by desc createdAt, and filter by read status if needed.
        // Or filter in memory if unread count is small.
    } else {
        notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    // Let's refine the unreadOnly logic. 
    // If unreadOnly is true, we want unread ones.
    // If we use by_userId_createdAt, we can filter for read=false.
    
    if (args.unreadOnly) {
        // If we use the specific index, we lose sorting by time unless we do it in memory.
        // Given we probably want the latest unread notifications.
        // I'll stick to by_userId_createdAt and filter.
        notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .order("desc")
        .filter((q) => q.eq(q.field("read"), false));
    } else {
         notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    if (args.limit) {
      return await notificationsQuery.take(args.limit);
    }

    return await notificationsQuery.collect();
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    
    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
      
    return notifications.length;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // This might be internal, but if exposed, check auth?
    // Usually notifications are created by system or triggered by events.
    // If called from client, we should probably verify the user is sending to themselves or is admin.
    // For now, I'll allow users to create notifications for themselves (e.g. reminders) or check auth.
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
       throw new Error("Not authenticated");
    }
    
    // Allow sending to self only for now from client
    if (userId !== args.userId) {
        // In a real app, maybe admin can send to anyone. 
        // For now, restrict to self.
        throw new Error("Unauthorized");
    }

    const now = Date.now();
    await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: now,
    });
  },
});

export const markAsRead = mutation({
  args: { 
    id: v.id("notifications"),
    userId: v.id("users") // Pass userId to verify ownership
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      read: true,
    });
  },
});

export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }
  },
});

export const remove = mutation({
  args: { 
    id: v.id("notifications"),
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
