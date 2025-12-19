import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";

export const runtime = "nodejs";

const preferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  jobAlertsEnabled: z.boolean().optional(),
  jobKeywords: z.array(z.string()).optional(),
  preferredCompanies: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  salaryRange: z.record(z.string(), z.any()).optional(),
  jobTypes: z.array(z.string()).optional(),
  experienceLevels: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  analyticsTracking: z.boolean().optional(),
  dataSharing: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  ukFiltersEnabled: z.boolean().optional(),
  autoDetectJobs: z.boolean().optional(),
  showSponsorButton: z.boolean().optional(),
  ageCategory: z.string().optional(),
  educationStatus: z.string().optional(),
  phdStatus: z.string().optional(),
  professionalStatus: z.string().optional(),
  minimumSalary: z.number().optional(),
  jobCategories: z.array(z.string()).optional(),
  locationPreference: z.string().optional(),
});

const defaultPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  jobAlertsEnabled: false,
  jobKeywords: [],
  preferredCompanies: [],
  preferredLocations: [],
  salaryRange: {},
  jobTypes: [],
  experienceLevels: [],
  industries: [],
  analyticsTracking: true,
  dataSharing: false,
  marketingEmails: true,
  ukFiltersEnabled: false,
  autoDetectJobs: true,
  showSponsorButton: true,
  ageCategory: 'adult',
  educationStatus: 'none',
  phdStatus: 'none',
  professionalStatus: 'none',
  minimumSalary: 38700,
  jobCategories: [],
  locationPreference: 'uk',
};

export const GET = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
}, async ({ user }) => {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(user!.uid).get();
  const userData = userDoc.data();

  const preferences = {
    ...defaultPreferences,
    ...userData?.preferences
  };

  return { preferences };
});

export const PUT = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
  bodySchema: z.object({
    preferences: preferencesSchema,
  }),
}, async ({ user, body }) => {
  const db = getAdminDb();
  
  await db.collection('users').doc(user!.uid).set({
    preferences: {
      ...body.preferences,
      updatedAt: new Date()
    }
  }, { merge: true });

  return {
    success: true,
    message: 'Preferences updated successfully'
  };
});

export { OPTIONS } from "@/lib/api/withApi";
