import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, getAdminStorage } from "@/firebase/admin";
import { getAuth } from "firebase-admin/auth";

const db = getAdminDb();
const auth = getAuth();
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

function getStorageBucket() {
  try {
    const storage = getAdminStorage();
    if (!storage) {
      return null;
    }

    if (storageBucketName) {
      return storage.bucket(storageBucketName);
    }

    return storage.bucket();
  } catch (error) {
    console.warn("Firebase storage bucket unavailable:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
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
    const { confirmation, reason } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
      return NextResponse.json({
        error: 'Please confirm account deletion by typing "DELETE_MY_ACCOUNT_PERMANENTLY"'
      }, { status: 400 });
    }

    console.log(`Starting account deletion for user ${userId}, reason: ${reason || 'not provided'}`);

    // Delete user data in order (most important first)
    const deletionPromises = [];

    // 1. Delete CV analyses and files
    const bucket = getStorageBucket();

    const cvAnalysesSnapshot = await db.collection('cvAnalyses')
      .where('userId', '==', userId)
      .get();

    for (const doc of cvAnalysesSnapshot.docs) {
      const analysisData = doc.data();
      if (analysisData.storagePath && bucket) {
        // Delete file from storage
        try {
          const file = bucket.file(analysisData.storagePath);
          await file.delete();
        } catch (error) {
          console.warn(`Failed to delete file ${analysisData.storagePath}:`, error);
        }
      } else if (analysisData.storagePath && !bucket) {
        console.warn("Skipping storage delete because no bucket is configured", analysisData.storagePath);
      }
      deletionPromises.push(doc.ref.delete());
    }

    // 2. Delete applications
    const applicationsSnapshot = await db.collection('applications')
      .where('userId', '==', userId)
      .get();

    applicationsSnapshot.docs.forEach(doc => {
      deletionPromises.push(doc.ref.delete());
    });

    // 3. Delete jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .get();

    jobsSnapshot.docs.forEach(doc => {
      deletionPromises.push(doc.ref.delete());
    });

    // 4. Delete subscriptions
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    subscriptionsSnapshot.docs.forEach(doc => {
      deletionPromises.push(doc.ref.delete());
    });

    // 5. Delete user export files
    if (bucket) {
      try {
        const [files] = await bucket.getFiles({ prefix: `user-exports/${userId}/` });
        files.forEach(file => {
          deletionPromises.push(file.delete());
        });
      } catch (error) {
        console.warn('Failed to list/delete user export files:', error);
      }
    } else {
      console.warn('Skipping export file cleanup; no Firebase storage bucket configured.');
    }

    // 6. Delete user document
    deletionPromises.push(db.collection('users').doc(userId).delete());

    // Execute all deletions
    await Promise.allSettled(deletionPromises);

    // 7. Delete Firebase Auth user (this will sign them out everywhere)
    try {
      await auth.deleteUser(userId);
      console.log(`Successfully deleted Firebase Auth user ${userId}`);
    } catch (error) {
      console.error(`Failed to delete Firebase Auth user ${userId}:`, error);
      // Continue with response even if auth deletion fails
    }

    // Log the deletion for audit purposes
    console.log(`Account deletion completed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted. All your data has been removed.'
    });
  } catch (error) {
    console.error('Error during account deletion:', error);
    return NextResponse.json({
      error: 'Failed to delete account. Please contact support if this persists.'
    }, { status: 500 });
  }
}
