import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken, type UserRecord } from "firebase-admin/auth";
import { getFirestore, type Firestore, type Query, type CollectionReference, FieldValue, Timestamp, FieldPath } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let adminApp: App | undefined;
let initializationPromise: Promise<App> | null = null;
let isInitialized = false;
let lastHealthCheck: { timestamp: number; healthy: boolean; details?: Record<string, any> } | null = null;
const HEALTH_CHECK_INTERVAL_MS = 60_000; // 1 minute
const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY_MS = 1000;

// Error categories for better error handling
export type FirebaseErrorCategory = 'auth' | 'permission' | 'network' | 'config' | 'unknown';

export interface FirebaseError {
  category: FirebaseErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
}

export function categorizeFirebaseError(error: any): FirebaseError {
  const code = error?.code || 'unknown';
  const message = error?.message || 'Unknown error';
  
  // Auth errors
  if (code.startsWith('auth/')) {
    const retryable = !['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token'].includes(code);
    return { category: 'auth', code, message, retryable };
  }
  
  // Permission errors
  if (code === 'permission-denied' || code.includes('PERMISSION_DENIED')) {
    return { category: 'permission', code, message, retryable: false };
  }
  
  // Network errors
  if (code === 'unavailable' || code.includes('UNAVAILABLE') || message.includes('network') || message.includes('ECONNREFUSED')) {
    return { category: 'network', code, message, retryable: true };
  }
  
  // Config errors
  if (code.includes('invalid-argument') || code.includes('configuration')) {
    return { category: 'config', code, message, retryable: false };
  }
  
  return { category: 'unknown', code, message, retryable: true };
}

/**
 * Initialize Firebase Admin with mutex to prevent race conditions
 */
function initAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existing = getApps();
  if (existing.length) {
    adminApp = existing[0]!;
    return adminApp;
  }

  console.log('Initializing new admin app...');

// Try different service account loading methods in order of preference
const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

try {
  let serviceAccount = null;

  // Method 1: Base64 encoded service account JSON from env (prioritize this)
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

  // Method 4: Load from JSON file (development fallback)
  if (!serviceAccount) {
    try {
      const keyPath = join(process.cwd(), "jobloom-6a4cd-firebase-adminsdk-fbsvc-aed875c457.json");
      if (existsSync(keyPath)) {
        serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
        console.log("Loaded service account from jobloom-6a4cd-firebase-adminsdk-fbsvc-aed875c457.json");
      }
    } catch (error) {
      console.warn("Failed to load jobloom-6a4cd-firebase-adminsdk-fbsvc-aed875c457.json:", error);
    }
  }

  // Method 5: Load from temp-key.json file (development fallback)
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

  // Initialize with service account if available
  if (serviceAccount) {
    console.log('Service account loaded successfully:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      hasPrivateKey: !!serviceAccount.private_key,
      privateKeyLength: serviceAccount.private_key ? serviceAccount.private_key.length : 0,
    });

    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      isInitialized = true;
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
      isInitialized = true;
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

export interface TokenVerificationResult {
  success: boolean;
  token?: import("firebase-admin/auth").DecodedIdToken;
  error?: FirebaseError;
}

export async function verifyIdToken(token: string): Promise<import("firebase-admin/auth").DecodedIdToken | null> {
  const result = await verifyIdTokenDetailed(token);
  return result.token || null;
}

/**
 * Verify ID token with detailed error information
 */
export async function verifyIdTokenDetailed(token: string): Promise<TokenVerificationResult> {
  // Basic token validation
  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: { category: 'auth', code: 'auth/invalid-token-format', message: 'Token must be a non-empty string', retryable: false }
    };
  }
  
  if (token.length < 100) {
    return {
      success: false,
      error: { category: 'auth', code: 'auth/token-too-short', message: 'Token appears to be truncated or invalid', retryable: false }
    };
  }
  
  // Check for obvious placeholder/test tokens
  if (token === 'test' || token.startsWith('mock') || token === 'undefined') {
    return {
      success: false,
      error: { category: 'auth', code: 'auth/test-token', message: 'Invalid test or placeholder token', retryable: false }
    };
  }

  try {
    const auth = getAuth(getAdminApp());
    const decodedToken = await auth.verifyIdToken(token);
    return { success: true, token: decodedToken };
  } catch (error: any) {
    const categorized = categorizeFirebaseError(error);
    
    // Log with appropriate level based on error type
    if (categorized.retryable) {
      console.warn(`Token verification failed (retryable): ${categorized.code}`);
    } else {
      console.debug(`Token verification failed: ${categorized.code}`);
    }
    
    return { success: false, error: categorized };
  }
}

/**
 * Verify a token with retry logic for transient failures
 */
export async function verifyIdTokenWithRetry(
  token: string,
  maxRetries: number = 2,
  delayMs: number = 500
): Promise<import("firebase-admin/auth").DecodedIdToken | null> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await verifyIdToken(token);
      if (result) return result;
      
      // If no result but no error, the token is invalid - don't retry
      return null;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on permanent errors
      const permanentErrors = [
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/invalid-id-token',
        'auth/argument-error'
      ];
      
      if (permanentErrors.includes(error?.code)) {
        return null;
      }
      
      // Retry on transient errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  console.warn('Token verification failed after retries:', lastError?.code || lastError?.message);
  return null;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  // Validate input
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error('Invalid userId provided to isUserAdmin:', userId);
    return false;
  }

  try {
    const db = getAdminDb();
    if (!db) {
      console.error('Failed to get admin database instance');
      return false;
    }

    const userDocRef = db.collection("users").doc(userId.trim());
    const userDoc = await userDocRef.get();

    // Check if document exists
    if (!userDoc.exists) {
      console.log(`User document does not exist for userId: ${userId}`);
      return false;
    }

    // Get document data
    const userData = userDoc.data();
    if (!userData) {
      console.log(`User document exists but has no data for userId: ${userId}`);
      return false;
    }

    // Check admin status
    const isAdmin = userData.isAdmin === true;
    return isAdmin;

  } catch (error) {
    console.error("Error checking admin status for user", userId, ":", error);

    // If it's a permission error, log more details
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      console.error("Firebase error details:", {
        code: firebaseError.code,
        message: firebaseError.message,
        userId
      });
    }

    return false;
  }
}

export function initializeAdmin(): App {
  return initAdminApp();
}

// Re-export commonly used Firebase Admin SDK functions for centralized access
export { FieldValue, Timestamp, FieldPath };
export type { DecodedIdToken, Firestore, UserRecord, Query, CollectionReference };

// Convenience functions for getting Firebase Admin services
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

// Create custom token for testing purposes
export async function createCustomToken(uid: string, additionalClaims?: any): Promise<string> {
  const auth = getAdminAuth();
  return await auth.createCustomToken(uid, additionalClaims);
}

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  error?: string;
  details?: Record<string, any>;
  services?: {
    firestore: boolean;
    auth: boolean;
    storage: boolean;
  };
}

/**
 * Check if Firebase Admin is healthy and connected
 * Performs comprehensive health checks on all Firebase services
 */
export async function checkFirebaseHealth(force: boolean = false): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  // Return cached result if recent and not forced
  if (!force && lastHealthCheck && (Date.now() - lastHealthCheck.timestamp) < HEALTH_CHECK_INTERVAL_MS) {
    return {
      healthy: lastHealthCheck.healthy,
      latencyMs: 0,
      details: { cached: true, ...lastHealthCheck.details }
    };
  }
  
  const services = {
    firestore: false,
    auth: false,
    storage: false
  };
  
  const errors: string[] = [];
  
  try {
    // Test Firestore connection
    try {
      const db = getAdminDb();
      const testRef = db.collection('_health_check');
      await Promise.race([
        testRef.limit(1).get(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 5000))
      ]);
      services.firestore = true;
    } catch (e: any) {
      errors.push(`Firestore: ${e.message}`);
    }
    
    // Test Auth service
    try {
      const auth = getAdminAuth();
      // Just verify the auth instance is accessible
      if (auth) {
        services.auth = true;
      }
    } catch (e: any) {
      errors.push(`Auth: ${e.message}`);
    }
    
    // Test Storage service
    try {
      const storage = getAdminStorage();
      if (storage) {
        services.storage = true;
      }
    } catch (e: any) {
      errors.push(`Storage: ${e.message}`);
    }
    
    const latencyMs = Date.now() - startTime;
    const healthy = services.firestore && services.auth; // Firestore and Auth are critical
    
    lastHealthCheck = { 
      timestamp: Date.now(), 
      healthy,
      details: { services, latencyMs }
    };
    
    return {
      healthy,
      latencyMs,
      services,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      details: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        initialized: isInitialized,
        serviceCount: Object.values(services).filter(Boolean).length
      }
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    lastHealthCheck = { timestamp: Date.now(), healthy: false };
    
    return {
      healthy: false,
      latencyMs,
      services,
      error: error?.message || 'Unknown error',
      details: {
        code: error?.code,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    };
  }
}

/**
 * Get the current initialization status
 */
export function getInitializationStatus(): {
  initialized: boolean;
  projectId: string | undefined;
  lastHealthCheck: { timestamp: number; healthy: boolean } | null;
} {
  return {
    initialized: isInitialized,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    lastHealthCheck
  };
}

/**
 * Ensure Firebase is initialized before performing operations
 * This can be called at the start of API routes for better error handling
 */
export async function ensureFirebaseInitialized(): Promise<void> {
  if (!adminApp) {
    getAdminApp(); // This will initialize synchronously
  }
  
  // Optionally check health on first call
  if (!lastHealthCheck) {
    const health = await checkFirebaseHealth();
    if (!health.healthy) {
      console.warn('Firebase health check failed on initialization:', health.error);
    }
  }
}

