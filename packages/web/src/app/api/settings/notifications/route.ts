import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  jobAlertsEnabled: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  jobAlertFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
});

// GET /api/settings/notifications - Get user notification settings
export const GET = withApi({
  auth: "required",
}, async ({ user }) => {
  const db = getAdminDb();
  const userId = user!.uid;

  // Get user notification settings
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  const notificationSettings = {
    emailNotifications: userData?.preferences?.emailNotifications ?? true,
    pushNotifications: userData?.preferences?.pushNotifications ?? true,
    jobAlertsEnabled: userData?.preferences?.jobAlertsEnabled ?? false,
    marketingEmails: userData?.preferences?.marketingEmails ?? true,
    systemNotifications: userData?.preferences?.systemNotifications ?? true,
    weeklyDigest: userData?.preferences?.weeklyDigest ?? false,
    jobAlertFrequency: userData?.preferences?.jobAlertFrequency ?? 'daily'
  };

  return { notificationSettings };
});

// PUT /api/settings/notifications - Update user notification settings
export const PUT = withApi({
  auth: "required",
  bodySchema: z.object({
    notificationSettings: notificationSettingsSchema,
  }),
}, async ({ user, body }) => {
  const db = getAdminDb();
  const userId = user!.uid;
  const { notificationSettings } = body;

  // Update notification settings in Firestore
  const updateData: any = {};
  if (notificationSettings.emailNotifications !== undefined) updateData['preferences.emailNotifications'] = notificationSettings.emailNotifications;
  if (notificationSettings.pushNotifications !== undefined) updateData['preferences.pushNotifications'] = notificationSettings.pushNotifications;
  if (notificationSettings.jobAlertsEnabled !== undefined) updateData['preferences.jobAlertsEnabled'] = notificationSettings.jobAlertsEnabled;
  if (notificationSettings.marketingEmails !== undefined) updateData['preferences.marketingEmails'] = notificationSettings.marketingEmails;
  if (notificationSettings.systemNotifications !== undefined) updateData['preferences.systemNotifications'] = notificationSettings.systemNotifications;
  if (notificationSettings.weeklyDigest !== undefined) updateData['preferences.weeklyDigest'] = notificationSettings.weeklyDigest;
  if (notificationSettings.jobAlertFrequency !== undefined) updateData['preferences.jobAlertFrequency'] = notificationSettings.jobAlertFrequency;
  
  updateData['preferences.updatedAt'] = new Date();

  await db.collection('users').doc(userId).update(updateData);

  return {
    message: 'Notification settings updated successfully'
  };
});
