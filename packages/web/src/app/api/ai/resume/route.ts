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
import { UsageService } from "@/lib/api/usage";
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
  // Check monthly limit
  await UsageService.checkFeatureLimit(user!.uid, 'aiGenerationsPerMonth');

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
  const db = getAdminDb();
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
    generateExperienceSection(request.experience, request.level, request.industry);
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
  const experience = generateExperienceSection(request.experience, request.level, request.industry);
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
    entry: ["Motivated and fast-learning", "Dedicated and detail-oriented", "Ambitious and proactive"],
    mid: ["Dynamic and results-driven", "Skilled and collaborative", "Strategic-thinking and efficient"],
    senior: ["Seasoned and strategic", "Accomplished leadership-focused", "Expert and innovation-driven"],
    executive: ["Visionary and transformational", "High-impact and results-oriented", "Accomplished C-suite"]
  };

  const industryMap: Record<string, string[]> = {
    technology: [
      "software development and lifecycle management", 
      "implementing scalable technical solutions", 
      "leveraging agile methodologies to drive efficiency"
    ],
    healthcare: [
      "delivering high-quality patient care", 
      "navigating complex medical protocols and compliance", 
      "optimizing healthcare delivery systems"
    ],
    finance: [
      "advanced financial modeling and risk assessment", 
      "driving profitability through strategic investment", 
      "comprehensive budget management and reporting"
    ],
    marketing: [
      "executing multi-channel brand strategies", 
      "leveraging data analytics for campaign optimization", 
      "driving engagement through creative storytelling"
    ],
    education: [
      "fostering inclusive learning environments",
      "developing innovative curriculum standards",
      "leveraging educational technology for student success"
    ]
  };

  const levelWords = levelMap[level] || levelMap.mid;
  const industryWords = industryMap[industry.toLowerCase()] || industryMap.technology;

  const prefix = levelWords[Math.floor(Math.random() * levelWords.length)];
  const focus = industryWords[Math.floor(Math.random() * industryWords.length)];

  return `PROFESSIONAL SUMMARY
${prefix} professional with a strong track record in ${focus}. Proven ability to align ${industry} strategies with organizational goals to deliver measurable results. Seeking to leverage expertise in a ${jobTitle} role to drive innovation and team success.`;
}

function generateExperienceSection(experience: string, level: string, industry: string): string {
  const industryAchievements: Record<string, string[]> = {
    technology: [
      "Streamlined deployment pipelines, reducing release time by 25%.",
      "Architected and implemented a robust microservices architecture.",
      "Collaborated with cross-functional teams to deliver high-priority features ahead of schedule.",
      "Optimized system performance, resulting in a 30% reduction in latency."
    ],
    healthcare: [
      "Improved patient satisfaction scores by 15% through protocol optimization.",
      "Ensured 100% compliance with HIPAA and other regulatory standards.",
      "Coordinated between medical departments to streamline patient flow.",
      "Implemented a new electronic health record system with minimal downtime."
    ],
    finance: [
      "Reduced operational costs by 20% through strategic vendor negotiations.",
      "Managed a $2M annual budget with strict adherence to fiscal targets.",
      "Developed advanced risk models that identified potential savings of $500k.",
      "Automated monthly reporting processes, saving 15 hours per week."
    ],
    marketing: [
      "Increased organic web traffic by 40% through targeted SEO initiatives.",
      "Led a successful product launch campaign that exceeded sales targets by 20%.",
      "Optimized ad spend ROI by 25% using deep data analytics.",
      "Managed community engagement across social platforms, increasing followers by 10k."
    ]
  };

  const genericAchievements = [
    "Successfully managed multiple complex projects from inception to completion.",
    "Improved team productivity by implementing new workflow standards.",
    "Consistently exceeded performance targets and received multiple commendations.",
    "Mentored junior team members and fostered a culture of continuous learning."
  ];

  const industrySpecific = industryAchievements[industry.toLowerCase()] || [];
  const allAchievements = [...industrySpecific, ...genericAchievements];
  
  // Select 3 random unique achievements
  const selected = [];
  const pool = [...allAchievements];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  const actionVerbs = level === 'senior' || level === 'executive' 
    ? ["Directed", "Orchestrated", "Spearheaded", "Transformed", "Pioneered"]
    : ["Implemented", "Executed", "Optimized", "Facilitated", "Produced"];

  const primaryAction = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];

  return `PROFESSIONAL EXPERIENCE
${primaryAction} high-impact initiatives and collaborated with key stakeholders to deliver consistent value.

${selected.map(item => `- ${item}`).join('\n')}

---
FORMER ROLES & INPUT DATA:
${experience}`;
}

function generateSkillsSection(skills: string[], industry: string, level: string): string {
  const industrySkills: Record<string, string[]> = {
    technology: ["JavaScript/TypeScript", "React/Next.js", "Node.js", "Python", "AWS/Cloud", "Docker/K8s", "Git", "SQL/NoSQL", "Agile/Scrum"],
    healthcare: ["Patient Care", "Medical Terminology", "HIPAA Compliance", "Electronic Health Records", "Clinical Research", "Emergency Care"],
    finance: ["Financial Analysis", "Modeling", "Reporting", "QuickBooks/ERP", "Risk Assessment", "Compliance", "Tax Strategy"],
    marketing: ["SEO/SEM", "Content Strategy", "Digital Ads", "Google Analytics", "Social Media", "CRM", "Brand Management"],
  };

  const defaultSkills = industrySkills[industry.toLowerCase()] || industrySkills.technology;
  const combined = Array.from(new Set([...skills, ...defaultSkills]));
  
  const technical = combined.slice(0, 10);
  const core = [
    "Problem Solving", 
    "Strategic Planning", 
    "Team Leadership", 
    "Effective Communication", 
    "Adaptability", 
    "Project Management"
  ];

  return `TECHNICAL & CORE COMPETENCIES
${technical.join(" | ")}

PROFESSIONAL SKILLS
${core.join(" • ")}`;
}

function generateEducationSection(education: string): string {
  return `EDUCATION & CERTIFICATIONS
${education || "- Bachelor's Degree in relevant field (Honors Candidate)"}
- Professional Development: Continuous learning in industry-standard tools and methodologies
- Certifications: Relevant professional licenses and certifications obtained`;
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
