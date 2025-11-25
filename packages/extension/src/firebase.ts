import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  indexedDBLocalPersistence, 
  inMemoryPersistence, 
  browserPopupRedirectResolver, 
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup as firebaseSignInWithPopup,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  Auth,
  User,
  setPersistence
} from 'firebase/auth';

// Lightweight Firebase bootstrap for the extension popup only.
// Relies on env vars injected at build time via webpack DefinePlugin.

import { getEnv } from "./env";
import { logger } from "./utils/logger";

const firebaseConfig = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY", ""),
  authDomain:
    getEnv("NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN") ||
    getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", ""),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", ""),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", ""),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", ""),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID", ""),
};

// Track initialization state
let initializationError: Error | null = null;
let isInitialized = false;
let authInitialized = false;
let cachedAuth: Auth | null = null;

function validateConfig(cfg: Record<string, any>): { valid: boolean; missing: string[] } {
  const missing = Object.entries(cfg)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { valid: missing.length === 0, missing };
}

let app: FirebaseApp | undefined;

export function ensureFirebase(): FirebaseApp {
  if (initializationError) {
    throw initializationError;
  }
  
  if (!app) {
    const configValidation = validateConfig(firebaseConfig);
    if (!configValidation.valid) {
      initializationError = new Error(
        `Missing Firebase configuration values for extension: ${configValidation.missing.join(', ')}. ` +
        `Please ensure all Firebase environment variables are set.`
      );
      throw initializationError;
    }
    
    try {
      app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
      isInitialized = true;
      logger.debug('Firebase', 'Firebase app initialized');
    } catch (error) {
      initializationError = error as Error;
      logger.error('Firebase', 'Failed to initialize Firebase', { error });
      throw error;
    }
  }
  return app;
}

export function getAuthInstance(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }
  
  const firebaseApp = ensureFirebase();
  
  // Try to initialize auth with persistence for session sharing with web app
  // Use the same persistence order as the web app for compatibility
  try {
    cachedAuth = initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,  // Primary: Cross-session persistence
        browserLocalPersistence,    // Fallback: Local storage
        inMemoryPersistence,        // Last resort: Memory only
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    authInitialized = true;
    logger.debug('Firebase', 'Firebase Auth initialized with persistence');
    return cachedAuth;
  } catch (error: any) {
    // If auth was already initialized (e.g., multiple getAuthInstance calls), use getAuth
    if (error?.code === 'auth/already-initialized') {
      cachedAuth = getAuth(firebaseApp);
      authInitialized = true;
      return cachedAuth;
    }
    
    // Fall back to regular getAuth if initializeAuth fails
    logger.warn('Firebase', 'Failed to initialize auth with persistence, falling back to getAuth', { error });
    cachedAuth = getAuth(firebaseApp);
    
    // Try to set persistence on the existing auth instance
    setPersistence(cachedAuth, indexedDBLocalPersistence)
      .catch(() => setPersistence(cachedAuth!, browserLocalPersistence))
      .catch((persistenceError) => {
        logger.warn('Firebase', 'Failed to set persistence', { error: persistenceError });
      });
    
    authInitialized = true;
    return cachedAuth;
  }
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

// Export auth functions for use in AuthManager
export function signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
  return Promise.resolve(firebaseSignInWithEmailAndPassword(auth, email, password));
}

export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string) {
  return Promise.resolve(firebaseCreateUserWithEmailAndPassword(auth, email, password));
}

export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export function signOut(auth: Auth) {
  return Promise.resolve(firebaseSignOut(auth));
}

export function signInWithPopup(auth: Auth, provider: GoogleAuthProvider) {
  return Promise.resolve(firebaseSignInWithPopup(auth, provider));
}

/**
 * Get the current auth user synchronously (may be null if not signed in or not ready)
 */
export function getCurrentUser(): User | null {
  try {
    const auth = getAuthInstance();
    return auth.currentUser;
  } catch {
    return null;
  }
}

/**
 * Wait for auth state to be ready (resolves with current user or null)
 */
export function waitForAuthState(): Promise<User | null> {
  return new Promise((resolve) => {
    try {
      const auth = getAuthInstance();
      
      // If already have a user, resolve immediately
      if (auth.currentUser) {
        resolve(auth.currentUser);
        return;
      }
      
      // Wait for auth state change
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(auth.currentUser);
      }, 5000);
    } catch (error) {
      logger.warn('Firebase', 'Error waiting for auth state', { error });
      resolve(null);
    }
  });
}

/**
 * Firebase status information
 */
export interface FirebaseStatus {
  initialized: boolean;
  authInitialized: boolean;
  hasUser: boolean;
  initializationError: string | null;
  projectId: string | null;
}

/**
 * Get Firebase initialization status
 */
export function getFirebaseStatus(): FirebaseStatus {
  const user = cachedAuth?.currentUser || null;
  
  return {
    initialized: isInitialized,
    authInitialized,
    hasUser: !!user,
    initializationError: initializationError?.message || null,
    projectId: firebaseConfig.projectId || null
  };
}

export const signInWithGoogle = async (): Promise<User> => {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();
  const result = await firebaseSignInWithPopup(auth, provider);
  return result.user;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  const auth = getAuthInstance();
  await firebaseSendPasswordResetEmail(auth, email);
};

export const signOutUser = async (): Promise<void> => {
  const auth = getAuthInstance();
  await firebaseSignOut(auth);
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const auth = getAuthInstance();
  const result = await firebaseSignInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const auth = getAuthInstance();
  const result = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
  return result.user;
};
