import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";
import {
  generateCoverLetter,
  type CoverLetterResponse,
  type CoverLetterRequest,
} from "@/services/ai/geminiService";

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

interface CoverLetterRequestPayload {
  jobTitle?: unknown;
  companyName?: unknown;
  jobDescription?: unknown;
  skills?: unknown;
  experience?: unknown;
  tone?: unknown;
  length?: unknown;
  atsOptimization?: unknown;
  keywordFocus?: unknown;
  deepResearch?: unknown;
  applicantName?: unknown;
}

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

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const normalizedRequest = normalizeCoverLetterRequest(payload as CoverLetterRequestPayload);

    if (!normalizedRequest.jobTitle || !normalizedRequest.companyName || !normalizedRequest.jobDescription) {
      return NextResponse.json({
        error: 'Missing required fields: jobTitle, companyName, jobDescription'
      }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const isMockToken = process.env.NODE_ENV === "development" && authHeader?.includes(MOCK_SIGNATURE);

    if (isMockToken) {
      const mockResponse = buildCoverLetterResponse(
        generateFallbackCoverLetter(normalizedRequest),
        normalizedRequest,
        'mock'
      );
      return NextResponse.json(mockResponse);
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.subscription?.tier === 'free') {
      return NextResponse.json({ 
        error: 'Premium subscription required for AI cover letter generation' 
      }, { status: 403 });
    }

    let aiResult: CoverLetterResponse;
    let source: CoverLetterApiResponse['source'] = 'gemini';

    try {
      aiResult = await generateCoverLetter({
        jobTitle: normalizedRequest.jobTitle,
        companyName: normalizedRequest.companyName,
        jobDescription: normalizedRequest.jobDescription,
        skills: normalizedRequest.skills,
        experience: normalizedRequest.experience,
        tone: normalizedRequest.tone,
        length: normalizedRequest.length,
        deepResearch: normalizedRequest.deepResearch,
      });
    } catch (error) {
      console.error('Gemini cover letter generation failed, using fallback:', error);
      aiResult = generateFallbackCoverLetter(normalizedRequest);
      source = 'fallback';
    }

    const responsePayload = buildCoverLetterResponse(aiResult, normalizedRequest, source);

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
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
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

function normalizeCoverLetterRequest(payload: CoverLetterRequestPayload): NormalizedCoverLetterRequest {
  const toText = (value: unknown): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  };

  const normalizedSkills = Array.isArray(payload.skills)
    ? payload.skills.filter((item): item is string => typeof item === 'string').map((skill) => skill.trim()).filter(Boolean)
    : typeof payload.skills === 'string'
    ? payload.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  const applicantName = toText(payload.applicantName);

  return {
    jobTitle: toText(payload.jobTitle),
    companyName: toText(payload.companyName),
    jobDescription: toText(payload.jobDescription),
    experience: toText(payload.experience),
    skills: normalizedSkills,
    tone: ensureTone(toText(payload.tone) || 'professional'),
    length: ensureLength(toText(payload.length) || 'standard'),
    atsOptimization: payload.atsOptimization !== false,
    keywordFocus: payload.keywordFocus !== false,
    deepResearch: payload.deepResearch === true,
    applicantName: applicantName || undefined,
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
    ? result.keywords
    : fallback?.keywords ?? [];
  const improvements = Array.isArray(result.improvements)
    ? result.improvements
    : fallback?.improvements ?? [];
  const rawScore = Number.isFinite(result.atsScore)
    ? Number(result.atsScore)
    : fallback?.atsScore ?? 75;
  const atsScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const deepResearch = result.deepResearch ?? fallback?.deepResearch ?? request.deepResearch;
  const researchInsights = result.researchInsights ?? fallback?.researchInsights;

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
${request.applicantName ?? ''}`,
  ];

  const content = paragraphs.join('\n\n');

  return {
    content,
    atsScore: 78,
    keywords: request.skills.slice(0, 8),
    improvements: [
      'Add specific metrics to highlight impact in prior roles',
      `Reference a recent initiative at ${request.companyName} to demonstrate research`,
      'Tailor the closing paragraph with a direct next step',
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
