import { getAdminDb } from "@/firebase/admin";
import { UserTier } from "@/types/api";
import { userCache, DEFAULT_CACHE_TTL_MS, cleanupCache, MAX_CACHE_SIZE } from "./auth-cache";

/**
 * Determines the user's tier (free, premium, admin) from their Firestore record.
 * Uses the same logic as the subscription status API for consistency.
 */
export async function getUserTier(uid: string): Promise<UserTier> {
  // Check cache first
  const cached = userCache.get(uid);
  if (cached && cached.expiresAt > Date.now() && cached.data?.tier) {
    return cached.data.tier as UserTier;
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return "free";
    }

    const userData = userDoc.data();
    let tier: UserTier = "free";

    if (userData?.isAdmin === true) {
      tier = "admin";
    } else if (userData?.subscriptionId) {
      // Check the subscription document for the most accurate status
      const subDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();
      if (subDoc.exists) {
        const subData = subDoc.data();
        // Only treat as premium if status is active
        if (subData?.status === "active" && subData?.plan === "premium") {
          tier = "premium";
        }
      }
    }

    // Fallback to userData.plan if subscription check didn't result in premium
    if (tier === "free" && userData?.plan === "premium") {
      tier = "premium";
    }

    // Update cache with the tier
    const existingData = cached?.data || {};
    userCache.set(uid, {
      data: { ...existingData, ...userData, tier },
      expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
    });

    if (userCache.size > MAX_CACHE_SIZE * 0.9) {
      cleanupCache();
    }

    return tier;
  } catch (error) {
    console.error("Error determining user tier:", error);
    return "free"; // Default to free on error
  }
}
