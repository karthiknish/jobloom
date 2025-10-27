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
  Auth
} from 'firebase/auth';

// Lightweight Firebase bootstrap for the extension popup only.
// Relies on env vars injected at build time via webpack DefinePlugin.

import { getEnv } from "./env";

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

function validateConfig(cfg: Record<string, any>) {
  const missing = Object.entries(cfg)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing authentication configuration values for extension: ${missing.join(', ')}`);
  }
}

let app: FirebaseApp | undefined;

export function ensureFirebase() {
  if (!app) {
    validateConfig(firebaseConfig);
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getAuthInstance() {
  const app = ensureFirebase();
  
  // Try to initialize auth with persistence for session sharing with web app
  // Use the same persistence order as the web app for compatibility
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,  // Primary: Cross-session persistence
        browserLocalPersistence,   // Fallback: Local storage
        inMemoryPersistence,       // Last resort: Memory only
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (error) {
    // Fall back to regular getAuth if initializeAuth fails
    console.warn('Failed to initialize auth with persistence, falling back to getAuth:', error);
    const auth = getAuth(app);
    
    // Try to set persistence on the existing auth instance
    try {
      // This ensures we still attempt to use the same persistence as web app
      import('firebase/auth').then(({ setPersistence }) => {
        setPersistence(auth, indexedDBLocalPersistence)
          .catch(() => setPersistence(auth, browserLocalPersistence))
          .catch(() => {
            // Memory persistence is the default
          });
      });
    } catch (persistenceError) {
      console.warn('Failed to set persistence on fallback auth:', persistenceError);
    }
    
    return auth;
  }
}

export function getGoogleProvider() {
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

export function onAuthStateChanged(auth: Auth, callback: (user: any) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export function signOut(auth: Auth) {
  return Promise.resolve(firebaseSignOut(auth));
}

export function signInWithPopup(auth: Auth, provider: GoogleAuthProvider) {
  return Promise.resolve(firebaseSignInWithPopup(auth, provider));
}
