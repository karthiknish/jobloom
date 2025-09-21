import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/jobs/stats/[userId] - Get job statistics for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

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

    // For now, return mock job stats
    // In a real implementation, this would fetch from Firestore
    const jobStats = {
      totalJobs: 0,
      sponsoredJobs: 0,
      totalApplications: 0,
      jobsToday: 0,
      recruitmentAgencyJobs: 0,
      byStatus: {
        "applied": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0
      }
    };

    return NextResponse.json(jobStats);
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}