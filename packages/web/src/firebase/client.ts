import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;

export function ensureFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") return undefined;
  if (!app) {
    const existing = getApps();
    app = existing.length ? existing[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getAuthClient(): Auth | undefined {
  const a = ensureFirebaseApp();
  return a ? getAuth(a) : undefined;
}

export function getGoogleProvider(): GoogleAuthProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const provider = new GoogleAuthProvider();
  // Encourage account chooser for multi-account users
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function getDb(): Firestore | undefined {
  const a = ensureFirebaseApp();
  return a ? getFirestore(a) : undefined;
}
