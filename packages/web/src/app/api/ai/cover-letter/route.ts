import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb, categorizeFirebaseError } from "@/firebase/admin";
import {
  generateCoverLetter,
  type CoverLetterResponse,
  type CoverLetterRequest,
} from "@/services/ai/geminiService";
import { z } from "zod";

const MOCK_SIGNATURE = "bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc";

type CoverLetterTone = CoverLetterRequest["tone"];
type CoverLetterLength = CoverLetterRequest["length"];

const VALID_TONES: readonly CoverLetterTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "formal",
] as const;

const VALID_LENGTHS: readonly CoverLetterLength[] = [
  "concise",
  "standard",
  "detailed",
] as const;

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

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 cover letters per hour
const MIN_REQUEST_INTERVAL_MS = 5000; // 5 seconds between requests

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
  requestId?: string;
}

interface NormalizedCoverLetterRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  atsOptimization: boolean;
  keywordFocus: boolean;
  deepResearch: boolean;
  applicantName?: string;
}

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number; tooFast: boolean } {
  const now = Date.now();
  const existing = rateLimitMap.get(userId);
  
  if (!existing || existing.resetAt < now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(userId, { count: 1, resetAt, lastRequest: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt, tooFast: false };
  }
  
  // Check for rapid-fire requests
  const tooFast = (now - existing.lastRequest) < MIN_REQUEST_INTERVAL_MS;
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, tooFast };
  }
  
  existing.count++;
  existing.lastRequest = now;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count, resetAt: existing.resetAt, tooFast };
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
      
      // Don't retry on certain errors
      if (error?.message?.includes('API key') || error?.message?.includes('quota')) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  console.warn('All AI generation attempts failed, using fallback');
  throw lastError;
}

export async function POST(request: NextRequest) {
  const requestId = `cl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken?.uid) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED',
        requestId 
      }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(decodedToken.uid);
    
    if (rateLimit.tooFast) {
      return NextResponse.json({
        error: 'Please wait a few seconds between requests',
        code: 'RATE_LIMIT_TOO_FAST',
        requestId
      }, { status: 429 });
    }
    
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Cover letter generation limit reached',
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt).toISOString(),
        requestId
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
        }
      });
    }

    // Parse and validate request body
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ 
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId 
      }, { status: 400 });
    }

    // Validate with Zod schema
    const parseResult = coverLetterRequestSchema.safeParse(payload);
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.flatten().fieldErrors,
        requestId
      }, { status: 400 });
    }

    const validatedData = parseResult.data;
    const normalizedRequest = normalizeCoverLetterRequest(validatedData);

    // Check for mock token in development
    const authHeader = request.headers.get('authorization');
    const isMockToken = process.env.NODE_ENV === "development" && authHeader?.includes(MOCK_SIGNATURE);

    if (isMockToken) {
      const mockResponse = buildCoverLetterResponse(
        generateFallbackCoverLetter(normalizedRequest),
        normalizedRequest,
        'mock'
      );
      return NextResponse.json({ ...mockResponse, requestId });
    }

    // Verify premium subscription
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId 
      }, { status: 404 });
    }

    const isPremium = userData.subscription?.tier === 'premium' || 
                      userData.subscription?.tier === 'enterprise' ||
                      userData.subscriptionId; // Legacy check

    if (!isPremium) {
      return NextResponse.json({ 
        error: 'Premium subscription required for AI cover letter generation',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: '/upgrade',
        requestId
      }, { status: 403 });
    }

    // Generate cover letter with retry logic
    let aiResult: CoverLetterResponse;
    let source: CoverLetterApiResponse['source'] = 'gemini';

    try {
      const generation = await generateCoverLetterWithRetry({
        jobTitle: normalizedRequest.jobTitle,
        companyName: normalizedRequest.companyName,
        jobDescription: normalizedRequest.jobDescription,
        skills: normalizedRequest.skills,
        experience: normalizedRequest.experience,
        tone: normalizedRequest.tone,
        length: normalizedRequest.length,
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

    // Save to user's collection with error handling
    try {
      await db.collection('users').doc(decodedToken.uid).collection('coverLetters').add({
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
      });
    } catch (saveError: any) {
      const categorized = categorizeFirebaseError(saveError);
      console.error('Failed to save cover letter:', { error: categorized, requestId });
      // Don't fail the request if save fails - the user still gets their letter
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({ 
      ...responsePayload, 
      requestId 
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-Response-Time': `${responseTime}ms`,
        'X-Generation-Source': source
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('Cover letter generation error:', { 
      error: error?.message, 
      stack: error?.stack,
      requestId,
      responseTime 
    });
    
    // Categorize the error for better client handling
    const isRetryable = error?.message?.includes('network') || 
                        error?.message?.includes('timeout') ||
                        error?.message?.includes('unavailable');
    
    return NextResponse.json({
      error: 'Failed to generate cover letter',
      code: 'GENERATION_FAILED',
      retryable: isRetryable,
      requestId
    }, { status: 500 });
  }
}

function ensureTone(value: string): CoverLetterTone {
  const normalized = value.toLowerCase() as CoverLetterTone;
  return VALID_TONES.includes(normalized) ? normalized : "professional";
}

function ensureLength(value: string): CoverLetterLength {
  const normalized = value.toLowerCase() as CoverLetterLength;
  return VALID_LENGTHS.includes(normalized) ? normalized : "standard";
}

function normalizeCoverLetterRequest(payload: z.infer<typeof coverLetterRequestSchema>): NormalizedCoverLetterRequest {
  // Skills can be array or comma-separated string
  const normalizedSkills = Array.isArray(payload.skills)
    ? payload.skills.filter((item): item is string => typeof item === 'string').map((skill) => skill.trim()).filter(Boolean)
    : typeof payload.skills === 'string'
    ? payload.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  return {
    jobTitle: payload.jobTitle.trim(),
    companyName: payload.companyName.trim(),
    jobDescription: payload.jobDescription.trim(),
    experience: payload.experience?.trim() || '',
    skills: normalizedSkills.slice(0, 20), // Limit skills
    tone: ensureTone(payload.tone || 'professional'),
    length: ensureLength(payload.length || 'standard'),
    atsOptimization: payload.atsOptimization ?? true,
    keywordFocus: payload.keywordFocus ?? true,
    deepResearch: payload.deepResearch ?? false,
    applicantName: payload.applicantName?.trim() || undefined,
  };
}

function buildCoverLetterResponse(
  result: CoverLetterResponse,
  request: NormalizedCoverLetterRequest,
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
    ? result.keywords.slice(0, 15) // Limit keywords
    : fallback?.keywords ?? [];
  const improvements = Array.isArray(result.improvements)
    ? result.improvements.slice(0, 10) // Limit improvements
    : fallback?.improvements ?? [];
  const rawScore = Number.isFinite(result.atsScore)
    ? Number(result.atsScore)
    : fallback?.atsScore ?? 75;
  const atsScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const deepResearch = result.deepResearch ?? fallback?.deepResearch ?? request.deepResearch;
  const researchInsights = (result.researchInsights ?? fallback?.researchInsights ?? []).slice(0, 5);

  const response: CoverLetterApiResponse = {
    content: normalizedContent,
    atsScore,
    keywords,
    improvements,
    tone: request.tone,
    wordCount,
    deepResearch,
    researchInsights,
  };

  if (source) {
    response.source = source;
  }

  return response;
}

function generateFallbackCoverLetter(request: NormalizedCoverLetterRequest): CoverLetterResponse {
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
    atsScore: 72, // Lower score for fallback to indicate improvement possible
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
