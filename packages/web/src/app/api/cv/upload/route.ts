import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const config: any = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  };

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  admin.initializeApp(config);
}

const db = getFirestore();

// POST /api/cv/upload - Upload and analyze CV
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const targetRole = formData.get("targetRole") as string;
    const industry = formData.get("industry") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
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

    // Upload file to Firebase Storage
    const bucket = getStorage().bucket();
    const fileRef = bucket.file(`cv-uploads/${userId}/${fileName}`);
    const buffer = Buffer.from(await file.arrayBuffer());

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
  } catch (error) {
    console.error("Error uploading CV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
