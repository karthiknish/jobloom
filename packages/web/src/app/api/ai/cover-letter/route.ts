import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, categorizeFirebaseError } from "@/firebase/admin";
import {
  generateCoverLetter,
  type CoverLetterResponse,
  type CoverLetterRequest,
} from "@/services/ai/geminiService";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

// Input validation schema
const coverLetterRequestSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(200, "Job title too long"),
  companyName: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters").max(15000, "Job description too long (max 15000 characters)"),
  skills: z.union([
    z.array(z.string().max(100)).max(20),
    z.string().max(1000)
  ]).optional(),
  experience: z.string().max(5000, "Experience too long").optional(),
  tone: z.enum(["professional", "friendly", "enthusiastic", "formal"]).optional().default("professional"),
  length: z.enum(["concise", "standard", "detailed"]).optional().default("standard"),
  atsOptimization: z.boolean().optional().default(true),
  keywordFocus: z.boolean().optional().default(true),
  deepResearch: z.boolean().optional().default(false),
  applicantName: z.string().max(200).optional(),
});

type CoverLetterTone = z.infer<typeof coverLetterRequestSchema>["tone"];
type CoverLetterLength = z.infer<typeof coverLetterRequestSchema>["length"];

interface CoverLetterApiResponse {
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  tone: CoverLetterTone;
  wordCount: number;
  deepResearch?: boolean;
  researchInsights?: string[];
  source?: "gemini" | "fallback" | "mock";
}

// Retry wrapper for AI generation
async function generateCoverLetterWithRetry(
  request: CoverLetterRequest,
  maxRetries: number = 2
): Promise<{ result: CoverLetterResponse; source: "gemini" | "fallback" }> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateCoverLetter(request);
      return { result, source: "gemini" };
    } catch (error: any) {
      lastError = error;
      console.error(`Cover letter generation attempt ${attempt + 1} failed:`, error?.message);
      
      if (error?.message?.includes('API key') || error?.message?.includes('quota')) {
        break;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

export const POST = withApi({
  auth: 'required',
  rateLimit: 'ai-cover-letter',
  bodySchema: coverLetterRequestSchema,
}, async ({ user, body, requestId }) => {
  // 1. Premium Check
  if (user!.tier === 'free') {
    return {
      error: 'Premium subscription required for AI cover letter generation',
      code: ERROR_CODES.PAYMENT_REQUIRED,
      upgradeUrl: '/upgrade',
    };
  }

  // 2. Normalize Request
  const normalizedSkills = Array.isArray(body.skills)
    ? body.skills.filter((item): item is string => typeof item === 'string').map((skill) => skill.trim()).filter(Boolean)
    : typeof body.skills === 'string'
    ? body.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  const normalizedRequest = {
    ...body,
    skills: normalizedSkills.slice(0, 20),
    jobTitle: body.jobTitle.trim(),
    companyName: body.companyName.trim(),
    jobDescription: body.jobDescription.trim(),
    experience: body.experience?.trim() || '',
  };

  // 3. Generate Cover Letter
  let aiResult: CoverLetterResponse;
  let source: CoverLetterApiResponse['source'] = 'gemini';

  try {
    const generation = await generateCoverLetterWithRetry({
      jobTitle: normalizedRequest.jobTitle,
      companyName: normalizedRequest.companyName,
      jobDescription: normalizedRequest.jobDescription,
      skills: normalizedRequest.skills,
      experience: normalizedRequest.experience,
      tone: normalizedRequest.tone as any,
      length: normalizedRequest.length as any,
      deepResearch: normalizedRequest.deepResearch,
    });
    aiResult = generation.result;
    source = generation.source;
  } catch (error) {
    console.error('All cover letter generation attempts failed, using fallback:', error);
    aiResult = generateFallbackCoverLetter(normalizedRequest);
    source = 'fallback';
  }

  const responsePayload = buildCoverLetterResponse(aiResult, normalizedRequest, source);

  // 4. Save to Firestore (Background)
  const db = getAdminDb();
  db.collection('users').doc(user!.uid).collection('coverLetters').add({
    ...responsePayload,
    source,
    jobTitle: normalizedRequest.jobTitle,
    companyName: normalizedRequest.companyName,
    tone: normalizedRequest.tone,
    length: normalizedRequest.length,
    skills: normalizedRequest.skills,
    atsOptimization: normalizedRequest.atsOptimization,
    keywordFocus: normalizedRequest.keywordFocus,
    deepResearch: normalizedRequest.deepResearch,
    createdAt: new Date().toISOString(),
    requestId
  }).catch(saveError => {
    const categorized = categorizeFirebaseError(saveError);
    console.error('Failed to save cover letter:', { error: categorized, requestId });
  });

  return responsePayload;
});

function buildCoverLetterResponse(
  result: CoverLetterResponse,
  request: any,
  source?: CoverLetterApiResponse['source'],
): CoverLetterApiResponse {
  const sanitize = (value: string | undefined): string =>
    value ? value.replace(/\r\n/g, "\n").trim() : '';

  let fallback: CoverLetterResponse | null = null;

  let content = sanitize(result.content);
  if (!content) {
    fallback = generateFallbackCoverLetter(request);
    content = fallback.content;
  }

  const normalizedContent = content.replace(/\n{3,}/g, '\n\n');
  const keywords = Array.isArray(result.keywords)
    ? result.keywords.slice(0, 15)
    : fallback?.keywords ?? [];
  const improvements = Array.isArray(result.improvements)
    ? result.improvements.slice(0, 10)
    : fallback?.improvements ?? [];
  const rawScore = Number.isFinite(result.atsScore)
    ? Number(result.atsScore)
    : fallback?.atsScore ?? 75;
  const atsScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const deepResearch = result.deepResearch ?? fallback?.deepResearch ?? request.deepResearch;
  const researchInsights = (result.researchInsights ?? fallback?.researchInsights ?? []).slice(0, 5);

  return {
    content: normalizedContent,
    atsScore,
    keywords,
    improvements,
    tone: request.tone,
    wordCount,
    deepResearch,
    researchInsights,
    source,
  };
}

function generateFallbackCoverLetter(request: any): CoverLetterResponse {
  const skillsSentence = request.skills.length > 0
    ? `My core strengths include ${request.skills.slice(0, 6).join(', ')}.`
    : '';

  const paragraphs = [
    `Dear Hiring Manager,

I am excited to apply for the ${request.jobTitle} role at ${request.companyName}. With a track record of delivering measurable results and partnering effectively across teams, I am confident in my ability to contribute immediately.`,
    `${request.experience || 'I bring hands-on experience solving complex challenges and aligning solutions to business goals.'} ${skillsSentence}`.trim(),
    `Your recent focus on innovation and team excellence at ${request.companyName} resonates strongly with my approach to work. I would welcome the opportunity to bring my background to your team and help drive the next chapter of growth.`,
    `Thank you for your time and consideration. I look forward to the possibility of discussing how my experience aligns with the needs of ${request.companyName}.`,
    `Sincerely,
${request.applicantName ?? '[Your Name]'}`,
  ];

  const content = paragraphs.join('\n\n');

  return {
    content,
    atsScore: 72,
    keywords: request.skills.slice(0, 8),
    improvements: [
      'Add specific metrics to highlight impact in prior roles',
      `Reference a recent initiative at ${request.companyName} to demonstrate research`,
      'Tailor the closing paragraph with a direct next step',
      'Consider using more industry-specific terminology',
    ],
    wordCount: content.split(/\s+/).filter(Boolean).length,
    deepResearch: request.deepResearch,
    researchInsights: request.deepResearch
      ? [
          `Highlight how ${request.companyName}'s mission aligns with your values`,
          'Mention a recent company milestone or product update to personalize the letter',
        ]
      : [],
  };
}

export { OPTIONS } from "@/lib/api/withApi";
