import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const createCvAnalysis = mutation({
  args: {
    userId: v.id("users"),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    cvText: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("cvAnalyses", {
      userId: args.userId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      cvText: args.cvText,
      analysisStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCvAnalysisStatus = mutation({
  args: {
    analysisId: v.id("cvAnalyses"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.analysisId, {
      analysisStatus: args.status as any,
      updatedAt: Date.now(),
    });
  },
});

export const updateCvAnalysisResults = mutation({
  args: {
    analysisId: v.id("cvAnalyses"),
    overallScore: v.number(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    missingSkills: v.array(v.string()),
    recommendations: v.array(v.string()),
    industryAlignment: v.object({
      score: v.number(),
      feedback: v.string(),
    }),
    atsCompatibility: v.object({
      score: v.number(),
      issues: v.array(v.string()),
      suggestions: v.array(v.string()),
    }),
    keywordAnalysis: v.object({
      presentKeywords: v.array(v.string()),
      missingKeywords: v.array(v.string()),
      keywordDensity: v.number(),
    }),
    sectionAnalysis: v.object({
      hasSummary: v.boolean(),
      hasExperience: v.boolean(),
      hasEducation: v.boolean(),
      hasSkills: v.boolean(),
      hasContact: v.boolean(),
      missingsections: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { analysisId, ...results } = args;

    return await ctx.db.patch(analysisId, {
      ...results,
      analysisStatus: "completed",
      updatedAt: Date.now(),
    });
  },
});

export const updateCvAnalysisError = mutation({
  args: {
    analysisId: v.id("cvAnalyses"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.analysisId, {
      analysisStatus: "failed",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const getUserCvAnalyses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cvAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getCvAnalysisById = query({
  args: { analysisId: v.id("cvAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.analysisId);
  },
});

export const deleteCvAnalysis = mutation({
  args: { analysisId: v.id("cvAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.analysisId);
  },
});

export const getCvAnalysisStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("cvAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalAnalyses = analyses.length;
    const completedAnalyses = analyses.filter(
      (a) => a.analysisStatus === "completed",
    ).length;
    const averageScore =
      completedAnalyses > 0
        ? analyses
            .filter((a) => a.analysisStatus === "completed" && a.overallScore)
            .reduce((sum, a) => sum + (a.overallScore || 0), 0) /
          completedAnalyses
        : 0;

    const recentAnalysis = analyses.find(
      (a) => a.analysisStatus === "completed",
    );

    return {
      totalAnalyses,
      completedAnalyses,
      averageScore: Math.round(averageScore),
      recentAnalysis,
    };
  },
});

// CV Analysis Templates
export const createCvAnalysisTemplate = mutation({
  args: {
    name: v.string(),
    industry: v.string(),
    jobLevel: v.string(),
    requiredSections: v.array(v.string()),
    recommendedKeywords: v.array(v.string()),
    commonSkills: v.array(v.string()),
    industrySpecificTips: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cvAnalysisTemplates", {
      ...args,
      jobLevel: args.jobLevel as any,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const getCvAnalysisTemplates = query({
  args: {
    industry: v.optional(v.string()),
    jobLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("cvAnalysisTemplates");

    if (args.industry) {
      query = query.withIndex("by_industry", (q) =>
        q.eq("industry", args.industry),
      );
    }

    const templates = await query.collect();

    if (args.jobLevel) {
      return templates.filter(
        (t) => t.jobLevel === args.jobLevel && t.isActive,
      );
    }

    return templates.filter((t) => t.isActive);
  },
});

export const initializeCvAnalysisTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = [
      {
        name: "Software Engineer",
        industry: "Technology",
        jobLevel: "mid" as const,
        requiredSections: [
          "Contact",
          "Summary",
          "Experience",
          "Skills",
          "Education",
        ],
        recommendedKeywords: [
          "JavaScript",
          "Python",
          "React",
          "Node.js",
          "Git",
          "Agile",
          "API",
          "Database",
        ],
        commonSkills: [
          "Programming",
          "Problem Solving",
          "Team Collaboration",
          "Version Control",
        ],
        industrySpecificTips: [
          "Include links to GitHub and portfolio projects",
          "Quantify your impact with metrics (performance improvements, user growth)",
          "Highlight specific technologies and frameworks you've used",
          "Mention any open source contributions",
        ],
      },
      {
        name: "Marketing Manager",
        industry: "Marketing",
        jobLevel: "mid" as const,
        requiredSections: [
          "Contact",
          "Summary",
          "Experience",
          "Skills",
          "Education",
        ],
        recommendedKeywords: [
          "Digital Marketing",
          "SEO",
          "SEM",
          "Analytics",
          "Campaign Management",
          "Social Media",
          "Content Strategy",
        ],
        commonSkills: [
          "Strategic Planning",
          "Data Analysis",
          "Communication",
          "Project Management",
        ],
        industrySpecificTips: [
          "Include specific campaign results and ROI metrics",
          "Highlight experience with marketing tools (Google Analytics, HubSpot, etc.)",
          "Show progression in budget management and team leadership",
          "Mention certifications in Google Ads, Facebook Blueprint, etc.",
        ],
      },
      {
        name: "Data Scientist",
        industry: "Technology",
        jobLevel: "senior" as const,
        requiredSections: [
          "Contact",
          "Summary",
          "Experience",
          "Skills",
          "Education",
          "Publications",
        ],
        recommendedKeywords: [
          "Machine Learning",
          "Python",
          "R",
          "SQL",
          "Statistics",
          "Deep Learning",
          "TensorFlow",
          "Pandas",
        ],
        commonSkills: [
          "Statistical Analysis",
          "Data Visualization",
          "Research",
          "Communication",
        ],
        industrySpecificTips: [
          "Include links to published research or Kaggle competitions",
          "Quantify model performance improvements and business impact",
          "Highlight experience with big data technologies",
          "Mention specific ML frameworks and cloud platforms",
        ],
      },
    ];

    for (const template of templates) {
      await ctx.db.insert("cvAnalysisTemplates", {
        ...template,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    return { success: true, templatesCreated: templates.length };
  },
});
