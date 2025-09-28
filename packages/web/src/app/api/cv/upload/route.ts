import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, getAdminStorage } from "@/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";
import { SUBSCRIPTION_LIMITS } from "@/types/api";
import {
  validateFileUpload,
  sanitizeFileName,
  sanitizeString,
  SecurityLogger,
  validateAndSanitizeFormData
} from "@/utils/security";

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

    const sanitizedTargetRole = sanitized.targetRole;
    const sanitizedIndustry = sanitized.industry;

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
        sanitizedTargetRole,
        sanitizedIndustry
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

// Mock CV analysis with deterministic ATS scoring
async function analyzeCvText(text: string, targetRole: string, industry: string) {
  // In a real implementation, this would call an AI service like OpenAI, Anthropic, etc.

  // Analyze CV content for ATS compatibility
  const atsScore = calculateAtsScore(text, targetRole, industry);
  const overallScore = calculateOverallScore(text, atsScore);

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
    score: atsScore,
    issues: calculateAtsIssues(text),
    suggestions: calculateAtsSuggestions(text, atsScore)
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
    score: calculateIndustryAlignmentScore(text, industry),
    feedback: generateIndustryAlignmentFeedback(text, industry)
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

// Helper function to calculate ATS compatibility score based on CV content
function calculateAtsScore(text: string, targetRole: string, industry: string): number {
  let score = 60; // Base score

  // Check for ATS-friendly formatting
  const hasStandardSections = /\b(experience|education|skills|summary|objective)\b/i.test(text);
  if (hasStandardSections) score += 10;

  // Check for contact information
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
  if (hasEmail && hasPhone) score += 8;

  // Check for standard fonts and formatting (no fancy formatting)
  const hasSimpleFormatting = !text.includes('•') && !text.includes('■') && !text.includes('→');
  if (hasSimpleFormatting) score += 5;

  // Check for appropriate file format (PDF is ATS-friendly)
  const hasPdfStructure = text.includes('PDF') || text.includes('Portable Document Format');
  if (hasPdfStructure) score += 5;

  // Role-specific keyword matching
  const roleKeywords = getRoleKeywords(targetRole);
  const foundKeywords = roleKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  const keywordScore = Math.min((foundKeywords.length / roleKeywords.length) * 15, 15);
  score += keywordScore;

  return Math.min(Math.max(score, 0), 100);
}

// Helper function to calculate overall CV score based on ATS score and content quality
function calculateOverallScore(text: string, atsScore: number): number {
  let score = atsScore * 0.4; // ATS compatibility is 40% of overall score

  // Content quality factors (60% of score)
  const contentScore = calculateContentQualityScore(text);
  score += contentScore * 0.6;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Calculate content quality score based on CV structure and content
function calculateContentQualityScore(text: string): number {
  let score = 0;

  // Check for professional summary/objective
  const hasSummary = /\b(summary|objective|profile|about)\b/i.test(text);
  if (hasSummary) score += 15;

  // Check for quantifiable achievements
  const hasQuantifiableAchievements = /\b\d+%|\b\d+x|\$\d+|\b\d+\s+(customers?|clients?|users?|projects?|years?)\b/i.test(text);
  if (hasQuantifiableAchievements) score += 20;

  // Check for action verbs
  const actionVerbs = /\b(achieved|improved|increased|decreased|developed|created|managed|led|delivered|implemented|optimized|designed)\b/i;
  const actionVerbCount = (text.match(actionVerbs) || []).length;
  const actionVerbScore = Math.min(actionVerbCount * 2, 15);
  score += actionVerbScore;

  // Check for skills section
  const hasSkillsSection = /\b(skills|competencies|expertise|proficiencies)\b/i.test(text);
  if (hasSkillsSection) score += 10;

  // Check for education section
  const hasEducation = /\b(education|degree|university|college|bachelor|master|phd|certification)\b/i.test(text);
  if (hasEducation) score += 10;

  // Check for work experience
  const hasExperience = /\b(experience|employment|work|career|position|role)\b/i.test(text);
  if (hasExperience) score += 15;

  // Check for proper formatting and structure
  const hasProperStructure = text.split('\n').length > 10; // Multiple lines indicate structure
  if (hasProperStructure) score += 10;

  // Check for industry-specific terms
  const hasIndustryTerms = /\b(leadership|management|strategy|analysis|development|implementation|optimization)\b/i.test(text);
  if (hasIndustryTerms) score += 5;

  return Math.min(score, 100);
}

// Get role-specific keywords for ATS scoring
function getRoleKeywords(targetRole: string): string[] {
  const roleKeywordMap: Record<string, string[]> = {
    'software engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Agile', 'API', 'REST', 'MongoDB'],
    'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'TensorFlow', 'Tableau', 'Hadoop', 'Spark'],
    'product manager': ['Product Strategy', 'Roadmap', 'Analytics', 'User Experience', 'A/B Testing', 'Stakeholder', 'KPI', 'Agile', 'Scrum'],
    'marketing': ['SEO', 'SEM', 'Social Media', 'Content Marketing', 'Google Analytics', 'CRM', 'Lead Generation', 'Campaign', 'Brand'],
    'sales': ['CRM', 'Lead Generation', 'Pipeline', 'Revenue', 'Quota', 'Negotiation', 'Relationship', 'Prospecting', 'Closing'],
    'designer': ['Figma', 'Adobe Creative Suite', 'User Experience', 'Prototyping', 'Wireframes', 'Visual Design', 'Typography', 'Color Theory'],
    'default': ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Project Management', 'Time Management', 'Organization']
  };

  return roleKeywordMap[targetRole.toLowerCase()] || roleKeywordMap['default'];
}

// Calculate ATS compatibility issues based on CV content
function calculateAtsIssues(text: string): string[] {
  const issues: string[] = [];

  if (!/\b(experience|education|skills|summary|objective)\b/i.test(text)) {
    issues.push("Missing standard section headers");
  }

  if (text.includes('•') || text.includes('■') || text.includes('→')) {
    issues.push("Complex formatting may confuse ATS");
  }

  if (!/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
    issues.push("Missing or unclear contact information");
  }

  if (!/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
    issues.push("Missing phone number");
  }

  if (text.length < 1000) {
    issues.push("CV content may be too brief for ATS evaluation");
  }

  return issues;
}

// Calculate ATS suggestions based on score and content
function calculateAtsSuggestions(text: string, score: number): string[] {
  const suggestions: string[] = [];

  if (score < 70) {
    suggestions.push("Use standard fonts (Arial, Calibri, Times New Roman)");
  }

  if (score < 75) {
    suggestions.push("Include clear section headers (Experience, Education, Skills)");
  }

  if (score < 80) {
    suggestions.push("Avoid tables, graphics, and complex formatting");
  }

  if (score < 85) {
    suggestions.push("Add relevant keywords from the job description");
  }

  if (score < 90) {
    suggestions.push("Include quantifiable achievements and metrics");
  }

  return suggestions;
}

// Calculate industry alignment score based on CV content and target industry
function calculateIndustryAlignmentScore(text: string, industry: string): number {
  let score = 60; // Base score

  // Industry-specific keyword matching
  const industryKeywords = getIndustryKeywords(industry);
  const foundKeywords = industryKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  const keywordScore = Math.min((foundKeywords.length / industryKeywords.length) * 25, 25);
  score += keywordScore;

  // Check for industry-specific achievements and experience
  const hasIndustryAchievements = /\b(managed|led|directed|oversaw|coordinated|executed|implemented)\s+\w+\s+(team|project|initiative|program|strategy|campaign)\b/i.test(text);
  if (hasIndustryAchievements) score += 10;

  // Check for relevant certifications or qualifications
  const hasRelevantQualifications = /\b(certified|certification|license|credential|qualified|accredited)\b/i.test(text);
  if (hasRelevantQualifications) score += 5;

  // Check for industry-specific tools and technologies
  const hasIndustryTools = /\b(software|platform|system|tool|technology|framework|methodology)\b/i.test(text);
  if (hasIndustryTools) score += 5;

  return Math.min(Math.max(score, 0), 100);
}

// Generate industry-specific feedback based on CV content
function generateIndustryAlignmentFeedback(text: string, industry: string): string {
  const industryKeywords = getIndustryKeywords(industry);
  const foundKeywords = industryKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  if (foundKeywords.length >= industryKeywords.length * 0.8) {
    return `Excellent alignment with ${industry} industry. Strong use of industry-specific terminology and relevant experience.`;
  } else if (foundKeywords.length >= industryKeywords.length * 0.5) {
    return `Good alignment with ${industry} industry. Consider adding more industry-specific keywords and examples.`;
  } else {
    return `Moderate alignment with ${industry} industry. Include more relevant industry terms and demonstrate experience in this sector.`;
  }
}

// Get industry-specific keywords for alignment scoring
function getIndustryKeywords(industry: string): string[] {
  const industryKeywordMap: Record<string, string[]> = {
    'technology': ['Software Development', 'Agile', 'Scrum', 'DevOps', 'Cloud Computing', 'API', 'Database', 'Programming', 'Testing', 'Deployment'],
    'finance': ['Financial Analysis', 'Risk Management', 'Portfolio Management', 'Investment', 'Banking', 'Compliance', 'Audit', 'Financial Modeling', 'Budgeting', 'Forecasting'],
    'healthcare': ['Patient Care', 'Medical Records', 'HIPAA', 'Clinical', 'Healthcare Policy', 'Medical Terminology', 'Treatment', 'Diagnosis', 'Healthcare Management', 'Quality Improvement'],
    'marketing': ['Digital Marketing', 'SEO', 'SEM', 'Social Media', 'Content Strategy', 'Brand Management', 'Market Research', 'Campaign Management', 'Analytics', 'Lead Generation'],
    'sales': ['Sales Strategy', 'Customer Relationship', 'Pipeline Management', 'Revenue Growth', 'Negotiation', 'Prospecting', 'Closing', 'Account Management', 'Sales Forecasting', 'CRM'],
    'education': ['Curriculum Development', 'Instructional Design', 'Assessment', 'Student Learning', 'Educational Technology', 'Classroom Management', 'Differentiated Instruction', 'Professional Development', 'Learning Outcomes', 'Educational Leadership'],
    'consulting': ['Strategic Planning', 'Business Analysis', 'Process Improvement', 'Change Management', 'Stakeholder Management', 'Project Management', 'Business Development', 'Client Relations', 'Problem Solving', 'Data Analysis'],
    'default': ['Professional Experience', 'Industry Knowledge', 'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management', 'Strategic Thinking', 'Results-Oriented', 'Customer Focus']
  };

  return industryKeywordMap[industry.toLowerCase()] || industryKeywordMap['default'];
}
