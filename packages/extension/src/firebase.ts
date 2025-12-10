import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithCredential as firebaseSignInWithCredential,
} from 'firebase/auth/web-extension';

// Import types from firebase/auth (web-extension re-exports these)
import type { Auth, User } from 'firebase/auth';

// Lightweight Firebase bootstrap for the extension popup only.
// Uses firebase/auth/web-extension per Firebase Chrome extension docs:
// https://firebase.google.com/docs/auth/web/chrome-extension
// This entry point handles persistence automatically for Chrome extensions.

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
  
  // firebase/auth/web-extension handles persistence automatically
  // No need to configure persistence manually like with firebase/auth
  try {
    cachedAuth = getAuth(firebaseApp);
    authInitialized = true;
    logger.debug('Firebase', 'Firebase Auth initialized (web-extension)');
    return cachedAuth;
  } catch (error: any) {
    logger.error('Firebase', 'Failed to initialize auth', { error });
    throw error;
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

// Note: signInWithPopup is NOT supported in Chrome extensions due to Manifest V3 restrictions.
// For Google Sign-In, we open the web app and sync the auth state.
// See: https://firebase.google.com/docs/auth/web/chrome-extension#use_offscreen_documents

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

/**
 * Sign in with Google using Chrome Identity API.
 * This works independently in the extension without needing popups.
 * Uses chrome.identity.getAuthToken to get an OAuth token from the user's
 * signed-in Google account in Chrome, then authenticates with Firebase.
 */
export const signInWithGoogle = async (): Promise<User> => {
  if (typeof chrome === 'undefined' || !chrome.identity?.getAuthToken) {
    throw new Error('Chrome Identity API not available');
  }

  try {
    // Get OAuth token from Chrome's account system
    const authResult = await chrome.identity.getAuthToken({ interactive: true });
    
    if (!authResult?.token) {
      throw new Error('Failed to get auth token from Chrome');
    }

    logger.debug('Firebase', 'Got OAuth token from Chrome Identity API');

    // Create Firebase credential from the OAuth token
    const credential = GoogleAuthProvider.credential(null, authResult.token);
    
    // Sign in to Firebase with the credential
    const auth = getAuthInstance();
    const result = await firebaseSignInWithCredential(auth, credential);
    
    logger.debug('Firebase', 'Successfully signed in with Google', { uid: result.user.uid });
    
    return result.user;
  } catch (error: any) {
    // If token was cached and invalid, clear it and retry
    if (error?.code === 'auth/invalid-credential' && chrome.identity?.removeCachedAuthToken) {
      try {
        const authResult = await chrome.identity.getAuthToken({ interactive: false });
        if (authResult?.token) {
          await chrome.identity.removeCachedAuthToken({ token: authResult.token });
          // Retry with fresh token
          return signInWithGoogle();
        }
      } catch (retryError) {
        logger.warn('Firebase', 'Failed to clear cached token', { error: retryError });
      }
    }
    
    logger.error('Firebase', 'Google sign-in failed', { error });
    throw error;
  }
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

// Re-export types for convenience
export type { Auth, User };
