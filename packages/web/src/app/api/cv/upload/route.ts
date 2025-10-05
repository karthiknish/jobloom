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
  getIndustryKeywordSet,
} from "@/lib/ats";

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

    // Validate file upload with security utilities
    const fileValidation = validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["application/pdf", "text/plain"],
      allowedExtensions: ["pdf", "txt"]
    });

    if (!fileValidation.valid) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        ip: decodedToken.uid, // Using user ID as identifier
        userId: userId,
        details: {
          error: fileValidation.error,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        },
        severity: 'medium'
      });

      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

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
      analysisStatus: "pending",
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

    // Trigger CV analysis (this would typically call an AI service)
    // For now, we'll simulate the analysis
    setTimeout(async () => {
      await performCvAnalysis(
        cvAnalysisRef.id,
        buffer,
        file.type,
        sanitizedTargetRole || null,
        sanitizedIndustry || null
      );
    }, 1000);

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

// Simulated CV analysis function
async function performCvAnalysis(
  analysisId: string,
  fileBuffer: Buffer,
  fileType: string,
  targetRole: string | null,
  industry: string | null
) {
  try {
    // Extract text from file (simplified)
    const text = fileType === "application/pdf"
      ? await extractTextFromPDF(fileBuffer)
      : fileBuffer.toString();

    // Perform AI analysis (simplified mock analysis)
  const analysis = await analyzeCvText(text, targetRole, industry, fileType);

    // Update the analysis record
    await db.collection("cvAnalyses").doc(analysisId).update({
      ...analysis,
      analysisStatus: "completed",
      updatedAt: FieldValue.serverTimestamp(),
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

// Mock text extraction from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // In a real implementation, you would use a PDF parsing library like pdf-parse
  return "Sample CV text extracted from PDF. This is a placeholder.";
}

const METRICS_REGEX = /\b(\d+%|\$?\d+[kKmM]?|[+\-]?\d+%|[0-9]+ (customers?|clients?|users?|projects?|teams?|leads?|opportunities?|accounts?|revenue|roi))\b/gi;
const ACTION_VERB_REGEX = /\b(achieved|improved|increased|decreased|developed|created|managed|led|delivered|implemented|optimized|designed|architected|built|launched|resolved|scaled|orchestrated|drove|initiated)\b/gi;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

  const industryKeywords = getIndustryKeywordSet(normalizedIndustry);
  const industryMatches = industryKeywords.filter((keyword) =>
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
    keywordDensity: atsEvaluation.keywordDensity,
  };

  return {
    overallScore,
    strengths: Array.from(strengths),
    weaknesses: Array.from(weaknesses),
    recommendations: Array.from(new Set(recommendations)),
    missingSkills,
    atsCompatibility: {
      score: atsEvaluation.score,
      issues: atsEvaluation.issues,
      suggestions: Array.from(new Set(baseSuggestions)),
      breakdown: atsEvaluation.breakdown,
    },
    keywordAnalysis,
    sectionAnalysis,
    industryAlignment: {
      score: clampValue(industryAlignmentScore, 0, 100),
      feedback: industryFeedback,
    },
  };
}
