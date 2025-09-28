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
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Get user preferences from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Default preferences
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const preferences = {
      ...defaultPreferences,
      ...userData?.preferences
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
    }

    // Validate preferences structure
    const validKeys = [
      'theme', 'language', 'timezone', 'emailNotifications', 'pushNotifications',
      'jobAlertsEnabled', 'jobKeywords', 'preferredCompanies', 'preferredLocations',
      'salaryRange', 'jobTypes', 'experienceLevels', 'industries'
    ];

    const sanitizedPreferences: any = {};
    for (const key of validKeys) {
      if (preferences[key] !== undefined) {
        sanitizedPreferences[key] = preferences[key];
      }
    }

    // Update user preferences in Firestore
    await db.collection('users').doc(userId).update({
      preferences: {
        ...sanitizedPreferences,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
