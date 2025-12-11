"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { adminApi } from "@/utils/api/admin";

interface UserRecord {
  _id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  createdAt: number;
  lastLoginAt?: number;
  emailVerified?: boolean;
  firebaseUid?: string;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string;
}

interface AdminAuthState {
  isAdmin: boolean | null;
  isLoading: boolean;
  userRecord: UserRecord | null;
  error: Error | null;
}

// Global cache to prevent redundant API calls across components
const adminCache: {
  userRecord: UserRecord | null;
  isAdmin: boolean | null;
  lastFetchedUid: string | null;
  fetchPromise: Promise<UserRecord | null> | null;
} = {
  userRecord: null,
  isAdmin: null,
  lastFetchedUid: null,
  fetchPromise: null,
};

/**
 * Shared hook for admin authentication across all admin pages.
 * Uses a global cache to prevent redundant API calls when navigating between admin pages.
 */
export function useAdminAuth(): AdminAuthState {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: adminCache.isAdmin,
    isLoading: true,
    userRecord: adminCache.userRecord,
    error: null,
  });
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Reset if user changes
    if (user?.uid !== adminCache.lastFetchedUid && adminCache.lastFetchedUid !== null) {
      adminCache.userRecord = null;
      adminCache.isAdmin = null;
      adminCache.fetchPromise = null;
      fetchedRef.current = false;
    }

    // Wait for auth to complete
    if (authLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    // No user = not admin
    if (!user) {
      setState({
        isAdmin: false,
        isLoading: false,
        userRecord: null,
        error: null,
      });
      return;
    }

    // Use cached result if available for same user
    if (adminCache.lastFetchedUid === user.uid && adminCache.userRecord !== null) {
      setState({
        isAdmin: adminCache.isAdmin,
        isLoading: false,
        userRecord: adminCache.userRecord,
        error: null,
      });
      return;
    }

    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    const fetchAdminStatus = async () => {
      fetchedRef.current = true;
      
      try {
        // Reuse existing promise if one is in flight
        if (adminCache.fetchPromise) {
          const record = await adminCache.fetchPromise;
          setState({
            isAdmin: record?.isAdmin === true,
            isLoading: false,
            userRecord: record,
            error: null,
          });
          return;
        }

        // Create new fetch promise and cache it
        adminCache.fetchPromise = adminApi.getUserByFirebaseUid(user.uid);
        const record = await adminCache.fetchPromise;
        
        // Cache the result
        adminCache.userRecord = record;
        adminCache.isAdmin = record?.isAdmin === true;
        adminCache.lastFetchedUid = user.uid;
        adminCache.fetchPromise = null;

        setState({
          isAdmin: record?.isAdmin === true,
          isLoading: false,
          userRecord: record,
          error: null,
        });
      } catch (error) {
        adminCache.fetchPromise = null;
        setState({
          isAdmin: false,
          isLoading: false,
          userRecord: null,
          error: error instanceof Error ? error : new Error("Failed to verify admin status"),
        });
      }
    };

    fetchAdminStatus();
  }, [user, authLoading]);

  return state;
}

/**
 * Invalidate the admin cache (e.g., after user changes their admin status)
 */
export function invalidateAdminCache() {
  adminCache.userRecord = null;
  adminCache.isAdmin = null;
  adminCache.lastFetchedUid = null;
  adminCache.fetchPromise = null;
}

export type { UserRecord, AdminAuthState };
