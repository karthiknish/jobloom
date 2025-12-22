import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, getAdminStorage, getAdminAuth } from "@/firebase/admin";
import { ValidationError } from "@/lib/api/errorResponse";

export const runtime = "nodejs";

const deleteAccountSchema = z.object({
  confirmation: z.string(),
  reason: z.string().optional(),
});

function getStorageBucket() {
  const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  try {
    const storage = getAdminStorage();
    if (!storage) return null;
    return storageBucketName ? storage.bucket(storageBucketName) : storage.bucket();
  } catch (error) {
    console.warn("Firebase storage bucket unavailable:", error);
    return null;
  }
}

export const POST = withApi({
  auth: 'required',
  rateLimit: 'user-settings',
  bodySchema: deleteAccountSchema,
}, async ({ user, body }) => {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const userId = user!.uid;
  const { confirmation, reason } = body;

  if (confirmation !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
    throw new ValidationError(
      'Please confirm account deletion by typing "DELETE_MY_ACCOUNT_PERMANENTLY"',
      "confirmation"
    );
  }

  console.log(`Starting account deletion for user ${userId}, reason: ${reason || 'not provided'}`);

  const deletionPromises = [];
  const bucket = getStorageBucket();

  // 1. Delete CV analyses and files
  const cvAnalysesSnapshot = await db.collection('cvAnalyses').where('userId', '==', userId).get();
  for (const doc of cvAnalysesSnapshot.docs) {
    const analysisData = doc.data();
    if (analysisData.storagePath && bucket) {
      try {
        await bucket.file(analysisData.storagePath).delete();
      } catch (error) {
        console.warn(`Failed to delete file ${analysisData.storagePath}:`, error);
      }
    }
    deletionPromises.push(doc.ref.delete());
  }

  // 2. Delete applications
  const applicationsSnapshot = await db.collection('applications').where('userId', '==', userId).get();
  applicationsSnapshot.docs.forEach(doc => deletionPromises.push(doc.ref.delete()));

  // 3. Delete jobs
  const jobsSnapshot = await db.collection('jobs').where('userId', '==', userId).get();
  jobsSnapshot.docs.forEach(doc => deletionPromises.push(doc.ref.delete()));

  // 4. Delete subscriptions
  const subscriptionsSnapshot = await db.collection('subscriptions').where('userId', '==', userId).get();
  subscriptionsSnapshot.docs.forEach(doc => deletionPromises.push(doc.ref.delete()));

  // 5. Delete subcollections
  const subcollections = ['coverLetters', 'aiResumes'];
  for (const sub of subcollections) {
    const snapshot = await db.collection('users').doc(userId).collection(sub).get();
    snapshot.docs.forEach(doc => deletionPromises.push(doc.ref.delete()));
  }

  // 6. Delete user export files
  if (bucket) {
    try {
      const [files] = await bucket.getFiles({ prefix: `user-exports/${userId}/` });
      files.forEach(file => deletionPromises.push(file.delete()));
    } catch (error) {
      console.warn('Failed to list/delete user export files:', error);
    }
  }

  // 7. Delete user document
  deletionPromises.push(db.collection('users').doc(userId).delete());

  // Execute all deletions
  await Promise.allSettled(deletionPromises);

  // 8. Delete Firebase Auth user
  try {
    await auth.deleteUser(userId);
    console.log(`Successfully deleted Firebase Auth user ${userId}`);
  } catch (error) {
    console.error(`Failed to delete Firebase Auth user ${userId}:`, error);
  }

  return {
    success: true,
    message: 'Your account has been permanently deleted. All your data has been removed.'
  };
});

export { OPTIONS } from "@/lib/api/withApi";
