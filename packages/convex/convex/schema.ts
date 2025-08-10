import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
    isAdmin: v.optional(v.boolean()), // Add admin field
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  jobs: defineTable({
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    salary: v.optional(v.string()),
    isSponsored: v.boolean(),
    isRecruitmentAgency: v.optional(v.boolean()),
    source: v.string(), // "extension", "manual", "import"
    dateFound: v.number(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_sponsored", ["isSponsored"])
    .index("by_recruitment_agency", ["isRecruitmentAgency"])
    .index("by_date", ["dateFound"]),

  applications: defineTable({
    jobId: v.id("jobs"),
    userId: v.id("users"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn"),
    ),
    appliedDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    interviewDates: v.optional(v.array(v.number())),
    followUpDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"]),

  jobAlerts: defineTable({
    userId: v.id("users"),
    keywords: v.array(v.string()),
    location: v.optional(v.string()),
    company: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),

  sponsoredCompanies: defineTable({
    name: v.string(), // Company name (e.g., "Google", "Microsoft")
    aliases: v.array(v.string()), // Alternative names (e.g., ["Alphabet Inc", "Google LLC"])
    sponsorshipType: v.string(), // "promoted", "featured", "sponsored", "premium"
    description: v.optional(v.string()), // Why this company is marked as sponsored
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"), // Admin who added this
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"])
    .index("by_sponsorship_type", ["sponsorshipType"]),

  sponsorshipRules: defineTable({
    name: v.string(),
    description: v.string(),
    jobSite: v.string(),
    selectors: v.array(v.string()), // CSS selectors to identify sponsored jobs
    keywords: v.array(v.string()), // Keywords that indicate sponsorship
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job_site", ["jobSite"])
    .index("by_active", ["isActive"]),

  rateLimits: defineTable({
    identifier: v.string(), // User ID, IP address, or session identifier
    endpoint: v.string(), // Function name being rate limited
    requestCount: v.number(),
    windowStart: v.number(), // Timestamp of rate limit window start
    lastRequest: v.number(), // Timestamp of last request
  })
    .index("by_identifier", ["identifier"])
    .index("by_endpoint", ["endpoint"])
    .index("by_identifier_endpoint", ["identifier", "endpoint"])
    .index("by_last_request", ["lastRequest"]),

  cvAnalyses: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    cvText: v.string(), // Extracted text from CV
    analysisStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    overallScore: v.optional(v.number()), // 0-100 score
    strengths: v.optional(v.array(v.string())),
    weaknesses: v.optional(v.array(v.string())),
    missingSkills: v.optional(v.array(v.string())),
    recommendations: v.optional(v.array(v.string())),
    industryAlignment: v.optional(
      v.object({
        score: v.number(),
        feedback: v.string(),
      }),
    ),
    atsCompatibility: v.optional(
      v.object({
        score: v.number(),
        issues: v.array(v.string()),
        suggestions: v.array(v.string()),
      }),
    ),
    keywordAnalysis: v.optional(
      v.object({
        presentKeywords: v.array(v.string()),
        missingKeywords: v.array(v.string()),
        keywordDensity: v.number(),
      }),
    ),
    sectionAnalysis: v.optional(
      v.object({
        hasSummary: v.boolean(),
        hasExperience: v.boolean(),
        hasEducation: v.boolean(),
        hasSkills: v.boolean(),
        hasContact: v.boolean(),
        missingsections: v.array(v.string()),
      }),
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["analysisStatus"])
    .index("by_created_at", ["createdAt"]),

  cvAnalysisTemplates: defineTable({
    name: v.string(),
    industry: v.string(),
    jobLevel: v.union(
      v.literal("entry"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("executive"),
    ),
    requiredSections: v.array(v.string()),
    recommendedKeywords: v.array(v.string()),
    commonSkills: v.array(v.string()),
    industrySpecificTips: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_industry", ["industry"])
    .index("by_job_level", ["jobLevel"])
    .index("by_active", ["isActive"]),

  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
