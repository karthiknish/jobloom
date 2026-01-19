import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSponsorships = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let result = ctx.db.query("sponsorships").order("desc");
    
    if (args.limit) {
      return await result.take(args.limit);
    }
    
    return await result.collect();
  },
});

export const getSponsorshipByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sponsorships")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();
  },
});

export const createSponsorship = mutation({
  args: {
    domain: v.string(),
    companyName: v.string(),
    isSponsored: v.boolean(),
    evidence: v.optional(v.array(v.string())),
    sponsorshipType: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastChecked: v.number(),
    lastUpdated: v.number(),
    city: v.optional(v.string()),
    county: v.optional(v.string()),
    route: v.optional(v.string()),
    typeRating: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    searchCity: v.optional(v.string()),
    searchCounty: v.optional(v.string()),
    searchName: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sponsorships")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        companyName: args.companyName,
        isSponsored: args.isSponsored,
        evidence: args.evidence,
        sponsorshipType: args.sponsorshipType,
        notes: args.notes,
        lastChecked: args.lastChecked,
        lastUpdated: args.lastUpdated,
        city: args.city,
        county: args.county,
        route: args.route,
        typeRating: args.typeRating,
        isActive: args.isActive,
        searchCity: args.searchCity,
        searchCounty: args.searchCounty,
        searchName: args.searchName,
      });
      return existing._id;
    }

    return await ctx.db.insert("sponsorships", {
      ...args,
      createdAt: args.createdAt || Date.now(),
    });
  },
});

export const updateSponsorship = mutation({
  args: {
    id: v.id("sponsorships"),
    updates: v.object({
      isSponsored: v.optional(v.boolean()),
      sponsorshipType: v.optional(v.string()),
      evidence: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      lastChecked: v.optional(v.number()),
      lastUpdated: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.updates,
      lastUpdated: args.updates.lastUpdated ?? Date.now(),
    });
  },
});
