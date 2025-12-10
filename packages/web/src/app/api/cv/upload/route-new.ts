import { NextRequest } from "next/server";
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
import { validateFile, validateRequired, throwValidationError } from "@/lib/api/validation";

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
      } else {
        // Subscription exists but is not active
        plan = "free";
      }
    }

    // Check current usage
    const analysesQuery = await db
      .collection("cvAnalyses")
      .where("userId", "==", userId)
      .where("createdAt", ">=", Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
      .get();
    
    const currentUsage = analysesQuery.size;

    // Get limit based on plan
    const limit =
      plan === "unlimited"
        ? -1
        : SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS]
          .cvAnalysesPerMonth;

    return {
      allowed: limit === -1 || currentUsage < limit,
      plan,
      currentUsage,
      limit: limit === -1 ? -1 : limit,
    };
  } catch (error) {
    console.error("Error checking subscription limits:", error);
    throw handleDatabaseError("check subscription limits", error, { userId });
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

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Simplified AI analysis function
async function analyzeCvText(
  text: string,
  targetRole: string | null,
  industry: string | null,
  fileType: string
): Promise<any> {
  try {
    // Basic metrics extraction
    const wordCount = text.split(/\s+/).length;
    const actionVerbs = (text.match(ACTION_VERB_REGEX) || []).length;
    const metrics = (text.match(METRICS_REGEX) || []).length;
    
    // Industry keyword analysis
    let industryScore = 0;
    if (industry) {
      const industryKeywords = getKeywordsForIndustry(industry);
      const matchedCount = industryKeywords.filter((kw: string) => text.toLowerCase().includes(kw.toLowerCase())).length;
      industryScore = industryKeywords.length > 0 ? Math.min((matchedCount / industryKeywords.length) * 100, 100) : 0;
    }

    // ATS compatibility scoring
    const atsScore = evaluateAtsCompatibilityFromText({
      text,
      targetRole: '',
      industry: '',
      fileType: 'pdf'
    });

    return {
      wordCount,
      actionVerbs,
      metrics,
      industryScore,
      atsScore,
      fileType,
      targetRole,
      industry,
      analysisTimestamp: Timestamp.now(),
    };
  } catch (error) {
    console.error("Error in CV analysis:", error);
    throw new Error("Failed to analyze CV text");
  }
}

// Main API handler
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Authentication
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createAuthError("Authorization header required", ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.substring(7);
  const decodedToken = await verifyIdToken(token);

  if (!decodedToken?.uid) {
    throw createAuthError("Invalid authentication token", ERROR_CODES.INVALID_TOKEN);
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;
  const targetRole = formData.get("targetRole") as string;
  const industry = formData.get("industry") as string;

  console.log("CV Upload request received:", {
    file: file ? `${file.name} (${file.size} bytes)` : "null",
    userId: userId || "null",
    targetRole: targetRole || "null",
    industry: industry || "null",
  });

  // Validate required fields
  const fileValidation = validateFile(file, {
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    field: "file"
  });

  const userIdValidation = validateRequired(userId, "userId", "User ID");
  
  throwValidationError(combineValidationResults(fileValidation, userIdValidation));

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
    throw createValidationError("Invalid input data", undefined, { validationErrors: errors });
  }

  const sanitizedTargetRole = typeof sanitized.targetRole === "string" ? sanitized.targetRole : "";
  const sanitizedIndustry = typeof sanitized.industry === "string" ? sanitized.industry : "";

  // Check subscription limits
  const limitCheck = await checkSubscriptionLimits(userId);
  if (!limitCheck.allowed) {
    throw createRateLimitError(
      30 * 24 * 60 * 60, // 30 days in seconds
      `CV analysis limit reached. You've used ${limitCheck.currentUsage} of ${limitCheck.limit === -1 ? 'unlimited' : limitCheck.limit} analyses this month.`
    );
  }

  // Get upload limits based on user's subscription plan
  const uploadLimits = await getUploadLimitsForUser(userId);
  console.log(`Upload limits for user ${userId}:`, uploadLimits);

  // Validate file upload with dynamic limits
  const fileValidationWithLimits = validateFileUploadWithLimits(file, uploadLimits);

  if (!fileValidationWithLimits.valid) {
    SecurityLogger.logSecurityEvent({
      type: 'invalid_input',
      userId: decodedToken?.uid || 'unknown',
      details: {
        error: fileValidationWithLimits.error,
        errorType: fileValidationWithLimits.errorType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadLimits
      },
      severity: 'medium'
    });

    throw handleFileUploadError({
      code: fileValidationWithLimits.errorType,
      message: fileValidationWithLimits.error
    }, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
  }

  try {
    // Generate analysis ID
    const analysisId = db.collection("cvAnalyses").doc().id;

    // Create analysis record
    await db.collection("cvAnalyses").doc(analysisId).set({
      userId: decodedToken?.uid || 'unknown',
      userIdProvided: userId,
      originalFileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      targetRole: sanitizedTargetRole,
      industry: sanitizedIndustry,
      analysisStatus: "processing",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Process file asynchronously
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Start analysis in background
    performCvAnalysis(analysisId, buffer, file.type, sanitizedTargetRole, sanitizedIndustry).catch((error) => {
      console.error("Background analysis failed:", error);
    });

    return createSuccessResponse(
      {
        analysisId,
        status: "processing",
        message: "CV upload successful. Analysis is in progress.",
        fileName: file.name,
        fileSize: file.size,
        targetRole: sanitizedTargetRole,
        industry: sanitizedIndustry,
      },
      "CV uploaded successfully"
    );

  } catch (error) {
    console.error("Error processing CV upload:", error);
    throw handleDatabaseError("process CV upload", error, {
      userId: decodedToken?.uid || 'unknown',
      fileName: file.name,
      fileSize: file.size
    });
  }
});

// Helper function to combine validation results
function combineValidationResults(...results: any[]): any {
  const allErrors = results.flatMap(result => result.errors || []);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}
