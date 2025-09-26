import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, getAdminStorage } from "@/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";
import { SUBSCRIPTION_LIMITS } from "@/types/api";

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
        admin.firestore.Timestamp.fromDate(startOfMonth)
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
      return NextResponse.json(
        { error: "Missing file or userId", received: { file: !!file, userId: !!userId } },
        { status: 400 }
      );
    }

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

    // Validate file type and size
    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and TXT files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.type === "application/pdf" ? "pdf" : "txt";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

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
      fileName: file.name,
      fileSize: file.size,
      storagePath: `cv-uploads/${userId}/${fileName}`,
      targetRole: targetRole || null,
      industry: industry || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        targetRole,
        industry
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
  targetRole: string,
  industry: string
) {
  try {
    // Extract text from file (simplified)
    const text = fileType === "application/pdf"
      ? await extractTextFromPDF(fileBuffer)
      : fileBuffer.toString();

    // Perform AI analysis (simplified mock analysis)
    const analysis = await analyzeCvText(text, targetRole, industry);

    // Update the analysis record
    await db.collection("cvAnalyses").doc(analysisId).update({
      ...analysis,
      analysisStatus: "completed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error("Error performing CV analysis:", error);
    await db.collection("cvAnalyses").doc(analysisId).update({
      analysisStatus: "failed",
      errorMessage: "Analysis failed due to technical error",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// Mock text extraction from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // In a real implementation, you would use a PDF parsing library like pdf-parse
  return "Sample CV text extracted from PDF. This is a placeholder.";
}

// Mock CV analysis
async function analyzeCvText(text: string, targetRole: string, industry: string) {
  // In a real implementation, this would call an AI service like OpenAI, Anthropic, etc.

  // Mock analysis results
  const overallScore = Math.floor(Math.random() * 40) + 60; // 60-100

  const strengths = [
    "Strong professional summary",
    "Relevant work experience",
    "Good use of action verbs",
    "Clear career progression"
  ];

  const weaknesses = [
    "Missing quantifiable achievements",
    "Generic objective statement",
    "Lack of industry-specific keywords"
  ];

  const recommendations = [
    "Add specific metrics to achievements",
    "Tailor resume for target role",
    "Include relevant keywords from job description",
    "Add professional certifications"
  ];

  const missingSkills = [
    "Project Management",
    "Data Analysis",
    "Leadership",
    "Communication"
  ];

  const atsCompatibility = {
    score: Math.floor(Math.random() * 40) + 60,
    issues: [
      "Complex formatting may confuse ATS",
      "Missing standard section headers"
    ],
    suggestions: [
      "Use standard fonts and formatting",
      "Include clear section headers",
      "Avoid tables and graphics"
    ]
  };

  const keywordAnalysis = {
    presentKeywords: ["JavaScript", "React", "Node.js", "SQL"],
    missingKeywords: ["TypeScript", "AWS", "Docker", "Kubernetes"],
    keywordDensity: 2.5
  };

  const sectionAnalysis = {
    hasSummary: true,
    hasExperience: true,
    hasEducation: true,
    hasSkills: true,
    hasContact: true,
    missingsections: []
  };

  const industryAlignment = {
    score: Math.floor(Math.random() * 30) + 70,
    feedback: `Well-aligned for ${industry} industry with relevant experience and skills.`
  };

  return {
    overallScore,
    strengths,
    weaknesses,
    recommendations,
    missingSkills,
    atsCompatibility,
    keywordAnalysis,
    sectionAnalysis,
    industryAlignment,
  };
}
