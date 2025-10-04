// Server-side Firebase Admin initialization and helpers
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let adminApp: App | undefined;

function initAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length) {
    adminApp = existing[0]!;
    return adminApp;
  }

// Try different service account loading methods in order of preference
const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

try {
  let serviceAccount = null;

  // Method 1: Base64 encoded service account JSON from env
  if (svcB64) {
    try {
      serviceAccount = JSON.parse(Buffer.from(svcB64, "base64").toString("utf8"));
      console.log('Loaded service account from FIREBASE_SERVICE_ACCOUNT_BASE64');
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', error);
    }
  }

  // Method 2: Raw service account JSON from env
  if (!serviceAccount && svcJson) {
    try {
      serviceAccount = JSON.parse(svcJson);
      console.log('Loaded service account from FIREBASE_SERVICE_ACCOUNT');
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
    }
  }

  // Method 3: Create service account from individual env vars
  if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        universe_domain: "googleapis.com"
      };
      console.log('Loaded service account from individual environment variables');
    } catch (error) {
      console.warn('Failed to create service account from env vars:', error);
    }
  }

  // Method 4: Load from temp-key.json file (development fallback)
  if (!serviceAccount) {
    try {
      const keyPath = join(process.cwd(), "temp-key.json");
      if (existsSync(keyPath)) {
        serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
        console.log("Loaded service account from temp-key.json");
      }
    } catch (error) {
      console.warn("Failed to load temp-key.json:", error);
    }
  }

  // Method 5: Load from hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json
  if (!serviceAccount) {
    try {
      const keyPath = join(process.cwd(), "hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json");
      if (existsSync(keyPath)) {
        serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
        console.log("Loaded service account from hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json");
      }
    } catch (error) {
      console.warn("Failed to load hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json:", error);
    }
  }

  // Initialize with service account if available
  if (serviceAccount) {
    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with service account');
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin with service account:', initError);
      throw initError;
    }
  } else {
    // Fallback to application default credentials (for Google Cloud environments)
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with application default credentials');
    } catch (adcError) {
      console.warn('Failed to initialize with application default credentials:', adcError);
      // Last resort: try without credentials (may work in some environments)
      try {
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('Firebase Admin initialized without explicit credentials');
      } catch (noCredError) {
        console.error('Failed to initialize Firebase Admin without credentials:', noCredError);
        throw noCredError;
      }
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // As a last resort, try initialize with no options
  try {
    adminApp = initializeApp();
    console.log('Firebase Admin initialized with minimal configuration');
  } catch (fallbackError) {
    console.error('All Firebase Admin initialization methods failed:', fallbackError);
    throw fallbackError;
  }
}
  return adminApp;
}

export function getAdminApp(): App {
  return initAdminApp();
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

export async function verifyIdToken(token: string): Promise<import("firebase-admin/auth").DecodedIdToken | null> {
  try {
    const auth = getAuth(getAdminApp());
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    return userData?.isAdmin === true;
  } catch {
    return false;
  }
}

export function initializeAdmin(): App {
  return initAdminApp();
}

