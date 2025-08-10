import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit, RateLimitError } from "./rateLimiting";

// Helper function to get client identifier
function getClientIdentifier(ctx: any): string {
  // Try to get user ID first, fallback to IP or session
  const userId = ctx.auth?.getUserIdentity()?.subject;
  if (userId) return `user:${userId}`;
  
  // Fallback to IP address or generate session ID
  const clientIP = ctx.request?.headers?.['x-forwarded-for'] || 
                   ctx.request?.headers?.['x-real-ip'] || 
                   'unknown';
  return `ip:${clientIP}`;
}

export const checkCompanySponsorship = query({
  args: { 
    companies: v.array(v.string()),
    clientId: v.optional(v.string()) // Optional client identifier for rate limiting
  },
  handler: async (ctx, args) => {
    // Rate limiting
    const identifier = args.clientId || getClientIdentifier(ctx);
    const rateLimitResult = await checkRateLimit(ctx, "checkCompanySponsorship", identifier);
    
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        "checkCompanySponsorship"
      );
    }

    // Limit the number of companies that can be checked in one request
    const maxCompaniesPerRequest = 50;
    if (args.companies.length > maxCompaniesPerRequest) {
      throw new Error(`Too many companies in request. Maximum ${maxCompaniesPerRequest} allowed.`);
    }
    const results = await Promise.all(
      args.companies.map(async (companyName) => {
        // Normalize company name for matching
        const normalizedCompany = companyName.toLowerCase().trim();
        
        // Check direct company name match
        const directMatch = await ctx.db
          .query("sponsoredCompanies")
          .withIndex("by_name", (q) => q.eq("name", companyName))
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();

        if (directMatch) {
          return {
            company: companyName,
            isSponsored: true,
            sponsorshipType: directMatch.sponsorshipType,
            source: "direct_match"
          };
        }

        // Check aliases for fuzzy matching
        const allCompanies = await ctx.db
          .query("sponsoredCompanies")
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        for (const sponsoredCompany of allCompanies) {
          // Check if company name contains any of the aliases
          const companyMatches = [
            sponsoredCompany.name.toLowerCase(),
            ...sponsoredCompany.aliases.map(alias => alias.toLowerCase())
          ];

          const isMatch = companyMatches.some(match => 
            normalizedCompany.includes(match) || match.includes(normalizedCompany)
          );

          if (isMatch) {
            return {
              company: companyName,
              isSponsored: true,
              sponsorshipType: sponsoredCompany.sponsorshipType,
              source: "alias_match",
              matchedName: sponsoredCompany.name
            };
          }
        }

        return {
          company: companyName,
          isSponsored: false,
          sponsorshipType: null,
          source: "no_match"
        };
      })
    );

    return results;
  },
});

export const getSponsorshipRulesByJobSite = query({
  args: { jobSite: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sponsorshipRules")
      .withIndex("by_job_site", (q) => q.eq("jobSite", args.jobSite))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addSponsoredCompany = mutation({
  args: {
    name: v.string(),
    aliases: v.array(v.string()),
    sponsorshipType: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    createdBy: v.id("users"),
    clientId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Rate limiting for admin operations
    const identifier = args.clientId || getClientIdentifier(ctx);
    const rateLimitResult = await checkRateLimit(ctx, "addSponsoredCompany", identifier);
    
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        "addSponsoredCompany"
      );
    }

    // Validate input
    if (!args.name.trim()) {
      throw new Error("Company name is required");
    }

    if (args.aliases.length > 10) {
      throw new Error("Maximum 10 aliases allowed per company");
    }
    const existingCompany = await ctx.db
      .query("sponsoredCompanies")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingCompany) {
      // Update existing company
      await ctx.db.patch(existingCompany._id, {
        aliases: args.aliases,
        sponsorshipType: args.sponsorshipType,
        description: args.description,
        website: args.website,
        industry: args.industry,
        isActive: true,
        updatedAt: Date.now(),
      });
      return existingCompany._id;
    }

    // Create new sponsored company entry
    const companyId = await ctx.db.insert("sponsoredCompanies", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return companyId;
  },
});

export const updateSponsoredCompany = mutation({
  args: {
    companyId: v.id("sponsoredCompanies"),
    name: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
    sponsorshipType: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { companyId, ...updates } = args;
    await ctx.db.patch(companyId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSponsoredCompany = mutation({
  args: { companyId: v.id("sponsoredCompanies") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.companyId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

export const updateSponsorshipRule = mutation({
  args: {
    ruleId: v.optional(v.id("sponsorshipRules")),
    name: v.string(),
    description: v.string(),
    jobSite: v.string(),
    selectors: v.array(v.string()),
    keywords: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { ruleId, ...ruleData } = args;

    if (ruleId) {
      // Update existing rule
      await ctx.db.patch(ruleId, {
        ...ruleData,
        updatedAt: Date.now(),
      });
      return ruleId;
    }

    // Create new rule
    const newRuleId = await ctx.db.insert("sponsorshipRules", {
      ...ruleData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return newRuleId;
  },
});

export const getAllSponsoredCompanies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sponsoredCompanies")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

export const getSponsorshipStats = query({
  args: {},
  handler: async (ctx) => {
    const sponsoredCompanies = await ctx.db
      .query("sponsoredCompanies")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const industryStats = sponsoredCompanies.reduce((acc, company) => {
      const industry = company.industry || "Unknown";
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sponsorshipTypeStats = sponsoredCompanies.reduce((acc, company) => {
      acc[company.sponsorshipType] = (acc[company.sponsorshipType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSponsoredCompanies: sponsoredCompanies.length,
      industryStats,
      sponsorshipTypeStats,
    };
  },
});

// Sponsorship rules functions
export const getAllSponsorshipRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sponsorshipRules").collect();
  },
});

export const addSponsorshipRule = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    jobSite: v.string(),
    selectors: v.array(v.string()),
    keywords: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ruleId = await ctx.db.insert("sponsorshipRules", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ruleId };
  },
});

export const updateSponsorshipRuleStatus = mutation({
  args: {
    ruleId: v.id("sponsorshipRules"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ruleId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});