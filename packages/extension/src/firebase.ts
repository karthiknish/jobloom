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

// Web OAuth Client ID for chrome.identity.launchWebAuthFlow (from Google Cloud Console)
// IMPORTANT: This must be a **Web application** OAuth client that allows the redirect URI returned by
// chrome.identity.getRedirectURL() (typically: https://<EXTENSION_ID>.chromiumapp.org/)
// This is NOT the same as the Chrome extension OAuth client in manifest.json (used by getAuthToken).
const GOOGLE_WEB_APP_CLIENT_ID =
  getEnv("GOOGLE_WEB_APP_CLIENT_ID") ||
  getEnv("GOOGLE_WEB_CLIENT_ID") ||
  getEnv("NEXT_PUBLIC_GOOGLE_WEB_APP_CLIENT_ID") ||
  getEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID") ||
  "";

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
  // Note: In sandboxed content scripts (like on LinkedIn), Firebase may fail
  // to access localStorage - we need to catch and handle this gracefully
  try {
    cachedAuth = getAuth(firebaseApp);
    authInitialized = true;
    logger.debug('Firebase', 'Firebase Auth initialized (web-extension)');
    return cachedAuth;
  } catch (error: any) {
    // Check if this is a localStorage SecurityError (happens in sandboxed contexts)
    if (error?.name === 'SecurityError' && error?.message?.includes('localStorage')) {
      logger.warn('Firebase', 'Firebase Auth cannot access localStorage in this context (sandboxed)');
      // Auth won't work in this context, but we shouldn't throw
      throw new Error('Firebase Auth unavailable in sandboxed content script context');
    }
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
 * Fallback: Sign in with Google using getAuthToken (requires Chrome browser sign-in enabled)
 */
const signInWithGoogleToken = async (): Promise<User> => {
  if (!chrome.identity?.getAuthToken) {
    throw new Error('Chrome Identity API not available');
  }

  // Get OAuth token from Chrome's account system
  const authResult = await chrome.identity.getAuthToken({ interactive: true });
  
  if (!authResult?.token) {
    throw new Error('Failed to get auth token from Chrome. Please ensure Chrome browser sign-in is enabled.');
  }

  logger.debug('Firebase', 'Got OAuth token from Chrome Identity API');

  // Create Firebase credential from the OAuth token
  const credential = GoogleAuthProvider.credential(null, authResult.token);
  
  // Sign in to Firebase with the credential
  const auth = getAuthInstance();
  const result = await firebaseSignInWithCredential(auth, credential);
  
  logger.debug('Firebase', 'Successfully signed in with Google (token method)', { uid: result.user.uid });
  
  return result.user;
};

/**
 * Sign in with Google using launchWebAuthFlow.
 * This works universally without requiring Chrome browser sign-in to be enabled.
 * Opens a popup window for the user to authenticate with Google.
 */
export const signInWithGoogle = async (): Promise<User> => {
  if (typeof chrome === 'undefined' || !chrome.identity?.launchWebAuthFlow) {
    throw new Error('Chrome Identity API not available');
  }

  try {
    // Get the redirect URL for the extension
    const redirectUrl = chrome.identity.getRedirectURL();
    logger.debug('Firebase', 'Redirect URL:', redirectUrl);

    // Check if we have the web app client ID configured for launchWebAuthFlow
    if (!GOOGLE_WEB_APP_CLIENT_ID) {
      logger.warn('Firebase', 'GOOGLE_WEB_APP_CLIENT_ID not configured, falling back to getAuthToken');
      return signInWithGoogleToken();
    }


    // Build the OAuth URL - use id_token response type (implicit flow for ID tokens is still supported)
    const scopes = ['openid', 'email', 'profile'].join(' ');
    
    // Generate a random nonce for security
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_WEB_APP_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('response_type', 'id_token token');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('nonce', nonce);

    const authUrlString = authUrl.toString();
    logger.debug('Firebase', 'Launching web auth flow...', { authUrl: authUrlString, clientId: GOOGLE_WEB_APP_CLIENT_ID });

    // Launch the auth flow with a hard timeout so we never hang forever
    const responseUrl = await (() => {
      const launchFlow = new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrlString,
            interactive: true,
          },
          (callbackUrl) => {
            if (chrome.runtime.lastError) {
              logger.error('Firebase', 'launchWebAuthFlow lastError', { message: chrome.runtime.lastError.message });
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!callbackUrl) {
              logger.error('Firebase', 'launchWebAuthFlow returned empty callbackUrl');
              reject(new Error('No callback URL received'));
              return;
            }
            logger.debug('Firebase', 'launchWebAuthFlow callback received', { callbackUrl });
            resolve(callbackUrl);
          }
        );
      });

      // Fallback after 25 seconds if Google never calls back (e.g., redirect mismatch)
      const timeoutMs = 25000;
      const timeout = new Promise<string>((_, reject) => {
        setTimeout(() => {
          logger.warn('Firebase', 'Web auth flow timed out', { timeoutMs });
          reject(new Error('Web auth flow timed out'));
        }, timeoutMs);
      });

      return Promise.race([launchFlow, timeout]);
    })();

    logger.debug('Firebase', 'Auth flow completed, parsing response...');

    // Extract the access token from the callback URL
    const url = new URL(responseUrl);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const oauthError = hashParams.get('error');
    const oauthErrorDescription = hashParams.get('error_description');
    if (oauthError) {
      // This can happen for user cancellations or misconfiguration.
      throw new Error(oauthErrorDescription ? `${oauthError}: ${oauthErrorDescription}` : oauthError);
    }
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
      throw new Error('No access token in response');
    }

    logger.debug('Firebase', 'Got access token from web auth flow');

    // Create Firebase credential from the OAuth token
    const credential = GoogleAuthProvider.credential(null, accessToken);
    
    // Sign in to Firebase with the credential
    const auth = getAuthInstance();
    const result = await firebaseSignInWithCredential(auth, credential);
    
    logger.debug('Firebase', 'Successfully signed in with Google', { uid: result.user.uid });
    
    return result.user;
  } catch (error: any) {
    logger.error('Firebase', 'Google sign-in failed', { error });

    const message = String(error?.message || error);

    // If the OAuth client/redirect URI is misconfigured, Google shows a 400 page and
    // launchWebAuthFlow may never return a callback URL. In that case, fall back to getAuthToken.
    if (
      message.includes('redirect_uri_mismatch') ||
      message.includes('No callback URL received') ||
      message.includes('redirect_uri') ||
      message.includes('timed out') ||
      message.toLowerCase().includes('response_type')
    ) {
      logger.warn('Firebase', 'Web auth flow failed (redirect/timeout/response_type). Falling back to getAuthToken.', {
        message,
      });
      return signInWithGoogleToken();
    }

    // Provide user-friendly error messages
    if (message.includes('user denied') || message.includes('canceled') || message.includes('access_denied')) {
      throw new Error('Sign-in was cancelled');
    }
    if (message.toLowerCase().includes('popup')) {
      throw new Error('Sign-in popup was blocked. Please allow popups for this extension.');
    }

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
