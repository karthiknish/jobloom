import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, categorizeFirebaseError } from "@/firebase/admin";
import { UsageService } from "@/lib/api/usage";
import {
  generateCoverLetter,
  type CoverLetterResponse,
  type CoverLetterRequest,
} from "@/services/ai/geminiService";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { AuthorizationError } from "@/lib/api/errorResponse";
import { scoreCoverLetter } from "@/services/ats";

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
  applicationId: z.string().optional(),
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
  breakdown?: any;
  detailedMetrics?: any;
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
  // 1. Quota Check
  await UsageService.checkFeatureLimit(user!.uid, 'aiGenerationsPerMonth');

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
  
  // Final verify subscription is still active before DB write
  const userDoc = await db.collection('users').doc(user!.uid).get();
  const userData = userDoc.data();
  const isPremium = userData?.subscriptionPlan === 'premium' || userData?.isAdmin === true;
  
  // Note: UsageService.checkFeatureLimit already verified units at start of request.

  await db.collection('users').doc(user!.uid).collection('coverLetters').add({
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
    applicationId: normalizedRequest.applicationId,
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
  
  // Use the new unified ATS scoring service
  const atsEvaluation = scoreCoverLetter(normalizedContent, {
    targetRole: request.jobTitle,
    industry: request.industry,
    skills: request.skills
  });

  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const deepResearch = result.deepResearch ?? fallback?.deepResearch ?? request.deepResearch;
  const researchInsights = (result.researchInsights ?? fallback?.researchInsights ?? []).slice(0, 5);

  return {
    content: normalizedContent,
    atsScore: atsEvaluation.score,
    keywords: atsEvaluation.matchedKeywords,
    improvements: atsEvaluation.recommendations.high.map(imp => typeof imp === 'string' ? imp : imp.text),
    breakdown: atsEvaluation.breakdown,
    detailedMetrics: atsEvaluation.detailedMetrics,
    tone: request.tone,
    wordCount,
    deepResearch,
    researchInsights,
    source,
  };
}

function generateFallbackCoverLetter(request: any): CoverLetterResponse {
  const tone = request.tone || "professional";
  const length = request.length || "standard";
  
  const openings: Record<string, string[]> = {
    professional: [
      `It is with great enthusiasm that I submit my application for the ${request.jobTitle} position at ${request.companyName}.`,
      `I am writing to express my strong interest in the ${request.jobTitle} opening at ${request.companyName}, a company I have long admired for its commitment to excellence.`,
      `With a robust background in ${request.industry || 'the field'}, I am eager to bring my skills to the ${request.jobTitle} role at ${request.companyName}.`
    ],
    enthusiastic: [
      `I was thrilled to see the opening for a ${request.jobTitle} at ${request.companyName}! Your mission really resonates with me.`,
      `I've been a fan of ${request.companyName} for a long time, and I'm beyond excited to apply for the ${request.jobTitle} position.`,
      `I am passionate about ${request.industry || 'the work you do'}, and I would be honored to join ${request.companyName} as your next ${request.jobTitle}.`
    ],
    formal: [
      `Please accept this letter and the enclosed resume as a formal application for the position of ${request.jobTitle} at ${request.companyName}.`,
      `I am writing to formally apply for the ${request.jobTitle} position advertised by ${request.companyName}.`,
      `I wish to express my formal interest in the ${request.jobTitle} role at ${request.companyName}.`
    ],
    friendly: [
      `Hi there! I'm reaching out because I'd love to join the ${request.companyName} team as a ${request.jobTitle}.`,
      `I've been following ${request.companyName}'s journey, and I'm excited about the possibility of joining you as a ${request.jobTitle}.`,
      `I'm writing to you today because I'm a big fan of ${request.companyName} and I think I'd be a great fit for the ${request.jobTitle} role.`
    ]
  };

  const skillsList = request.skills.length > 0 
    ? `leveraging my core competencies in ${request.skills.slice(0, 4).join(", ")}`
    : `utilizing my diverse skill set and industry experience`;

  const bodyParagraphs: Record<string, string[]> = {
    standard: [
      `Throughout my career, I have consistently demonstrated a commitment to driving results. In my previous roles, I have ${request.experience ? request.experience.toLowerCase() : 'solved complex challenges and optimized workflows'} while ${skillsList}. I am confident that my proactive approach would be an asset to the ${request.companyName} team.`,
      `I bring a wealth of experience in ${request.industry || 'this sector'}, specifically ${skillsList}. My background has prepared me to tackle the unique challenges of the ${request.jobTitle} role at ${request.companyName}, and I am eager to contribute to your ongoing success.`
    ],
    concise: [
      `My professional background, including ${skillsList}, makes me an ideal candidate for this role. I am impressed by ${request.companyName}'s recent initiatives and am eager to contribute my expertise to your team.`,
      `I have a proven track record of success in ${request.industry || 'the field'}, and I am confident that my skills in ${request.skills.slice(0, 3).join(", ") || 'strategic planning'} will help ${request.companyName} achieve its goals.`
    ],
    detailed: [
      `In my experience as an industry professional, I have always prioritized ${request.skills[0] || 'quality and efficiency'}. For example, ${request.experience || 'I have led teams to achieve significant milestones and maintained high standards of performance.'} By applying my expertise in ${skillsList}, I aim to help ${request.companyName} reach new heights in the ${request.industry || 'market'}.`,
      `What draws me to ${request.companyName} is your dedication to innovation. My own professional philosophy is centered on ${skillsList}, which has allowed me to ${request.experience ? request.experience.toLowerCase() : 'deliver exceptional value in various high-pressure environments'}. I am eager to bring this same level of dedication to the ${request.jobTitle} position.`
    ]
  };

  const closings: Record<string, string[]> = {
    professional: [
      `Thank you for your time and consideration. I look forward to the possibility of discussing how my background aligns with the goals of ${request.companyName}.`,
      `I would welcome the opportunity to speak with you further about my qualifications. Thank you for considering my application.`
    ],
    enthusiastic: [
      `I can't wait to hear more about the team's vision! Thank you for the opportunity to apply.`,
      `I'm really excited about this role and look forward to potentially meeting the team. Thanks for your time!`
    ],
    formal: [
      `I remain at your disposal for any further information and hope to have the honor of an interview. Respectfully,`,
      `Thank you for your consideration. I look forward to hearing from you regarding the next steps in the recruitment process.`
    ],
    friendly: [
      `Thanks for taking the time to read my application. Hope to talk soon!`,
      `I'd love to chat more about how I can help out! Best,`
    ]
  };

  const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const selectedOpening = getRand(openings[tone] || openings.professional);
  const selectedBody = getRand(bodyParagraphs[length] || bodyParagraphs.standard);
  const selectedClosing = getRand(closings[tone] || closings.professional);

  const paragraphs = [
    `Dear Hiring Manager,`,
    selectedOpening,
    selectedBody,
    selectedClosing,
    `Sincerely,`,
    request.applicantName || "[Your Name]"
  ];

  const content = paragraphs.join("\n\n");

  return {
    content,
    atsScore: 78,
    keywords: request.skills.slice(0, 10),
    improvements: [
      "Include more specific metrics from your past roles",
      "Tailor the opening to reference a specific company value",
      "Highlight a recent achievement that directly relates to the job description",
      "Mention a specific tool or software you've mastered"
    ],
    wordCount: content.split(/\s+/).filter(Boolean).length,
    deepResearch: request.deepResearch,
    researchInsights: request.deepResearch ? [
      `Leverage ${request.companyName}'s focus on innovation in your discussion.`,
      `Note their recent expansion into new markets as a key interest.`
    ] : []
  };
}

export { OPTIONS } from "@/lib/api/withApi";
