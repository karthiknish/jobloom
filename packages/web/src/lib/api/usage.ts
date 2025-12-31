import { getAdminDb, Timestamp } from "@/firebase/admin";
import { SUBSCRIPTION_LIMITS } from "@hireall/shared";
import { RateLimitError } from "@/lib/api/errorResponse";

/**
 * Service to track and enforce subscription-based feature usage limits.
 */
export class UsageService {
  /**
   * Checks if a user has exceeded their monthly limit for a specific feature.
   * Throws a RateLimitError if the limit is reached.
   * 
   * @param userId The ID of the user to check
   * @param featureKey The limit key from SUBSCRIPTION_LIMITS (e.g., 'applicationsPerMonth')
   */
  static async checkFeatureLimit(
    userId: string,
    featureKey: 'cvAnalysesPerMonth' | 'applicationsPerMonth' | 'aiGenerationsPerMonth'
  ): Promise<void> {
    const db = getAdminDb();

    const { limits, plan, isAdmin } = await this.getSubscriptionLimits(userId);

    // Admins have no limits
    if (isAdmin) {
      return;
    }

    const limit = (SUBSCRIPTION_LIMITS[plan] as any)[featureKey];

    // Unlimited
    if (limit === -1) {
      return;
    }

    // 2. Count current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

    let currentUsage = 0;

    if (featureKey === 'applicationsPerMonth') {
      const snapshot = await db.collection("applications")
        .where("userId", "==", userId)
        .where("createdAt", ">=", startOfMonthTimestamp)
        .get();
      currentUsage = snapshot.size;
    } else if (featureKey === 'cvAnalysesPerMonth') {
      const snapshot = await db.collection("cvAnalyses")
        .where("userId", "==", userId)
        .where("createdAt", ">=", startOfMonthTimestamp)
        .get();
      currentUsage = snapshot.size;
    } else if (featureKey === 'aiGenerationsPerMonth') {
      const [coverLetters, aiResumes] = await Promise.all([
        db.collection("users").doc(userId).collection("coverLetters")
          .where("createdAt", ">=", startOfMonth.toISOString())
          .get(),
        db.collection("users").doc(userId).collection("aiResumes")
          .where("createdAt", ">=", startOfMonth.toISOString())
          .get()
      ]);
      currentUsage = coverLetters.size + aiResumes.size;
    }

    // 3. Enforce limit
    if (currentUsage >= limit) {
      const featureNames = {
        'applicationsPerMonth': 'Applications',
        'cvAnalysesPerMonth': 'Resume Analyses',
        'aiGenerationsPerMonth': 'AI Document Generations'
      };
      const featureName = featureNames[featureKey];
      throw new RateLimitError(
        `${featureName} limit reached for your ${plan} plan. You've used ${currentUsage} of ${limit} this month.`,
        3600 // Suggest retry after 1 hour (though it resets monthly)
      );
    }
  }

  /**
   * Utility to get current usage stats for a user
   */
  static async getMonthlyUsage(userId: string) {
    const db = getAdminDb();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

    const [applications, cvAnalyses, coverLetters, aiResumes] = await Promise.all([
      db.collection("applications")
        .where("userId", "==", userId)
        .where("createdAt", ">=", startOfMonthTimestamp)
        .get(),
      db.collection("cvAnalyses")
        .where("userId", "==", userId)
        .where("createdAt", ">=", startOfMonthTimestamp)
        .get(),
      db.collection("users").doc(userId).collection("coverLetters")
        .where("createdAt", ">=", startOfMonth.toISOString())
        .get(),
      db.collection("users").doc(userId).collection("aiResumes")
        .where("createdAt", ">=", startOfMonth.toISOString())
        .get()
    ]);

    return {
      applications: applications.size,
      cvAnalyses: cvAnalyses.size,
      aiGenerations: coverLetters.size + aiResumes.size
    };
  }

  /**
   * Checks if a specific export format is allowed for the user's plan.
   * 
   * @param userId The ID of the user to check
   * @param format The format to validate (e.g., 'csv', 'json', 'pdf')
   */
  static async isFormatAllowed(userId: string, format: string): Promise<boolean> {
    const { limits, isAdmin } = await this.getSubscriptionLimits(userId);
    
    if (isAdmin) return true;
    
    return limits.exportFormats.includes(format.toLowerCase());
  }

  /**
   * Internal helper to resolve user plan and its limits
   */
  static async getSubscriptionLimits(userId: string): Promise<{
    plan: 'free' | 'premium';
    limits: typeof SUBSCRIPTION_LIMITS['free' | 'premium'];
    isAdmin: boolean;
  }> {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const isAdmin = userData?.isAdmin === true;
    let plan: 'free' | 'premium' = 'free';

    if (userData?.subscriptionId) {
      const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();
      const subscriptionData = subscriptionDoc.data();

      if (subscriptionData?.status === "active" && subscriptionData?.plan) {
        plan = subscriptionData.plan;
      }
    }

    // Fallback if userData has plan but no active subscription record found
    if (plan === "free" && userData?.plan === "premium") {
      plan = "premium";
    }

    return {
      plan,
      limits: SUBSCRIPTION_LIMITS[plan] as typeof SUBSCRIPTION_LIMITS['free' | 'premium'],
      isAdmin
    };
  }
}
