import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";

const db = getAdminDb();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // In development with mock tokens, return mock notification settings for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({
        emailNotifications: true,
        pushNotifications: true,
        jobAlertsEnabled: false,
        marketingEmails: true,
        systemNotifications: true,
        weeklyDigest: false,
        message: 'Notification settings retrieved successfully (mock)'
      });
    }

    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

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

    return NextResponse.json({ notificationSettings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // In development with mock tokens, return mock success response for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({
        success: true,
        message: 'Notification settings updated successfully (mock)'
      });
    }

    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const body = await request.json();
    const { notificationSettings } = body;

    if (!notificationSettings || typeof notificationSettings !== 'object') {
      return NextResponse.json({ error: 'Invalid notification settings' }, { status: 400 });
    }

    // Validate settings
    const validSettings = [
      'emailNotifications', 'pushNotifications', 'jobAlertsEnabled',
      'marketingEmails', 'systemNotifications', 'weeklyDigest', 'jobAlertFrequency'
    ];

    const sanitizedSettings: any = {};
    for (const key of validSettings) {
      if (notificationSettings[key] !== undefined) {
        // Type validation
        if (typeof notificationSettings[key] === 'boolean') {
          sanitizedSettings[key] = notificationSettings[key];
        } else if (key === 'jobAlertFrequency' && typeof notificationSettings[key] === 'string') {
          const validFrequencies = ['immediate', 'daily', 'weekly'];
          if (validFrequencies.includes(notificationSettings[key])) {
            sanitizedSettings[key] = notificationSettings[key];
          }
        }
      }
    }

    // Update notification settings in Firestore
    await db.collection('users').doc(userId).update({
      'preferences.emailNotifications': sanitizedSettings.emailNotifications,
      'preferences.pushNotifications': sanitizedSettings.pushNotifications,
      'preferences.jobAlertsEnabled': sanitizedSettings.jobAlertsEnabled,
      'preferences.marketingEmails': sanitizedSettings.marketingEmails,
      'preferences.systemNotifications': sanitizedSettings.systemNotifications,
      'preferences.weeklyDigest': sanitizedSettings.weeklyDigest,
      'preferences.jobAlertFrequency': sanitizedSettings.jobAlertFrequency,
      'preferences.updatedAt': new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
