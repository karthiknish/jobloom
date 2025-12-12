import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import {
  generateResumeWithAI,
  type ResumeGenerationRequest,
  type ResumeGenerationResult,
} from "@/services/ai/geminiService";

const MOCK_SIGNATURE = "bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc";

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
  source?: "gemini" | "fallback" | "mock";
}

type ResumeRequestPayload = Partial<
  Omit<ResumeGenerationRequest, "skills">
> & {
  skills?: string[] | string;
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const isMockToken =
      process.env.NODE_ENV === "development" && authHeader.includes(MOCK_SIGNATURE);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const resumeRequest = normalizeResumeRequest(payload as ResumeRequestPayload);

    if (!resumeRequest.jobTitle || !resumeRequest.experience) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle, experience" },
        { status: 400 }
      );
    }

    if (isMockToken) {
      const mockResponse = buildResumeResponse(
        generateFallbackResume(resumeRequest),
        resumeRequest,
        "mock"
      );
      return NextResponse.json(mockResponse);
    }

    const decodedToken = await verifyIdToken(token);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const isAdmin = userData?.isAdmin === true;

    if (!userData || (userData.subscription?.tier === "free" && !isAdmin)) {
      return NextResponse.json(
        { error: "Premium subscription required for AI resume generation" },
        { status: 403 }
      );
    }

    let aiResult: ResumeGenerationResult;
    let source: ResumeApiResponse["source"] = "gemini";

    try {
      aiResult = await generateResumeWithAI(resumeRequest);
    } catch (error) {
      console.error("Gemini resume generation failed, using fallback:", error);
      aiResult = generateFallbackResume(resumeRequest);
      source = "fallback";
    }

    const responsePayload = buildResumeResponse(aiResult, resumeRequest, source);

    await db
      .collection("users")
      .doc(decodedToken.uid)
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

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}

function normalizeResumeRequest(payload: ResumeRequestPayload): ResumeGenerationRequest {
  const toText = (value: unknown): string => {
    if (typeof value === "string") {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).trim();
  };

  const normalizedSkills = Array.isArray(payload.skills)
    ? payload.skills.map((skill) => toText(skill)).filter(Boolean)
    : typeof payload.skills === "string"
    ? payload.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  return {
    jobTitle: toText(payload.jobTitle),
    experience: toText(payload.experience),
    skills: normalizedSkills,
    education: toText(payload.education),
    industry: toText(payload.industry) || "technology",
    level: (toText(payload.level) as ResumeGenerationRequest["level"]) || "mid",
    style: (toText(payload.style) as ResumeGenerationRequest["style"]) || "modern",
    includeObjective: payload.includeObjective !== false,
    atsOptimization: payload.atsOptimization !== false,
    aiEnhancement: payload.aiEnhancement !== false,
  };
}

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
  const atsScore = calculateResumeATSScore(
    normalizedContent,
    request.skills,
    request.jobTitle,
    request.industry
  );
  const keywords = extractResumeKeywords(
    normalizedContent,
    request.jobTitle,
    request.industry,
    request.skills
  );
  const suggestions = generateResumeSuggestions(
    normalizedContent,
    atsScore,
    request.skills
  );
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const generatedAt = new Date().toISOString();

  const response: ResumeApiResponse = {
    content: normalizedContent,
    sections: {
      summary,
      experience,
      skills,
      education,
    },
    atsScore,
    keywords,
    suggestions,
    wordCount,
    generatedAt,
  };

  if (source) {
    response.source = source;
  }

  return response;
}

function generateFallbackResume(
  request: ResumeGenerationRequest
): ResumeGenerationResult {
  const summary = generateProfessionalSummary(
    request.jobTitle,
    request.experience,
    request.level,
    request.industry
  );
  const experience = generateExperienceSection(request.experience, request.level);
  const skills = generateSkillsSection(request.skills, request.industry, request.level);
  const education = generateEducationSection(request.education);
  const content = generateResumeContent({
    summary,
    experience,
    skills,
    education,
    includeObjective: request.includeObjective,
    style: request.style,
  });

  return {
    summary,
    experience,
    skills,
    education,
    content,
  };
}

function generateProfessionalSummary(
  jobTitle: string, 
  experience: string, 
  level: string, 
  industry: string
): string {
  const levelMap = {
    entry: ["motivated", "detail-oriented", "eager to learn"],
    mid: ["skilled", "results-driven", "collaborative"],
    senior: ["experienced", "strategic", "leadership"],
    executive: ["visionary", "accomplished", "transformational"]
  };

  const industryMap = {
    technology: ["software development", "system architecture", "technical solutions"],
    healthcare: ["patient care", "medical protocols", "healthcare delivery"],
    finance: ["financial analysis", "risk management", "investment strategies"],
    marketing: ["brand development", "campaign management", "market research"],
    engineering: ["project management", "technical design", "process optimization"],
    consulting: ["strategic advisory", "business transformation", "client relations"]
  };

  const levelWords = levelMap[level as keyof typeof levelMap] || levelMap.mid;
  const industryWords = industryMap[industry as keyof typeof industryMap] || industryMap.technology;

  return `PROFESSIONAL SUMMARY
${levelWords[Math.floor(Math.random() * levelWords.length)]} professional with expertise in ${industryWords[Math.floor(Math.random() * industryWords.length)]}. 
Seeking ${jobTitle} position where I can leverage my skills and experience to drive organizational success and contribute to innovative solutions.`;
}

function generateExperienceSection(experience: string, level: string): string {
  const actionVerbs = level === 'senior' || level === 'executive' 
    ? ["Led", "Directed", "Managed", "Oversaw", "Transformed", "Optimized"]
    : ["Developed", "Implemented", "Contributed", "Assisted", "Supported", "Executed"];

  const metrics = [
    "improving efficiency by 25%",
    "reducing costs by 15%",
    "increasing revenue by 30%",
    "enhancing customer satisfaction by 20%",
    "streamlining processes by 40%"
  ];

  const randomAction = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
  const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];

  return `PROFESSIONAL EXPERIENCE
${randomAction} key initiatives that resulted in ${randomMetric}.

- Collaborated with cross-functional teams to deliver projects on time and within budget
- Developed and implemented innovative solutions to complex business challenges
- Maintained detailed documentation and ensured compliance with industry standards

${experience}

[Additional achievements and responsibilities would be detailed here]`;
}

function generateSkillsSection(skills: string[], industry: string, level: string): string {
  const industrySkills = {
    technology: ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "Git", "SQL"],
    healthcare: ["Patient Care", "Medical Terminology", "HIPAA Compliance", "Electronic Health Records"],
    finance: ["Financial Analysis", "Excel", "QuickBooks", "Risk Assessment", "Budget Management"],
    marketing: ["Digital Marketing", "SEO/SEM", "Content Strategy", "Analytics", "Social Media"],
  };

  const defaultSkills = industrySkills[industry as keyof typeof industrySkills] || industrySkills.technology;
  const allSkills = Array.from(new Set([...skills, ...defaultSkills]));

  return `TECHNICAL SKILLS
${allSkills.join(" | ")}

SOFT SKILLS
- Communication and Presentation
- Problem Solving and Critical Thinking
- Team Collaboration and Leadership
- Project Management and Organization
- Adaptability and Continuous Learning`;
}

function generateEducationSection(education: string): string {
  return `EDUCATION
${education || "- Bachelor's Degree in relevant field"}
- Additional certifications and professional development
- Continuous learning and skill enhancement programs`;
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
To obtain a challenging position in a progressive organization where I can utilize my skills and experience to contribute to company growth while developing professionally.\n\n`;
  }

  content += sections.summary + "\n\n";
  content += sections.experience + "\n\n";
  content += sections.skills + "\n\n";
  content += sections.education;

  return content;
}

function calculateResumeATSScore(
  content: string, 
  skills: string[], 
  jobTitle: string, 
  industry: string
): number {
  let score = 50; // Base score

  // Keyword matching
  const contentLower = content.toLowerCase();
  const jobTitleWords = jobTitle.toLowerCase().split(' ');
  const industryWords = industry.toLowerCase();

  // Score for job title keywords
  jobTitleWords.forEach(word => {
    if (contentLower.includes(word)) {
      score += 5;
    }
  });

  // Score for industry keywords
  if (contentLower.includes(industryWords)) {
    score += 10;
  }

  // Score for skills
  skills.forEach(skill => {
    if (contentLower.includes(skill.toLowerCase())) {
      score += 3;
    }
  });

  // Structure analysis
  if (content.includes('PROFESSIONAL SUMMARY') || content.includes('OBJECTIVE')) {
    score += 10;
  }
  if (content.includes('EXPERIENCE') || content.includes('PROFESSIONAL EXPERIENCE')) {
    score += 10;
  }
  if (content.includes('SKILLS') || content.includes('TECHNICAL SKILLS')) {
    score += 10;
  }
  if (content.includes('EDUCATION')) {
    score += 5;
  }

  // Length optimization
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 600) {
    score += 10;
  } else if (wordCount >= 200 && wordCount <= 800) {
    score += 5;
  }

  // Cap at 100
  return Math.min(score, 100);
}

function extractResumeKeywords(
  content: string, 
  jobTitle: string, 
  industry: string, 
  skills: string[]
): string[] {
  const commonKeywords = [
    "leadership", "communication", "teamwork", "problem-solving", "analytical",
    "project management", "collaboration", "initiative", "adaptability", "creativity",
    "strategic thinking", "customer service", "attention to detail", "time management",
    "critical thinking", "interpersonal skills", "organization", "planning"
  ];

  const contentLower = content.toLowerCase();
  const jobTitleWords = jobTitle.toLowerCase().split(' ');
  const skillsLower = skills.map(skill => skill.toLowerCase());

  // Find keywords in content
  const foundKeywords = [
    ...commonKeywords.filter(keyword => contentLower.includes(keyword)),
    ...jobTitleWords.filter(word => contentLower.includes(word)),
    ...skillsLower.filter(skill => contentLower.includes(skill))
  ];

  // Remove duplicates and return top keywords
  return Array.from(new Set(foundKeywords)).slice(0, 12);
}

function generateResumeSuggestions(
  content: string, 
  atsScore: number, 
  skills: string[]
): string[] {
  const suggestions: string[] = [];

  if (atsScore < 70) {
    suggestions.push("Add more relevant keywords from job descriptions to improve ATS compatibility");
  }

  if (!content.includes('quantifiable') && !content.includes('numbers')) {
    suggestions.push("Include specific metrics and quantifiable achievements");
  }

  if (skills.length < 5) {
    suggestions.push("Expand your skills section with more relevant technical and soft skills");
  }

  if (!content.includes('professional summary') && !content.includes('objective')) {
    suggestions.push("Add a professional summary or objective statement");
  }

  const wordCount = content.split(/\s+/).length;
  if (wordCount < 200) {
    suggestions.push("Expand your resume to provide more detail about your experience");
  } else if (wordCount > 800) {
    suggestions.push("Consider making your resume more concise (aim for 300-600 words)");
  }

  return suggestions.slice(0, 4); // Return top 4 suggestions
}
