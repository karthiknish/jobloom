import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// GET /api/app/users/stats - Get user statistics (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const db = getAdminDb();
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let newUsersLast30Days = 0;
    let activeUsersLast7Days = 0;
    let premiumUsers = 0;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Date ? data.createdAt.getTime() : data.createdAt;
      const lastLoginAt = data.lastLoginAt instanceof Date ? data.lastLoginAt.getTime() : data.lastLoginAt;

      if (createdAt && createdAt > thirtyDaysAgo) {
        newUsersLast30Days++;
      }

      if (lastLoginAt && lastLoginAt > sevenDaysAgo) {
        activeUsersLast7Days++;
      }

      const isPremiumActive = data.subscriptionStatus === 'active';
      const isLegacyPremium = !data.subscriptionStatus && data.subscriptionPlan === 'premium';
      if (isPremiumActive || isLegacyPremium) {
        premiumUsers++;
      }
    });

    return NextResponse.json({
      totalUsers,
      newUsersLast30Days,
      activeUsersLast7Days,
      premiumUsers,
      timestamp: now
    });
  }, {
    endpoint: '/api/app/users/stats',
    method: 'GET',
    requestId
  });
}
