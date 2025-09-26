import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getAdminDb();

    // Fetch all interview questions from Firebase
    const snapshot = await db.collection("interviewQuestions").orderBy("id").get();

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
      if (interviewQuestions[type]) {
        interviewQuestions[type].push(question);
      }
    });

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
        message: "No interview questions found in database. Run setup endpoint to populate questions.",
      });
    }

    return NextResponse.json({
      success: true,
      data: interviewQuestions,
    });
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview questions" },
      { status: 500 }
    );
  }
}
