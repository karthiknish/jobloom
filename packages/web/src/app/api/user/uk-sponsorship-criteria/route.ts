/**
 * UK Sponsorship Criteria API - Refactored with unified API wrapper
 * 
 * This demonstrates the new standardized pattern for API routes.
 * Benefits:
 * - Automatic CORS handling
 * - Consistent error responses
 * - Built-in authentication
 * - Standardized success response format
 */

import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";

// Export OPTIONS for CORS preflight
export { OPTIONS };

export const GET = withApi({
  auth: 'required',  // Authentication is required
  rateLimit: 'user-settings',  // Use user-settings rate limit tier
}, async ({ user }) => {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(user!.uid).get();
  const userData = userDoc.data();

  // Extract preferences
  const preferences = userData?.preferences || {};

  // Transform preferences into UK sponsorship criteria
  const criteria = {
    minimumSalary: preferences.minimumSalary || 38700, // UK default minimum
    isUnder26: preferences.ageCategory === 'student' || preferences.ageCategory === 'youngAdult',
    isRecentGraduate: preferences.educationStatus === 'bachelor' ||
                     preferences.educationStatus === 'master' ||
                     preferences.professionalStatus === 'entry-level',
    hasPhD: preferences.phdStatus === 'completed',
    isSTEMPhD: preferences.phdField === 'stem',
  };

  // Return data directly - wrapper handles success response formatting
  return {
    ...criteria,
    message: 'UK sponsorship criteria retrieved successfully',
  };
});
