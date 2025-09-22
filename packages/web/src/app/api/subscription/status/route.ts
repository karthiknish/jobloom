import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import * as admin from "firebase-admin";
import { SUBSCRIPTION_LIMITS } from "@/types/api";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/subscription/status - Get current subscription status
export async function GET(request: NextRequest) {
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

    const userId = decodedToken.uid;

    // Get user record
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    let subscription = null;
    let plan = "free";
    let limits = SUBSCRIPTION_LIMITS.free;

    if (userData?.subscriptionId) {
      const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();
      subscription = subscriptionDoc.data();

      if (subscription?.status === "active" && subscription?.plan) {
        plan = subscription.plan;
        limits = SUBSCRIPTION_LIMITS[subscription.plan as keyof typeof SUBSCRIPTION_LIMITS];
      }
    }

    // Get current usage for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // CV analyses usage
    const cvAnalysesQuery = await db.collection("cvAnalyses")
      .where("userId", "==", userId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
      .get();

    // Application usage (simplified - just count total for now)
    const applicationsQuery = await db.collection("applications")
      .where("userId", "==", userId)
      .get();

    const currentUsage = {
      cvAnalyses: cvAnalysesQuery.size,
      applications: applicationsQuery.size,
    };

    return NextResponse.json({
      subscription,
      plan,
      limits,
      currentUsage,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
