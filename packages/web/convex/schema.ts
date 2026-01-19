import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    firebaseUid: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_firebaseUid", ["firebaseUid"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"]),

  accounts: defineTable({
    userId: v.id("users"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    idToken: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("providerId", ["providerId"])
    .index("userId", ["userId"]),

  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("identifier", ["identifier"]),

  jobs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    source: v.string(),
    salary: v.optional(v.string()),
    salaryRange: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        currency: v.optional(v.string()),
        period: v.optional(v.string()),
      })
    ),
    jobId: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    requirements: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    qualifications: v.optional(v.array(v.string())),
    jobType: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    remoteWork: v.optional(v.boolean()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    postedDate: v.optional(v.string()),
    applicationDeadline: v.optional(v.string()),
    isSponsored: v.boolean(),
    isRecruitmentAgency: v.optional(v.boolean()),
    sponsorshipType: v.optional(v.string()),
    dateFound: v.number(),
    likelySocCode: v.optional(v.string()),
    socCode: v.optional(v.string()),
    socMatchConfidence: v.optional(v.number()),
    socMatch: v.optional(
      v.object({
        code: v.string(),
        title: v.string(),
        confidence: v.number(),
        matchedKeywords: v.array(v.string()),
        relatedTitles: v.array(v.string()),
        eligibility: v.string(),
      })
    ),
    department: v.optional(v.string()),
    seniority: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    locationType: v.optional(v.string()),
    extractedKeywords: v.optional(v.array(v.string())),
    normalizedTitle: v.optional(v.string()),
    normalizedUrl: v.optional(v.string()),
    jobIdentifier: v.string(),
    visaSponsorship: v.optional(
      v.object({
        mentioned: v.boolean(),
        available: v.boolean(),
        type: v.optional(v.string()),
        requirements: v.optional(v.array(v.string())),
      })
    ),
    status: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("applied"),
        v.literal("interviewing"),
        v.literal("offered"),
        v.literal("rejected"),
        v.literal("withdrawn")
      )
    ),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    applicantCount: v.optional(v.number()),
    easyApply: v.optional(v.boolean()),
    companyLogo: v.optional(v.string()),
    extractionMethod: v.optional(v.string()),
    unsupportedSite: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_jobIdentifier", ["jobIdentifier"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  applications: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("interested"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    appliedAt: v.optional(v.number()),
    interviewedAt: v.optional(v.array(v.number())),
    offeredAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    withdrawnAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    resumeVersionId: v.optional(v.id("resumeVersions")),
    coverLetter: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_jobId", ["jobId"]),

  resumeVersions: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    parsedContent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  quickNotes: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    note: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_jobId", ["jobId"]),

  activities: defineTable({
    userId: v.id("users"),
    jobId: v.optional(v.id("jobs")),
    applicationId: v.optional(v.id("applications")),
    type: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  sponsorships: defineTable({
    domain: v.string(),
    companyName: v.string(),
    isSponsored: v.boolean(),
    evidence: v.optional(v.array(v.string())),
    sponsorshipType: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastChecked: v.number(),
    lastUpdated: v.number(),
    createdAt: v.optional(v.number()),
    city: v.optional(v.string()),
    county: v.optional(v.string()),
    route: v.optional(v.string()),
    typeRating: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    searchCity: v.optional(v.string()),
    searchCounty: v.optional(v.string()),
    searchName: v.optional(v.string()),
  })
    .index("by_domain", ["domain"])
    .index("by_lastChecked", ["lastChecked"])
    .index("by_city", ["city"])
    .index("by_county", ["county"]),
});
