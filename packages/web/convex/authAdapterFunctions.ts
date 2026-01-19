import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: { table: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.insert(args.table as any, args.data);
  },
});

export const update = internalMutation({
  args: { id: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as any, args.data);
    return await ctx.db.get(args.id as any);
  },
});

export const del = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as any);
  },
});

export const findOne = internalQuery({
  args: { table: v.string(), where: v.any() }, // where is array of { field, value }
  handler: async (ctx, args) => {
    const table = args.table as any;
    const clauses = args.where as any[];
    
    if (clauses.length === 0) return null;
    
    const first = clauses[0];
    let query = ctx.db.query(table);
    
    // Optimization for specific indexes
    if (first.field === "email" && table === "users") {
        query = query.withIndex("by_email", (q) => q.eq("email", first.value));
    } else if (first.field === "token" && table === "sessions") {
        query = query.withIndex("token", (q) => q.eq("token", first.value));
    } else if (first.field === "identifier" && table === "verifications") {
        query = query.withIndex("identifier", (q) => q.eq("identifier", first.value));
    } else if (first.field === "accountId" && table === "accounts") {
        query = query.withIndex("accountId", (q) => q.eq("accountId", first.value));
    } else {
        query = query.filter((q) => q.eq(q.field(first.field), first.value));
    }
    
    for (const clause of clauses.slice(1)) {
        query = query.filter((q) => q.eq(q.field(clause.field), clause.value));
    }
    
    const doc = await query.first();
    return doc;
  },
});

export const findMany = internalQuery({
  args: { table: v.string(), where: v.any() },
  handler: async (ctx, args) => {
    const table = args.table as any;
    const clauses = args.where as any[];
    
    let query = ctx.db.query(table);
    for (const clause of clauses) {
        if (clause.value !== undefined) {
             query = query.filter((q) => q.eq(q.field(clause.field), clause.value));
        }
    }
    
    return await query.collect();
  },
});
