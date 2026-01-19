"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useBetterAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useBetterAuth must be used within BetterAuthProvider");
  }
  return ctx;
}

export function BetterAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshSession = async () => {
    try {
      const session = await authClient.getSession();
      setUser(session.data?.session ?? null);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshSession().then(() => setLoading(false));
  }, []);

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    await refreshSession();
  };

  const signInWithEmail = async (email: string, password: string) => {
    await authClient.signIn.email({
      email,
      password,
    });
    await refreshSession();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    await authClient.signUp.email({
      email,
      password,
      name: name ?? "",
    });
    await refreshSession();
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isOnline,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
