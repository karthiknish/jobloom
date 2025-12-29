/**
 * AI Resume Generation API - Refactored with unified API wrapper
 * 
 * This demonstrates the new standardized pattern for complex AI routes.
 * Benefits:
 * - Automatic CORS handling
 * - Consistent error responses  
 * - Built-in authentication and rate limiting
 * - Zod validation for request body
 * - Standardized success response format
 */

import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import {
  generateResumeWithAI,
  type ResumeGenerationRequest,
  type ResumeGenerationResult,
} from "@/services/ai/geminiService";
import { scoreResume } from "@/services/ats";

// Export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const resumeRequestSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(200),
  experience: z.string().min(1, "Experience is required").max(10000),
  skills: z.union([
    z.array(z.string()),
    z.string().transform(s => s.split(',').map(skill => skill.trim()).filter(Boolean))
  ]).optional().default([]),
  education: z.string().max(5000).optional().default(''),
  industry: z.string().max(100).optional().default('technology'),
  level: z.enum(['entry', 'mid', 'senior', 'executive']).optional().default('mid'),
  style: z.enum(['modern', 'traditional', 'creative', 'technical']).optional().default('modern'),
  includeObjective: z.boolean().optional().default(true),
  atsOptimization: z.boolean().optional().default(true),
  aiEnhancement: z.boolean().optional().default(true),
});

type ResumeRequestBody = z.infer<typeof resumeRequestSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface ResumeApiResponse {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  atsScore: number;
  keywords: string[];
  suggestions: string[];
  wordCount: number;
  generatedAt: string;
  breakdown?: any;
  detailedMetrics?: any;
  source?: "gemini" | "fallback" | "mock";
}

// ============================================================================
// API HANDLER
// ============================================================================

export const POST = withApi({
  auth: 'required',
  rateLimit: 'ai-resume',
  bodySchema: resumeRequestSchema,
}, async ({ user, body, requestId }) => {
  // Check subscription tier
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(user!.uid).get();
  const userData = userDoc.data();

  const isAdmin = userData?.isAdmin === true;
  const isPremium = userData?.subscription?.tier === 'premium' || 
                    userData?.subscription?.status === 'active';

  if (!userData || (!isPremium && !isAdmin)) {
    throw new AuthorizationError(
      "Premium subscription required for AI resume generation",
      ERROR_CODES.PAYMENT_REQUIRED
    );
  }

  // Normalize the request
  const resumeRequest: ResumeGenerationRequest = {
    jobTitle: body.jobTitle,
    experience: body.experience,
    skills: Array.isArray(body.skills) ? body.skills : [],
    education: body.education || '',
    industry: body.industry,
    level: body.level,
    style: body.style,
    includeObjective: body.includeObjective,
    atsOptimization: body.atsOptimization,
    aiEnhancement: body.aiEnhancement,
  };

  // Generate resume
  let aiResult: ResumeGenerationResult;
  let source: ResumeApiResponse["source"] = "gemini";

  try {
    aiResult = await generateResumeWithAI(resumeRequest);
  } catch (error) {
    console.error("Gemini resume generation failed, using fallback:", error);
    aiResult = generateFallbackResume(resumeRequest);
    source = "fallback";
  }

  // Build response
  const responsePayload = buildResumeResponse(aiResult, resumeRequest, source);

  // Save to user's collection
  await db
    .collection("users")
    .doc(user!.uid)
    .collection("aiResumes")
    .add({
      ...responsePayload,
      source,
      jobTitle: resumeRequest.jobTitle,
      industry: resumeRequest.industry,
      style: resumeRequest.style,
      skills: resumeRequest.skills,
      atsOptimization: resumeRequest.atsOptimization,
      aiEnhancement: resumeRequest.aiEnhancement,
      includeObjective: resumeRequest.includeObjective,
      createdAt: new Date().toISOString(),
    });

  return responsePayload;
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildResumeResponse(
  result: ResumeGenerationResult,
  request: ResumeGenerationRequest,
  source?: ResumeApiResponse["source"],
): ResumeApiResponse {
  const sanitize = (value: string | undefined): string =>
    value ? value.replace(/\r\n/g, "\n").trim() : "";

  const summary = sanitize(result.summary) ||
    generateProfessionalSummary(request.jobTitle, request.experience, request.level, request.industry);
  const experience = sanitize(result.experience) ||
    generateExperienceSection(request.experience, request.level);
  const skills = sanitize(result.skills) ||
    generateSkillsSection(request.skills, request.industry, request.level);
  const education = sanitize(result.education) ||
    generateEducationSection(request.education);

  const content = sanitize(result.content) ||
    generateResumeContent({
      summary,
      experience,
      skills,
      education,
      includeObjective: request.includeObjective,
      style: request.style,
    });

  const normalizedContent = content.replace(/\n{3,}/g, "\n\n");
  
  // Use the new unified ATS scoring service
  const atsEvaluation = scoreResume(normalizedContent, {
    targetRole: request.jobTitle,
    industry: request.industry,
    skills: request.skills
  });

  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const generatedAt = new Date().toISOString();

  const response: ResumeApiResponse = {
    content: normalizedContent,
    sections: { summary, experience, skills, education },
    atsScore: atsEvaluation.score,
    keywords: atsEvaluation.matchedKeywords,
    suggestions: atsEvaluation.recommendations.high.map(imp => typeof imp === 'string' ? imp : imp.text),
    breakdown: atsEvaluation.breakdown,
    detailedMetrics: atsEvaluation.detailedMetrics,
    wordCount,
    generatedAt,
  };

  if (source) {
    response.source = source;
  }

  return response;
}

function generateFallbackResume(request: ResumeGenerationRequest): ResumeGenerationResult {
  const summary = generateProfessionalSummary(request.jobTitle, request.experience, request.level, request.industry);
  const experience = generateExperienceSection(request.experience, request.level);
  const skills = generateSkillsSection(request.skills, request.industry, request.level);
  const education = generateEducationSection(request.education);
  const content = generateResumeContent({
    summary, experience, skills, education,
    includeObjective: request.includeObjective,
    style: request.style,
  });

  return { summary, experience, skills, education, content };
}

function generateProfessionalSummary(
  jobTitle: string, 
  experience: string, 
  level: string, 
  industry: string
): string {
  const levelMap: Record<string, string[]> = {
    entry: ["motivated", "detail-oriented", "eager to learn"],
    mid: ["skilled", "results-driven", "collaborative"],
    senior: ["experienced", "strategic", "leadership"],
    executive: ["visionary", "accomplished", "transformational"]
  };

  const industryMap: Record<string, string[]> = {
    technology: ["software development", "system architecture", "technical solutions"],
    healthcare: ["patient care", "medical protocols", "healthcare delivery"],
    finance: ["financial analysis", "risk management", "investment strategies"],
    marketing: ["brand development", "campaign management", "market research"],
  };

  const levelWords = levelMap[level] || levelMap.mid;
  const industryWords = industryMap[industry] || industryMap.technology;

  return `PROFESSIONAL SUMMARY
${levelWords[Math.floor(Math.random() * levelWords.length)]} professional with expertise in ${industryWords[Math.floor(Math.random() * industryWords.length)]}. 
Seeking ${jobTitle} position where I can leverage my skills and experience to drive organizational success.`;
}

function generateExperienceSection(experience: string, level: string): string {
  const actionVerbs = level === 'senior' || level === 'executive' 
    ? ["Led", "Directed", "Managed", "Oversaw", "Transformed"]
    : ["Developed", "Implemented", "Contributed", "Assisted", "Executed"];

  const randomAction = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];

  return `PROFESSIONAL EXPERIENCE
${randomAction} key initiatives that resulted in measurable improvements.

- Collaborated with cross-functional teams to deliver projects on time and within budget
- Developed and implemented innovative solutions to complex business challenges

${experience}`;
}

function generateSkillsSection(skills: string[], industry: string, level: string): string {
  const industrySkills: Record<string, string[]> = {
    technology: ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "Git", "SQL"],
    healthcare: ["Patient Care", "Medical Terminology", "HIPAA Compliance", "Electronic Health Records"],
    finance: ["Financial Analysis", "Excel", "QuickBooks", "Risk Assessment", "Budget Management"],
    marketing: ["Digital Marketing", "SEO/SEM", "Content Strategy", "Analytics", "Social Media"],
  };

  const defaultSkills = industrySkills[industry] || industrySkills.technology;
  const allSkills = Array.from(new Set([...skills, ...defaultSkills]));

  return `TECHNICAL SKILLS
${allSkills.join(" | ")}

SOFT SKILLS
- Communication and Presentation
- Problem Solving and Critical Thinking
- Team Collaboration and Leadership`;
}

function generateEducationSection(education: string): string {
  return `EDUCATION
${education || "- Bachelor's Degree in relevant field"}
- Additional certifications and professional development`;
}

function generateResumeContent(sections: {
  summary: string;
  experience: string;
  skills: string;
  education: string;
  includeObjective: boolean;
  style: string;
}): string {
  let content = "";

  if (sections.includeObjective) {
    content += `OBJECTIVE
To obtain a challenging position where I can utilize my skills and experience to contribute to company growth.\n\n`;
  }

  content += sections.summary + "\n\n";
  content += sections.experience + "\n\n";
  content += sections.skills + "\n\n";
  content += sections.education;

  return content;
}

// End of resume API route helper functions
