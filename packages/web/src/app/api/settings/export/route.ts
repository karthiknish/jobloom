import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, getAdminStorage } from "@/firebase/admin";
import { getStorage } from "firebase-admin/storage";

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

    // Initialize bucket only when needed
    const bucket = getAdminStorage().bucket();

    // Collect all user data
    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId,
      version: '1.0'
    };

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      exportData.user = {
        email: userData?.email,
        displayName: userData?.displayName,
        createdAt: userData?.createdAt,
        preferences: userData?.preferences,
        // Exclude sensitive data
        lastLogin: userData?.lastLogin
      };
    }

    // Get jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .get();

    exportData.jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Remove any sensitive data if needed
    }));

    // Get applications
    const applicationsSnapshot = await db.collection('applications')
      .where('userId', '==', userId)
      .get();

    exportData.applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get CV analyses
    const cvAnalysesSnapshot = await db.collection('cvAnalyses')
      .where('userId', '==', userId)
      .get();

    exportData.cvAnalyses = cvAnalysesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get subscription data
    const subscriptionSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    exportData.subscriptions = subscriptionSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create JSON file content
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create a unique filename
    const filename = `hireall-export-${userId}-${Date.now()}.json`;

    // Upload to Firebase Storage
    const file = bucket.file(`user-exports/${userId}/${filename}`);
    await file.save(jsonContent, {
      metadata: {
        contentType: 'application/json',
        metadata: {
          userId,
          exportDate: new Date().toISOString(),
          version: '1.0'
        }
      }
    });

    // Create a signed URL for download (valid for 1 hour)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      filename,
      size: jsonContent.length,
      recordCounts: {
        jobs: exportData.jobs.length,
        applications: exportData.applications.length,
        cvAnalyses: exportData.cvAnalyses.length,
        subscriptions: exportData.subscriptions.length
      }
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
