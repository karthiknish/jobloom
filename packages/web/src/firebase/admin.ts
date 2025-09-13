// Server-side Firebase Admin initialization and helpers
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function initAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length) {
    adminApp = existing[0]!;
    return adminApp;
  }

  // Try GOOGLE_APPLICATION_CREDENTIALS / ADC first (recommended in managed envs)
  // Optionally support inline service account JSON via env for local/dev
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  try {
    if (svcJson || svcB64) {
      const parsed = JSON.parse(
        svcJson || Buffer.from(svcB64 as string, "base64").toString("utf8")
      );
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId:
          parsed.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch {
    // As a last resort, try initialize with no options (useful in some hosting envs)
    adminApp = initializeApp();
  }
  return adminApp;
}

export function getAdminApp(): App {
  return initAdminApp();
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export async function verifyIdToken(token: string): Promise<import("firebase-admin/auth").DecodedIdToken | null> {
  try {
    const auth = getAuth(getAdminApp());
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

