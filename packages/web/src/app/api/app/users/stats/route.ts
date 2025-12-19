import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// GET /api/app/users/stats - Get user statistics (admin only)
export const GET = withApi({
  auth: 'admin',
}, async () => {
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

  return {
    totalUsers,
    newUsersLast30Days,
    activeUsersLast7Days,
    premiumUsers,
    timestamp: now
  };
});
