import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";

const db = getAdminDb();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const userId = auth.token.uid;

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
      analyticsTracking: true,
      dataSharing: false,
      marketingEmails: true,
      // Extension-specific preferences
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
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const userId = auth.token.uid;

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
    }

    // Validate preferences structure
    const validKeys = [
      'theme', 'language', 'timezone', 'emailNotifications', 'pushNotifications',
      'jobAlertsEnabled', 'jobKeywords', 'preferredCompanies', 'preferredLocations',
      'salaryRange', 'jobTypes', 'experienceLevels', 'industries',
      'analyticsTracking', 'dataSharing', 'marketingEmails',
      // Extension-specific preferences
      'ukFiltersEnabled', 'autoDetectJobs', 'showSponsorButton',
      'ageCategory', 'educationStatus', 'phdStatus', 'professionalStatus',
      'minimumSalary', 'jobCategories', 'locationPreference'
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
