import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";

export const runtime = "nodejs";

const preferencesSchema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
  goals: z
    .object({
      weeklyApplications: z.number().min(1).max(50),
      responseRate: z.number().min(0).max(100),
    })
    .optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  newsletter: z.boolean().optional(),
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
  language: 'en',
  timezone: 'UTC',
  goals: {
    weeklyApplications: 10,
    responseRate: 20,
  },
  emailNotifications: true,
  pushNotifications: false,
  newsletter: true,
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
  marketingEmails: false,
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

  const updateData: Record<string, unknown> = {
    preferences: {
      ...body.preferences,
      updatedAt: new Date(),
    },
  };

  // Keep legacy/other subsystems in sync:
  // Email sending routes and admin marketing tools currently rely on `emailPreferences.*`.
  const prefs = body.preferences ?? {};
  const emailPreferencesUpdate: Record<string, unknown> = {};

  if (typeof prefs.emailNotifications === 'boolean') {
    // Treat emailNotifications as a master switch for application-related emails.
    emailPreferencesUpdate.reminders = prefs.emailNotifications;
    emailPreferencesUpdate.weeklyDigest = prefs.emailNotifications;
    emailPreferencesUpdate.statusUpdates = prefs.emailNotifications;
  }
  if (typeof prefs.marketingEmails === 'boolean') {
    emailPreferencesUpdate.marketing = prefs.marketingEmails;
  }
  if (typeof (prefs as any).newsletter === 'boolean') {
    emailPreferencesUpdate.newsletter = (prefs as any).newsletter;
  }

  if (Object.keys(emailPreferencesUpdate).length > 0) {
    updateData.emailPreferences = {
      ...emailPreferencesUpdate,
      updatedAt: new Date().toISOString(),
    };
  }

  await db.collection('users').doc(user!.uid).set(updateData, { merge: true });

  return {
    success: true,
    message: 'Preferences updated successfully'
  };
});

export { OPTIONS } from "@/lib/api/withApi";
