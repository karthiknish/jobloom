import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Rate limiting configuration
const RATE_LIMITS = {
  // Extension API calls
  checkCompanySponsorship: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    description: "Company sponsorship checks"
  },
  
  // Admin operations
  addSponsoredCompany: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    description: "Add sponsored company"
  },
  
  // Job operations
  createJob: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    description: "Create job entries"
  },
  
  // Application operations
  createApplication: {
    maxRequests: 15,
    windowMs: 60000, // 1 minute
    description: "Create applications"
  },
  
  // General queries
  generalQuery: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    description: "General queries"
  }
};

// Rate limit tracking table schema (add to main schema)
export const rateLimitSchema = {
  rateLimits: {
    userId: v.optional(v.string()), // User ID or IP for anonymous
    identifier: v.string(), // IP address or user identifier
    endpoint: v.string(), // Function name
    requestCount: v.number(),
    windowStart: v.number(), // Timestamp of window start
    lastRequest: v.number(), // Timestamp of last request
  }
};

// Rate limiting utility function
export async function checkRateLimit(
  ctx: any,
  endpoint: string,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.generalQuery;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Find existing rate limit record
  const existingLimit = await ctx.db
    .query("rateLimits")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("identifier"), identifier),
        q.eq(q.field("endpoint"), endpoint)
      )
    )
    .first();

  if (!existingLimit) {
    // First request - create new record
    await ctx.db.insert("rateLimits", {
      identifier,
      endpoint,
      requestCount: 1,
      windowStart: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Check if we're in a new window
  if (existingLimit.windowStart < windowStart) {
    // Reset the window
    await ctx.db.patch(existingLimit._id, {
      requestCount: 1,
      windowStart: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Check if limit exceeded
  if (existingLimit.requestCount >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existingLimit.windowStart + config.windowMs
    };
  }

  // Increment counter
  await ctx.db.patch(existingLimit._id, {
    requestCount: existingLimit.requestCount + 1,
    lastRequest: now,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - existingLimit.requestCount - 1,
    resetTime: existingLimit.windowStart + config.windowMs
  };
}

// Rate limit error class
export class RateLimitError extends Error {
  constructor(
    public remaining: number,
    public resetTime: number,
    public endpoint: string
  ) {
    super(`Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds.`);
    this.name = "RateLimitError";
  }
}

// Cleanup old rate limit records
export const cleanupRateLimits = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const oldRecords = await ctx.db
      .query("rateLimits")
      .filter((q: any) => q.lt(q.field("lastRequest"), cutoff))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return { deleted: oldRecords.length };
  },
});

// Get rate limit status for a user
export const getRateLimitStatus = query({
  args: { 
    identifier: v.string(),
    endpoint: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("rateLimits")
      .filter((q: any) => q.eq(q.field("identifier"), args.identifier));

    const records = args.endpoint 
      ? await query.filter((q: any) => q.eq(q.field("endpoint"), args.endpoint)).collect()
      : await query.collect();

    return records.map(record => {
      const config = RATE_LIMITS[record.endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.generalQuery;
      const now = Date.now();
      const windowStart = now - config.windowMs;
      const isExpired = record.windowStart < windowStart;

      return {
        endpoint: record.endpoint,
        requestCount: isExpired ? 0 : record.requestCount,
        maxRequests: config.maxRequests,
        remaining: isExpired ? config.maxRequests : Math.max(0, config.maxRequests - record.requestCount),
        resetTime: isExpired ? now + config.windowMs : record.windowStart + config.windowMs,
        description: config.description
      };
    });
  },
});