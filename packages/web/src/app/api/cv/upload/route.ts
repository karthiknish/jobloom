import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, getAdminStorage, Timestamp, FieldValue } from "@/firebase/admin";
import { SUBSCRIPTION_LIMITS } from "@/types/api";
import {
  validateFileUpload,
  sanitizeFileName,
  SecurityLogger,
  validateAndSanitizeFormData
} from "@/utils/security";
import {
  evaluateAtsCompatibilityFromText,
  getKeywordsForIndustry,
} from "@/lib/ats";
import {
  getUploadLimitsForUser,
  validateFileUploadWithLimits,
  DEFAULT_UPLOAD_LIMITS
} from "@/config/uploadLimits";
import { 
  createAuthError, 
  createValidationError, 
  createRateLimitError,
  handleFileUploadError,
  handleDatabaseError,
  createSuccessResponse,
  withErrorHandler 
} from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { analyzeResume, type ResumeAnalysisResponse } from "@/services/ai/geminiService";

// ============ ROBUSTNESS UTILITIES ============

// Retry configuration for database operations
const DB_MAX_RETRIES = 3;
const DB_INITIAL_DELAY_MS = 500;
const DB_MAX_DELAY_MS = 5000;

/**
 * Retry a database operation with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = DB_MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[CV Upload] ${operationName} attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
      
      // Don't retry on validation errors
      if (lastError.message.includes('validation') || lastError.message.includes('invalid')) {
        throw lastError;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(DB_INITIAL_DELAY_MS * Math.pow(2, attempt), DB_MAX_DELAY_MS);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

/**
 * Validate PDF content before processing
 */
function validatePDFContent(buffer: Buffer): { valid: boolean; error?: string } {
  // Check minimum size (a valid PDF is at least a few KB)
  if (buffer.length < 100) {
    return { valid: false, error: 'PDF file appears to be empty or corrupted' };
  }
  
  // Check PDF header signature
  const header = buffer.slice(0, 8).toString('utf8');
  if (!header.startsWith('%PDF')) {
    return { valid: false, error: 'Invalid PDF file format - missing PDF header' };
  }
  
  // Check for EOF marker (PDFs should end with %%EOF)
  const trailer = buffer.slice(-1024).toString('utf8');
  if (!trailer.includes('%%EOF')) {
    console.warn('[CV Upload] PDF missing %%EOF marker - may be truncated');
    // Don't fail, just warn - some valid PDFs omit this
  }
  
  return { valid: true };
}

/**
 * Sanitize extracted text from PDF
 */
function sanitizeExtractedText(text: string): string {
  return text
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove very long strings without spaces (likely binary data)
    .replace(/\S{500,}/g, ' ')
    // Trim
    .trim();
}

// ============ END ROBUSTNESS UTILITIES ============

// Use dynamic import for pdf-parse with workaround for test file bug
// The pdf-parse library tries to load './test/data/05-versions-space.pdf' during init
// We work around this by providing custom options that skip the default behavior
type PDFParseResult = { text: string; numpages?: number; info?: any };
const parsePDF = async (buffer: Buffer): Promise<PDFParseResult> => {
  // Dynamic import to avoid build-time issues
  const pdfParse = (await import('pdf-parse')).default;
  
  // Pass the buffer with options that prevent test file loading
  // The pagerender option prevents the default render that causes issues
  return pdfParse(buffer, {
    // Maximum pages to parse (0 = all)
    max: 0,
    // Custom page render function to avoid the test file issue
    pagerender: function(pageData: any) {
      const render_options = {
        normalizeWhitespace: true,
        disableCombineTextItems: false
      };
      return pageData.getTextContent(render_options).then(function(textContent: any) {
        let text = '';
        for (const item of textContent.items) {
          text += (item as any).str + ' ';
        }
        return text;
      });
    }
  });
};

// Initialize Firebase Admin if not already initialized (for storage)
// Centralized admin initialization already handled in firebase/admin.ts

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// Helper function to check subscription limits
async function checkSubscriptionLimits(
  userId: string
): Promise<{
  allowed: boolean;
  plan: string;
  currentUsage: number;
  limit: number;
}> {
  try {
    // Get user record to find subscription info
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Admin users have unlimited access
    if (userData?.isAdmin === true) {
      return {
        allowed: true,
        plan: "admin",
        currentUsage: 0,
        limit: -1, // Unlimited
      };
    }

    let plan = "free";
    if (userData?.subscriptionId) {
      // Check if subscription is active
      const subscriptionDoc = await db
        .collection("subscriptions")
        .doc(userData.subscriptionId)
        .get();
      const subscription = subscriptionDoc.data();

      if (subscription?.status === "active" && subscription?.plan) {
        plan = subscription.plan;
      }
    }

    // Count current month's CV analyses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const cvAnalyses = await db
      .collection("cvAnalyses")
      .where("userId", "==", userId)
      .where(
        "createdAt",
        ">=",
        Timestamp.fromDate(startOfMonth)
      )
      .get();

    const currentUsage = cvAnalyses.size;
    const limit =
      SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS]
        .cvAnalysesPerMonth;

    return {
      allowed: limit === -1 || currentUsage < limit,
      plan,
      currentUsage,
      limit: limit === -1 ? -1 : limit,
    };
  } catch (error) {
    console.error("Error checking subscription limits:", error);
    // Default to free plan limits on error
    return {
      allowed: false,
      plan: "free",
      currentUsage: 0,
      limit: SUBSCRIPTION_LIMITS.free.cvAnalysesPerMonth,
    };
  }
}

// POST /api/cv/upload - Upload and analyze CV
export async function POST(request: NextRequest) {
  try {
    const debug: Record<string, any> = { step: 'start' };
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

  debug.step = 'reading-form-data';
  const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const targetRole = formData.get("targetRole") as string;
    const industry = formData.get("industry") as string;

    console.log("CV Upload request received:");
    console.log("- file:", file ? `${file.name} (${file.size} bytes)` : "null");
    console.log("- userId:", userId || "null");
    console.log("- targetRole:", targetRole || "null");
    console.log("- industry:", industry || "null");

    if (!file || !userId) {
      console.error("Missing required fields:", { file: !!file, userId: !!userId });
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        userId: userId || 'unknown',
        details: { missingFields: { file: !file, userId: !userId } },
        severity: 'medium'
      });
      return NextResponse.json(
        { error: "Missing file or userId", received: { file: !!file, userId: !!userId } },
        { status: 400 }
      );
    }

    // Validate and sanitize input data
    const inputData = { targetRole, industry };
    const { sanitized, errors } = validateAndSanitizeFormData(inputData);

    if (Object.keys(errors).length > 0) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        userId,
        details: { validationErrors: errors, inputData },
        severity: 'medium'
      });
      return NextResponse.json(
        { error: "Invalid input data", details: errors },
        { status: 400 }
      );
    }

  const sanitizedTargetRole = typeof sanitized.targetRole === "string" ? sanitized.targetRole : "";
  const sanitizedIndustry = typeof sanitized.industry === "string" ? sanitized.industry : "";

    // Check subscription limits
  debug.step = 'check-subscription';
  const limitCheck = await checkSubscriptionLimits(userId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `CV analysis limit reached. You've used ${limitCheck.currentUsage} of ${limitCheck.limit} analyses this month.`,
          plan: limitCheck.plan,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
          upgradeRequired: true,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Get upload limits based on user's subscription plan
    const uploadLimits = await getUploadLimitsForUser(userId);
    console.log(`Upload limits for user ${userId}:`, uploadLimits);

    // Validate file upload with dynamic limits
    const fileValidation = validateFileUploadWithLimits(file, uploadLimits);

    if (!fileValidation.valid) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        ip: decodedToken.uid, // Using user ID as identifier
        userId: userId,
        details: {
          error: fileValidation.error,
          errorType: fileValidation.errorType,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadLimits: {
            maxSize: uploadLimits.maxSize,
            maxSizeMB: uploadLimits.maxSizeMB,
            allowedTypes: uploadLimits.allowedTypes,
            allowedExtensions: uploadLimits.allowedExtensions
          }
        },
        severity: 'medium'
      });

      return NextResponse.json(
        { 
          error: fileValidation.error,
          errorType: fileValidation.errorType,
          details: fileValidation.details,
          uploadLimits: {
            maxSizeMB: uploadLimits.maxSizeMB,
            allowedTypes: uploadLimits.allowedTypes,
            allowedExtensions: uploadLimits.allowedExtensions
          }
        },
        { status: 400 }
      );
    }

    console.log(`File validation passed for ${file.name} (${file.size} bytes)`);

    // Generate unique filename with sanitization
    const fileExtension = file.type === "application/pdf" ? "pdf" : "txt";
    const sanitizedBaseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}-${sanitizedBaseName}.${fileExtension}`;

    // Resolve bucket name explicitly (prefer server-side env var)
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      console.error("CV Upload: Missing FIREBASE_STORAGE_BUCKET env variable");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

  debug.step = 'get-bucket';
  const bucket = getAdminStorage().bucket(bucketName);
    const fileRef = bucket.file(`cv-uploads/${userId}/${fileName}`);
  debug.step = 'read-file-buffer';
    const buffer = Buffer.from(await file.arrayBuffer());

    debug.step = 'save-file';
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Create CV analysis record in Firestore
    const cvAnalysisRef = db.collection("cvAnalyses").doc();
    const cvAnalysisData = {
      userId,
      fileName: sanitizeFileName(file.name),
      fileSize: file.size,
      storagePath: `cv-uploads/${userId}/${fileName}`,
      targetRole: sanitizedTargetRole || null,
      industry: sanitizedIndustry || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      analysisStatus: "processing",
      processingStartedAt: FieldValue.serverTimestamp(),
      overallScore: null,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      missingSkills: [],
      atsCompatibility: null,
      keywordAnalysis: null,
      sectionAnalysis: null,
      industryAlignment: null,
      errorMessage: null,
    };

  debug.step = 'write-firestore-pending';
  await cvAnalysisRef.set(cvAnalysisData);

    // Trigger CV analysis using the Gemini-powered pipeline asynchronously
    performCvAnalysis(
      cvAnalysisRef.id,
      buffer,
      file.type,
      sanitizedTargetRole || null,
      sanitizedIndustry || null
    ).catch((processingError) => {
      console.error("Resume analysis pipeline error:", processingError);
    });

    return NextResponse.json({
      success: true,
      analysisId: cvAnalysisRef.id,
      message: "CV uploaded successfully. Analysis in progress...",
    });
  } catch (error: any) {
    console.error("Error uploading CV:", error);
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(isProd
          ? {}
          : { debug: { message: error?.message, stack: error?.stack, cause: error?.cause } }),
      },
      { status: 500 }
    );
  }
}

// Gemini-backed CV analysis pipeline
async function performCvAnalysis(
  analysisId: string,
  fileBuffer: Buffer,
  fileType: string,
  targetRole: string | null,
  industry: string | null
) {
  const startedAt = Date.now();

  try {
    await db.collection("cvAnalyses").doc(analysisId).update({
      analysisStatus: "processing",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const text = fileType === "application/pdf"
      ? await extractTextFromPDF(fileBuffer)
      : fileBuffer.toString();

    const heuristicAnalysis = await analyzeCvText(text, targetRole, industry, fileType);

    let aiInsights: ResumeAnalysisResponse | null = null;
    try {
      aiInsights = await analyzeResume({
        resumeText: text,
        jobDescription: targetRole || undefined,
      });
    } catch (aiError) {
      console.error("Gemini resume analysis failed; falling back to heuristic output", aiError);
    }

    const combinedAnalysis = combineAnalysisResults(
      heuristicAnalysis,
      aiInsights,
      targetRole,
      industry
    );

    await db.collection("cvAnalyses").doc(analysisId).update({
      ...combinedAnalysis,
      aiInsights: aiInsights ?? null,
      analysisEngine: aiInsights ? "gemini_with_heuristics" : "heuristic_only",
      analysisStatus: "completed",
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      processingDurationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Error performing CV analysis:", error);
    await db.collection("cvAnalyses").doc(analysisId).update({
      analysisStatus: "failed",
      errorMessage: "Analysis failed due to technical error",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

// Extract text from PDF using pdf-parse with validation and retry
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Validate PDF content first
  const validation = validatePDFContent(buffer);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid PDF file');
  }
  
  // Attempt extraction with retry
  return withRetry(async () => {
    const data = await parsePDF(buffer);
    
    // Validate extracted text
    const text = data.text || '';
    if (text.length < 10) {
      throw new Error('PDF appears to have no extractable text content');
    }
    
    // Sanitize the extracted text
    const sanitized = sanitizeExtractedText(text);
    
    // Check if meaningful content remains after sanitization
    if (sanitized.length < 50) {
      console.warn('[CV Upload] Extracted text is very short after sanitization');
    }
    
    return sanitized;
  }, 'PDF text extraction', 2); // Only 2 retries for PDF parsing
}

function mergeUniqueStrings(
  ...collections: Array<ReadonlyArray<string> | null | undefined>
): string[] {
  const set = new Set<string>();
  for (const collection of collections) {
    if (!collection) continue;
    for (const raw of collection) {
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (value) {
        set.add(value);
      }
    }
  }
  return Array.from(set);
}

const METRICS_REGEX = /\b(\d+%|\$?\d+[kKmM]?|[+\-]?\d+%|[0-9]+ (customers?|clients?|users?|projects?|teams?|leads?|opportunities?|accounts?|revenue|roi))\b/gi;
const ACTION_VERB_REGEX = /\b(achieved|improved|increased|decreased|developed|created|managed|led|delivered|implemented|optimized|designed|architected|built|launched|resolved|scaled|orchestrated|drove|initiated)\b/gi;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function clampToPercentage(value?: number | null): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return clampValue(Math.round(value), 0, 100);
}

function combineAnalysisResults(
  heuristic: Awaited<ReturnType<typeof analyzeCvText>>,
  aiInsights: ResumeAnalysisResponse | null,
  targetRole: string | null,
  industry: string | null
) {
  const blendedStrengths = mergeUniqueStrings(heuristic.strengths, aiInsights?.strengths);
  const blendedWeaknesses = mergeUniqueStrings(heuristic.weaknesses, aiInsights?.weaknesses);
  const blendedRecommendations = mergeUniqueStrings(
    heuristic.recommendations,
    aiInsights?.suggestions
  );
  const blendedMissingSkills = mergeUniqueStrings(
    heuristic.missingSkills,
    aiInsights?.missingKeywords
  );

  const presentKeywords = mergeUniqueStrings(
    heuristic.keywordAnalysis?.presentKeywords,
    aiInsights?.keywords
  ).slice(0, 50);

  const missingKeywords = mergeUniqueStrings(
    heuristic.keywordAnalysis?.missingKeywords,
    aiInsights?.missingKeywords
  ).slice(0, 50);

  const heuristicAtsScore = clampToPercentage(heuristic.atsCompatibility?.score);
  const aiAtsScore = clampToPercentage(aiInsights?.atsScore);
  const baselineHeuristicAts = typeof heuristicAtsScore === "number"
    ? heuristicAtsScore
    : typeof aiAtsScore === "number"
      ? aiAtsScore
      : 0;

  const blendedAtsScore = typeof aiAtsScore === "number"
    ? clampValue(Math.round(baselineHeuristicAts * 0.4 + aiAtsScore * 0.6), 0, 100)
    : baselineHeuristicAts;

  const heuristicOverall = clampToPercentage(heuristic.overallScore);
  const baselineOverall = typeof heuristicOverall === "number"
    ? heuristicOverall
    : blendedAtsScore;

  const blendedOverall = typeof aiAtsScore === "number"
    ? clampValue(Math.round(baselineOverall * 0.5 + aiAtsScore * 0.5), 0, 100)
    : baselineOverall;

  const atsCompatibility = {
    ...(heuristic.atsCompatibility ?? {}),
    score: blendedAtsScore,
    suggestions: mergeUniqueStrings(
      heuristic.atsCompatibility?.suggestions,
      aiInsights?.suggestions
    ),
  };

  const keywordAnalysis = heuristic.keywordAnalysis
    ? {
        ...heuristic.keywordAnalysis,
        presentKeywords,
        missingKeywords,
        keywordDensity: heuristic.keywordAnalysis.keywordDensity,
      }
    : {
        presentKeywords,
        missingKeywords,
        keywordDensity: 0,
      };

  return {
    ...heuristic,
    overallScore: blendedOverall,
    strengths: blendedStrengths,
    weaknesses: blendedWeaknesses,
    recommendations: blendedRecommendations,
    missingSkills: blendedMissingSkills,
    atsCompatibility,
    keywordAnalysis,
    targetRole: targetRole || null,
    industry: industry || null,
  };
}

// Mock CV analysis with deterministic ATS scoring backed by shared evaluator
async function analyzeCvText(
  text: string,
  targetRole: string | null,
  industry: string | null,
  fileType?: string | null
) {
  const safeText = text || "";
  const lowerText = safeText.toLowerCase();
  const normalizedTargetRole = targetRole?.trim() || null;
  const normalizedIndustry = industry?.trim() || null;

  const atsEvaluation = evaluateAtsCompatibilityFromText({
    text: safeText,
    targetRole: normalizedTargetRole,
    industry: normalizedIndustry,
    fileType: fileType ?? null,
  });

  const presentKeywords = atsEvaluation.matchedKeywords || [];
  const missingKeywords = atsEvaluation.missingKeywords || [];
  const combinedKeywords = Array.from(
    new Set([...presentKeywords, ...missingKeywords])
  );
  const keywordCoverage = combinedKeywords.length
    ? (presentKeywords.length / combinedKeywords.length) * 100
    : 0;

  const missingSections = atsEvaluation.missingSections || [];
  const hasSummary = !missingSections.includes("summary");
  const hasExperience = !missingSections.includes("experience");
  const hasEducation = !missingSections.includes("education");
  const hasSkills = !missingSections.includes("skills");
  const hasContact = !missingSections.includes("contact");

  const actionVerbCount = (safeText.match(ACTION_VERB_REGEX) || []).length;
  const hasMetrics = METRICS_REGEX.test(safeText);
  METRICS_REGEX.lastIndex = 0;
  ACTION_VERB_REGEX.lastIndex = 0;

  const hasProjects = /\b(projects?|portfolio|case study|case studies)\b/i.test(
    safeText
  );
  const hasCertifications = /\b(certified|certification|license|credential|aws certified|pmp|cfa|scrum master)\b/i.test(
    safeText
  );

  let contentQuality = 0;
  if (hasSummary) contentQuality += 10;
  if (hasExperience) contentQuality += 20;
  if (hasEducation) contentQuality += 10;
  if (hasSkills) contentQuality += 10;
  if (hasContact) contentQuality += 5;

  contentQuality += Math.min(actionVerbCount * 3, 18);
  if (hasMetrics) contentQuality += 15;
  if (hasProjects) contentQuality += 6;
  if (hasCertifications) contentQuality += 6;

  if (keywordCoverage >= 70) {
    contentQuality += 18;
  } else if (keywordCoverage >= 50) {
    contentQuality += 12;
  } else if (keywordCoverage >= 30) {
    contentQuality += 7;
  } else if (keywordCoverage > 0) {
    contentQuality += 4;
  }

  const wordCount = safeText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 250) {
    contentQuality -= 6;
  } else if (wordCount > 2000) {
    contentQuality -= 4;
  } else {
    contentQuality += 4;
  }

  contentQuality = clampValue(contentQuality, 0, 100);

  const overallScore = clampValue(
    Math.round(atsEvaluation.score * 0.55 + contentQuality * 0.45),
    0,
    100
  );

  const strengths = new Set<string>();
  const weaknesses = new Set<string>();
  const recommendations: string[] = [];

  if (atsEvaluation.score >= 80) {
    strengths.add("Excellent ATS-ready structure and formatting.");
  } else if (atsEvaluation.score >= 65) {
    strengths.add("Good ATS compatibility foundation.");
  }

  if (keywordCoverage >= 60) {
    strengths.add("Solid coverage of target role and industry keywords.");
  }

  if (hasMetrics) {
    strengths.add("Highlights achievements with measurable outcomes.");
  }

  if (actionVerbCount >= 6) {
    strengths.add("Uses powerful action verbs to describe impact.");
  }

  if (hasSummary) {
    strengths.add("Includes a concise professional summary.");
  }

  if (atsEvaluation.score < 65) {
    weaknesses.add("ATS compatibility is below the recommended threshold of 70+.");
  }

  if (keywordCoverage < 45) {
    weaknesses.add("Resume is missing many role-specific keywords.");
  }

  if (!hasMetrics) {
    weaknesses.add("Achievements lack quantifiable metrics or scope.");
  }

  if (!hasSummary) {
    weaknesses.add("Missing or weak professional summary section.");
  }

  if (!hasExperience) {
    weaknesses.add("Experience section is hard to detect or missing key details.");
  }

  const baseSuggestions = atsEvaluation.suggestions ?? [];
  recommendations.push(...baseSuggestions);

  if (!hasMetrics) {
    recommendations.push(
      "Add numbers, percentages, or scope to quantify your accomplishments."
    );
  }

  if (keywordCoverage < 70) {
    recommendations.push(
      "Mirror terminology from job listings to boost keyword matching."
    );
  }

  if (!hasSummary) {
    recommendations.push(
      "Write a two-to-three sentence professional summary that highlights experience and goals."
    );
  }

  const targetRoleLower = normalizedTargetRole?.toLowerCase() ?? "";
  if (!hasProjects && /engineer|developer|designer/.test(targetRoleLower)) {
    recommendations.push(
      "Include a projects section with tools, scope, and results."
    );
  }

  const missingSkills = Array.from(new Set(missingKeywords.slice(0, 10)));

  const industryKeywords = getKeywordsForIndustry(normalizedIndustry ?? '');
  const industryMatches = industryKeywords.filter((keyword: string) =>
    lowerText.includes(keyword.toLowerCase())
  );
  const industryAlignmentScore = industryKeywords.length
    ? Math.round((industryMatches.length / industryKeywords.length) * 100)
    : atsEvaluation.score;

  let industryFeedback = "";
  if (!normalizedIndustry) {
    industryFeedback =
      "Specify an industry to receive targeted alignment guidance.";
  } else if (industryAlignmentScore >= 75) {
    industryFeedback = `Strong alignment with ${normalizedIndustry} roles.`;
  } else if (industryAlignmentScore >= 50) {
    industryFeedback = `Moderate ${normalizedIndustry} alignment. Add more industry terminology, tools, and outcomes.`;
  } else {
    industryFeedback = `Limited ${normalizedIndustry} alignment detected. Highlight industry-specific accomplishments and vocabulary.`;
  }

  const sectionAnalysis = {
    hasSummary,
    hasExperience,
    hasEducation,
    hasSkills,
    hasContact,
    missingsections: missingSections,
  };

  const keywordAnalysis = {
    presentKeywords: presentKeywords.slice(0, 25),
    missingKeywords: missingKeywords.slice(0, 25),
    keywordDensity: presentKeywords.length > 0 ? Math.round((presentKeywords.length / (presentKeywords.length + missingKeywords.length)) * 100) : 0,
  };

  return {
    overallScore,
    strengths: Array.from(strengths),
    weaknesses: Array.from(weaknesses),
    recommendations: Array.from(new Set(recommendations)),
    missingSkills,
    atsCompatibility: {
      score: atsEvaluation.score,
      issues: atsEvaluation.issues.map(i => i.title),
      suggestions: Array.from(new Set(baseSuggestions)),
      breakdown: {
        structure: clampValue(
          (hasSummary ? 20 : 0) + (hasExperience ? 30 : 0) + (hasEducation ? 20 : 0) + (hasContact ? 15 : 0) + (hasSkills ? 15 : 0),
          0, 50
        ),
        keywords: clampValue(Math.round(keywordCoverage * 0.35), 0, 35),
        formatting: clampValue(atsEvaluation.score >= 70 ? 15 : atsEvaluation.score >= 50 ? 10 : 5, 0, 15),
        readability: clampValue(
          (wordCount >= 300 && wordCount <= 1200 ? 10 : 5) + 
          (actionVerbCount >= 5 ? 5 : 0),
          0, 15
        ),
        extras: clampValue(
          (hasProjects ? 5 : 0) + (hasCertifications ? 5 : 0) + (hasMetrics ? 5 : 0),
          0, 15
        ),
      },
    },
    keywordAnalysis,
    sectionAnalysis,
    industryAlignment: {
      score: clampValue(industryAlignmentScore, 0, 100),
      feedback: industryFeedback,
    },
  };
}
