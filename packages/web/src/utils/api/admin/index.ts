import { getDb } from "@/firebase/client";
import { doc, updateDoc, addDoc, collection, deleteDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { blogApi } from "./blog";
import { userApi } from "./users";
import { sponsorApi } from "./sponsors";
import { verifyAdminAccess } from "./auth";
import { clearUserAuthCache } from "@/lib/api/auth-cache";
import type { ContactSubmission } from "@/types/api";

// Types
export interface UserRecord {
  _id: string;
  isAdmin?: boolean;
  email: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  lastLoginAt?: number;
  emailVerified?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string | null;
  provider?: string | null;
}

export interface SponsorshipRule {
  _id: string;
  name: string;
  description: string;
  jobSite: string;
  selectors: string[];
  keywords: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Cache types for invalidation
export type CacheType = 
  | 'user' 
  | 'users' 
  | 'blog' 
  | 'blogs' 
  | 'sponsor' 
  | 'sponsors' 
  | 'auth' 
  | 'all';

// Event emitter for cache invalidation across the app
type CacheInvalidationListener = (cacheType: CacheType, key?: string) => void;
const cacheInvalidationListeners: Set<CacheInvalidationListener> = new Set();

/**
 * Subscribe to cache invalidation events
 * @returns Unsubscribe function
 */
export function onCacheInvalidation(listener: CacheInvalidationListener): () => void {
  cacheInvalidationListeners.add(listener);
  return () => cacheInvalidationListeners.delete(listener);
}

/**
 * Notify all listeners about cache invalidation
 */
function notifyCacheInvalidation(cacheType: CacheType, key?: string): void {
  cacheInvalidationListeners.forEach(listener => {
    try {
      listener(cacheType, key);
    } catch (error) {
      console.error('Cache invalidation listener error:', error);
    }
  });
}

// Core Admin API Functions
export const adminApi = {
  // Authentication
  verifyAdminAccess,

  // Cache Management - Comprehensive implementation
  invalidateCache: (cacheKey?: string, cacheType: CacheType = 'all') => {
    console.log(`Cache invalidation: type=${cacheType}, key=${cacheKey || 'all'}`);
    
    const invalidationResults: Record<string, boolean> = {};
    
    try {
      // Invalidate auth/user cache
      if (cacheType === 'all' || cacheType === 'auth' || cacheType === 'user' || cacheType === 'users') {
        clearUserAuthCache(cacheKey);
        invalidationResults.auth = true;
      }
      
      // Invalidate blog cache (client-side) - notify listeners
      if (cacheType === 'all' || cacheType === 'blog' || cacheType === 'blogs') {
        invalidationResults.blog = true;
      }
      
      // Invalidate sponsor cache (client-side) - notify listeners
      if (cacheType === 'all' || cacheType === 'sponsor' || cacheType === 'sponsors') {
        invalidationResults.sponsors = true;
      }
      
      // Notify all listeners about the cache invalidation
      notifyCacheInvalidation(cacheType, cacheKey);
      
      console.log('Cache invalidation completed:', invalidationResults);
      return { success: true, invalidated: invalidationResults };
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return { success: false, error: String(error) };
    }
  },
  
  // Specific cache invalidation helpers
  invalidateUserCache: (userId?: string) => {
    return adminApi.invalidateCache(userId, 'user');
  },
  
  invalidateBlogCache: (blogId?: string) => {
    return adminApi.invalidateCache(blogId, 'blog');
  },
  
  invalidateSponsorCache: (sponsorId?: string) => {
    return adminApi.invalidateCache(sponsorId, 'sponsor');
  },
  
  invalidateAllCaches: () => {
    return adminApi.invalidateCache(undefined, 'all');
  },

  // Export all module APIs
  blog: blogApi,
  sponsors: sponsorApi,

  // Additional admin functions
  getUserByFirebaseUid: async (uid: string): Promise<UserRecord | null> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      _id: doc.id,
      ...doc.data(),
    } as UserRecord;
  },

  getAllContactSubmissions: async (): Promise<ContactSubmission[]> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(collection(db, "contactSubmissions"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as ContactSubmission[];
  },

  updateContactSubmission: async (
    submissionId: string,
    updates: Partial<ContactSubmission>
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    await updateDoc(doc(db, "contactSubmissions", submissionId), {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  deleteContactSubmission: async (submissionId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    await deleteDoc(doc(db, "contactSubmissions", submissionId));
  },

  // Sponsorship functions
  getAllSponsoredCompanies: async (filters?: any): Promise<any> => {
    return sponsorApi.getSponsors(filters);
  },

  getSponsorshipStats: async (): Promise<any> => {
    return sponsorApi.getSponsorshipStats();
  },

  deleteSponsoredCompany: async (companyId: string, _requesterId?: string): Promise<any> => {
    return sponsorApi.deleteSponsor(companyId);
  },

  updateSponsoredCompany: async (companyId: string, companyData: any, _requesterId?: string): Promise<any> => {
    return sponsorApi.updateSponsor(companyId, companyData);
  },

  getAllSponsoredCompaniesForExport: async (filters?: any): Promise<any> => {
    return sponsorApi.getSponsors(filters);
  },

  // User functions
  getUserStats: async (): Promise<any> => {
    return userApi.getUserStats();
  },

  getAllUsers: async (): Promise<any> => {
    return userApi.getUsers();
  },

  setAdminUser: async (userId: string, requesterId: string): Promise<any> => {
    return userApi.setAdminUser(userId, requesterId);
  },

  removeAdminUser: async (userId: string, requesterId: string): Promise<any> => {
    return userApi.removeAdminUser(userId, requesterId);
  },

  deleteUser: async (userId: string): Promise<any> => {
    return userApi.deleteUser(userId);
  },

  // Sponsorship rules functions
  getAllSponsorshipRules: async (): Promise<any> => {
    return sponsorApi.getAllSponsorshipRules();
  },

  addSponsorshipRule: async (ruleData: any): Promise<any> => {
    return sponsorApi.addSponsorshipRule(ruleData);
  },

  updateSponsorshipRuleStatus: async (ruleId: string, isActive: boolean): Promise<any> => {
    return sponsorApi.updateSponsorshipRuleStatus(ruleId, isActive);
  },

  users: userApi,
};

// Export individual APIs for direct import
export { blogApi } from "./blog";
export { userApi } from "./users";
export { sponsorApi } from "./sponsors";
