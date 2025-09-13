    "use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthClient, getGoogleProvider } from "@/firebase/client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const auth = getAuthClient();
  if (!auth) return;
  const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Broadcast auth state to window/localStorage for extension/content scripts
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        // Simple cross-surface signal for the extension
        (window as any).__firebase_user = { id: user.uid };
        localStorage.setItem("__firebase_user", JSON.stringify({ id: user.uid }));
        // Notify listeners (extension content script listens for this)
        window.postMessage({ type: "FIREBASE_AUTH_SUCCESS", uid: user.uid }, window.location.origin);
      } else {
        delete (window as any).__firebase_user;
        localStorage.removeItem("__firebase_user");
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    async signIn(email, password) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Auth not available");
  await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email, password, name) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Auth not available");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(cred.user, { displayName: name }); } catch {}
      }
    },
    async signInWithGoogle() {
  const auth = getAuthClient();
  const provider = getGoogleProvider();
  if (!auth || !provider) throw new Error("Auth not available");
  await signInWithPopup(auth, provider);
    },
    async signOut() {
  const auth = getAuthClient();
  if (!auth) return;
  await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
