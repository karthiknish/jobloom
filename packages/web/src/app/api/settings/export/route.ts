import { getAdminDb, getAdminStorage } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

export { OPTIONS };

export const GET = withApi({
  auth: 'required',
}, async ({ user }) => {
  const db = getAdminDb();
  const userId = user!.uid;

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

  // Get AI-generated cover letters (stored in user subcollection)
  const coverLettersSnapshot = await db.collection('users')
    .doc(userId)
    .collection('coverLetters')
    .get();

  exportData.coverLetters = coverLettersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Get AI-generated resumes (stored in user subcollection)
  const aiResumesSnapshot = await db.collection('users')
    .doc(userId)
    .collection('aiResumes')
    .get();

  exportData.aiResumes = aiResumesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
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

  return {
    success: true,
    downloadUrl: signedUrl,
    filename,
    size: jsonContent.length,
    recordCounts: {
      jobs: exportData.jobs.length,
      applications: exportData.applications.length,
      cvAnalyses: exportData.cvAnalyses.length,
      coverLetters: exportData.coverLetters.length,
      aiResumes: exportData.aiResumes.length,
      subscriptions: exportData.subscriptions.length
    }
  };
});
