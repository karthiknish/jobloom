import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";

// Industry types
const INDUSTRIES = [
  "general",
  "technology",
  "finance",
  "healthcare",
  "marketing",
  "consulting",
  "data-science",
] as const;

type Industry = (typeof INDUSTRIES)[number];

export async function GET(request: NextRequest) {
  try {
    let decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.substring(7);
      decodedToken = await verifyIdToken(token);

      if (!decodedToken) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const industryFilter = searchParams.get("industry") as Industry | null;

    const db = getAdminDb();

    // Build query - fetch all questions or filter by industry
    let queryRef = db.collection("interviewQuestions").orderBy("id");
    
    // If industry filter is provided, we'll filter after fetching
    // (Firestore doesn't support OR queries for "general" + specific industry)
    const snapshot = await queryRef.get();

    // Organize questions by type
    const interviewQuestions: Record<string, any[]> = {
      behavioral: [],
      technical: [],
      situational: [],
      leadership: [],
      systemDesign: [],
      productSense: [],
    };

    snapshot.forEach((doc) => {
      const question = doc.data();
      const type = question.type;
      
      // Apply industry filter if provided
      // Include questions that match the filter OR are "general"
      if (industryFilter) {
        const questionIndustry = question.industry || "general";
        if (questionIndustry !== industryFilter && questionIndustry !== "general") {
          return; // Skip this question
        }
      }
      
      if (interviewQuestions[type]) {
        interviewQuestions[type].push(question);
      }
    });

    // Calculate counts per category
    const categoryCounts: Record<string, number> = {};
    for (const [type, questions] of Object.entries(interviewQuestions)) {
      categoryCounts[type] = questions.length;
    }

    // If no questions in database, return empty structure
    const hasQuestions = Object.values(interviewQuestions).some(arr => arr.length > 0);

    if (!hasQuestions) {
      return NextResponse.json({
        success: true,
        data: {
          behavioral: [],
          technical: [],
          situational: [],
          leadership: [],
          systemDesign: [],
          productSense: [],
        },
        industries: INDUSTRIES,
        selectedIndustry: industryFilter || "all",
        message: "No interview questions found. Run setup endpoint to populate questions.",
      });
    }

    return NextResponse.json({
      success: true,
      data: interviewQuestions,
      industries: INDUSTRIES,
      selectedIndustry: industryFilter || "all",
      categoryCounts,
      totalQuestions: Object.values(categoryCounts).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview questions" },
      { status: 500 }
    );
  }
}

