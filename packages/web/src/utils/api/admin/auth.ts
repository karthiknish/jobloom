import { getAuthClient } from "@/firebase/client";
import { apiClient } from "@/lib/api/client";

// Cache for admin verification to prevent duplicate calls
let adminVerificationCache: {
  user: any;
  timestamp: number;
  uid: string;
} | null = null;

const CACHE_TTL_MS = 60000; // 1 minute cache

// Authentication utility for admin modules
export const verifyAdminAccess = async () => {
  const auth = getAuthClient();
  if (!auth?.currentUser) {
    throw new Error("Authentication required");
  }

  const currentUid = auth.currentUser.uid;
  
  // Check if we have a valid cached result
  if (
    adminVerificationCache &&
    adminVerificationCache.uid === currentUid &&
    Date.now() - adminVerificationCache.timestamp < CACHE_TTL_MS
  ) {
    return adminVerificationCache.user;
  }

  const token = await auth.currentUser.getIdToken();
  try {
    const data = await apiClient.post<any>("/admin/verify", {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Cache the result
    adminVerificationCache = {
      user: data.user,
      timestamp: Date.now(),
      uid: currentUid,
    };
    
    return data.user;
  } catch (error) {
    adminVerificationCache = null;
    throw new Error("Admin access denied");
  }
};

// Clear the admin verification cache (call on logout or when needed)
export const clearAdminVerificationCache = () => {
  adminVerificationCache = null;
};
