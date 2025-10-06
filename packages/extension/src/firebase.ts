import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, inMemoryPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from 'firebase/auth';

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
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (error) {
    // Fall back to regular getAuth if initializeAuth fails
    console.warn('Failed to initialize auth with persistence, falling back to getAuth:', error);
    return getAuth(app);
  }
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
