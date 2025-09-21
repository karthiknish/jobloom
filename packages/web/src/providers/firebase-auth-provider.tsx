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
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  isSessionExpiring: boolean;
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
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);

  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (u: User | null) => {
       setUser(u);
       setLoading(false);

       // Handle automatic logout for expired sessions
       if (u) {
         // Set up session expiration warning (23 hours)
         const warningTimeout = setTimeout(() => {
           setIsSessionExpiring(true);
           console.warn('Session will expire in 1 hour');
         }, 23 * 60 * 60 * 1000); // 23 hours

         // Set up session timeout (24 hours)
         const sessionTimeout = setTimeout(async () => {
           console.warn('Session expired, signing out...');
           setIsSessionExpiring(false);
           try {
             const auth = getAuthClient();
             if (auth) await signOut(auth);
           } catch (error) {
             console.error('Error during automatic logout:', error);
           }
         }, 24 * 60 * 60 * 1000); // 24 hours

         // Store timeout IDs for cleanup
         (window as any).__sessionWarningTimeout = warningTimeout;
         (window as any).__sessionTimeout = sessionTimeout;
       } else {
         // Clear session timeouts on logout
         if ((window as any).__sessionWarningTimeout) {
           clearTimeout((window as any).__sessionWarningTimeout);
           delete (window as any).__sessionWarningTimeout;
         }
         if ((window as any).__sessionTimeout) {
           clearTimeout((window as any).__sessionTimeout);
           delete (window as any).__sessionTimeout;
         }
         setIsSessionExpiring(false);
       }
     });

    return () => {
      unsub();
      // Clean up session timeouts on unmount
      if ((window as any).__sessionWarningTimeout) {
        clearTimeout((window as any).__sessionWarningTimeout);
        delete (window as any).__sessionWarningTimeout;
      }
      if ((window as any).__sessionTimeout) {
        clearTimeout((window as any).__sessionTimeout);
        delete (window as any).__sessionTimeout;
      }
    };
  }, []);

  // Broadcast auth state to window/localStorage for extension/content scripts
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        // Simple cross-surface signal for the extension
        (window as any).__firebase_user = { id: user.uid };
        localStorage.setItem("__firebase_user", JSON.stringify({ id: user.uid }));
        // Set cookie for server-side auth checks
        document.cookie = `__firebase_user=${JSON.stringify({ id: user.uid })}; path=/; max-age=604800; samesite=strict`;
        // Notify listeners (extension content script listens for this)
        window.postMessage({ type: "FIREBASE_AUTH_SUCCESS", uid: user.uid }, window.location.origin);
      } else {
        delete (window as any).__firebase_user;
        localStorage.removeItem("__firebase_user");
        // Remove cookie
        document.cookie = "__firebase_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    isSessionExpiring,
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
    async resetPassword(email) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Auth not available");
  await sendPasswordResetEmail(auth, email);
    },
    async sendEmailVerification() {
  const auth = getAuthClient();
  if (!auth || !auth.currentUser) throw new Error("No authenticated user");
  await sendEmailVerification(auth.currentUser);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
