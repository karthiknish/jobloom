// utils/api/admin.ts
import type {
  SponsoredCompany,
  SponsorshipStats,
  ContactSubmission,
} from "../../types/api";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  limit,
  where,
  orderBy,
} from "firebase/firestore";
import { getDb, getAuthClient } from "@/firebase/client";
import { ApiError } from "../../services/api/appApi";

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

type FireCompany = {
  name: string;
  aliases?: string[];
  sponsorshipType?: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

type FireRule = {
  name: string;
  description?: string;
  jobSite: string;
  selectors?: string[];
  keywords?: string[];
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

type FireContact = {
  name?: string;
  email?: string;
  message?: string;
  subject?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
  response?: string;
  respondedAt?: number;
  respondedBy?: string;
};

type AdminUsersResponse = {
  users?: Array<{
    _id: string;
    email?: string;
    name?: string;
    isAdmin?: boolean;
    createdAt?: number;
    updatedAt?: number;
    lastLoginAt?: number;
    emailVerified?: boolean;
    subscriptionPlan?: string;
    subscriptionStatus?: string | null;
    provider?: string | null;
  }>;
  count?: number;
  total?: number;
  message?: string;
  error?: string;
  code?: string;
};

const ADMIN_STATUS_CACHE_TTL = 60 * 1000; // 1 minute

type CachedAdminRecord = {
  record: UserRecord;
  expiresAt: number;
};

const adminStatusCache = new Map<string, CachedAdminRecord>();
const adminStatusPromises = new Map<string, Promise<UserRecord>>();

type FetchCacheEntry = {
  data: unknown;
  expiresAt: number;
};

const adminFetchCache = new Map<string, FetchCacheEntry>();
const adminFetchPromises = new Map<string, Promise<unknown>>();

function getCachedAdminRecord(uid: string): UserRecord | null {
  const cached = adminStatusCache.get(uid);
  if (!cached) return null;

  if (cached.expiresAt > Date.now()) {
    return cached.record;
  }

  adminStatusCache.delete(uid);
  return null;
}

function setCachedAdminRecord(uid: string, record: UserRecord): void {
  adminStatusCache.set(uid, {
    record,
    expiresAt: Date.now() + ADMIN_STATUS_CACHE_TTL,
  });
}

function invalidateAdminRecord(uid?: string): void {
  if (uid) {
    adminStatusCache.delete(uid);
    adminStatusPromises.delete(uid);
    return;
  }

  adminStatusCache.clear();
  adminStatusPromises.clear();
}

function invalidateFetchCache(cacheKey?: string): void {
  if (cacheKey) {
    adminFetchCache.delete(cacheKey);
    adminFetchPromises.delete(cacheKey);
    return;
  }

  adminFetchCache.clear();
  adminFetchPromises.clear();
}

async function fetchWithAdminAuth<T = unknown>(
  path: string,
  options: RequestInit = {},
  cacheOptions: {
    cacheKey?: string;
    cacheTtlMs?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const auth = getAuthClient();
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    throw new ApiError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const token = await currentUser.getIdToken();
  if (!token) {
    throw new ApiError("Unable to retrieve authentication token", 401, "TOKEN_UNAVAILABLE");
  }

  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);

  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { cacheKey, cacheTtlMs = 0, forceRefresh = false } = cacheOptions;

  if (cacheKey && cacheTtlMs > 0 && !forceRefresh) {
    const cached = adminFetchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    const pending = adminFetchPromises.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const fetchPromise = fetch(path, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  }).then(async (response) => {
    const rawBody = await response.text();
    let parsedBody: unknown = null;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }
    }

    if (!response.ok) {
      const bodyObject = typeof parsedBody === "object" && parsedBody !== null ? (parsedBody as Record<string, unknown>) : undefined;
      const message =
        (bodyObject?.error as string | undefined) ||
        (bodyObject?.message as string | undefined) ||
        (typeof parsedBody === "string" && parsedBody) ||
        `Request failed with status ${response.status}`;
      const code = typeof bodyObject?.code === "string" ? (bodyObject?.code as string) : undefined;

      throw new ApiError(message, response.status, code);
    }

    return parsedBody ?? ({} as unknown);
  });

  if (cacheKey && cacheTtlMs > 0) {
    adminFetchPromises.set(cacheKey, fetchPromise);
  }

  try {
    const data = await fetchPromise;

    if (cacheKey && cacheTtlMs > 0) {
      adminFetchCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + cacheTtlMs,
      });
      adminFetchPromises.delete(cacheKey);
    }

    return data as T;
  } catch (error) {
    if (cacheKey) {
      adminFetchPromises.delete(cacheKey);
    }
    throw error;
  }
}

export const adminApi = {
  // Verify if current user is an admin
  verifyAdminAccess: async (
    options: { forceRefresh?: boolean } = {}
  ): Promise<UserRecord> => {
    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required for admin access");
    }

    const currentUser = await adminApi.getUserByFirebaseUid(
      auth.currentUser.uid,
      options,
    );

    if (!currentUser.isAdmin) {
      throw new Error("Admin access required. User does not have admin privileges.");
    }

    return currentUser;
  },

  // Fetch user doc by Firebase UID using server API with caching
  getUserByFirebaseUid: async (
    firebaseUid: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<UserRecord> => {
    const { forceRefresh = false } = options;

    if (!firebaseUid) {
      return {
        _id: firebaseUid,
        email: "",
        name: "",
        isAdmin: false,
        createdAt: Date.now(),
      };
    }

    if (forceRefresh) {
      invalidateAdminRecord(firebaseUid);
    } else {
      const cached = getCachedAdminRecord(firebaseUid);
      if (cached) {
        return cached;
      }

      const pending = adminStatusPromises.get(firebaseUid);
      if (pending) {
        return pending;
      }
    }

    const auth = getAuthClient();
    if (!auth?.currentUser) {
      return {
        _id: firebaseUid,
        email: "",
        name: "",
        isAdmin: false,
        createdAt: Date.now(),
      };
    }

    const defaultRecord: UserRecord = {
      _id: firebaseUid,
      email: auth.currentUser.email || "",
      name: auth.currentUser.displayName || "",
      isAdmin: false,
      createdAt: Date.now(),
    };

    const fetchPromise = (async (): Promise<UserRecord> => {
      try {
        const token = await auth.currentUser!.getIdToken();
        if (!token) {
          return defaultRecord;
        }

        const response = await fetch("/api/admin/check", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: {
          userId?: string;
          email?: string;
          isAdmin?: boolean;
        } = await response.json();

        const userRecord: UserRecord = {
          _id: data.userId || firebaseUid,
          email: data.email || defaultRecord.email,
          name: auth.currentUser!.displayName || defaultRecord.name,
          isAdmin: data.isAdmin === true,
          createdAt: defaultRecord.createdAt,
        };

        setCachedAdminRecord(userRecord._id, userRecord);
        return userRecord;
      } catch (error) {
        console.error("Error fetching user data:", error);

        const fallback = getCachedAdminRecord(firebaseUid);
        if (fallback) {
          return fallback;
        }

        return defaultRecord;
      }
    })();

    adminStatusPromises.set(firebaseUid, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      adminStatusPromises.delete(firebaseUid);
    }
  },

  // Use getUserByFirebaseUid for user operations

  getAllSponsoredCompanies: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    sponsorshipType?: string;
    status?: 'active' | 'inactive' | 'all';
  }): Promise<{ companies: SponsoredCompany[]; total: number; hasMore: boolean }> => {
    // Verify admin access before fetching sponsored companies
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { page = 1, limit: pageLimit = 50, search, industry, sponsorshipType, status } = options || {};

    // Build query
    const queryRef = collection(db, "sponsors");

    // Apply filters
    const constraints: any[] = [];

    if (search && search.trim()) {
      // For search, we'll need to filter client-side since Firestore doesn't support full-text search easily
      // But we can still apply other filters server-side
    }

    if (industry && industry !== 'all') {
      constraints.push(where('industry', '==', industry));
    }

    if (sponsorshipType && sponsorshipType !== 'all') {
      constraints.push(where('sponsorshipType', '==', sponsorshipType));
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        constraints.push(where('isActive', '!=', false));
      } else if (status === 'inactive') {
        constraints.push(where('isActive', '==', false));
      }
    }

    // Add ordering and pagination
    constraints.push(orderBy('createdAt', 'desc'));

    // If search is involved, we need to load more data for client-side filtering
    // Firestore has a default limit of ~1000 documents, but we want to ensure we can search effectively
    const effectiveLimit = search && search.trim()
      ? Math.max(1000, page * pageLimit) // Load at least 1000 or enough for pagination
      : pageLimit;

    constraints.push(limit(effectiveLimit));

    if (page > 1 && !search) {
      // For pagination without search, we can optimize by loading exactly what's needed
      constraints.pop(); // Remove limit
      constraints.push(limit(page * pageLimit));
    }

    const q = query(queryRef, ...constraints);
    const snap = await getDocs(q);

    let companies = snap.docs.map((d) => {
      const data = d.data() as FireCompany;
      return {
        _id: d.id,
        name: data.name,
        aliases: Array.isArray(data.aliases) ? data.aliases : [],
        sponsorshipType: data.sponsorshipType ?? "sponsored",
        description: data.description ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
        isActive: data.isActive ?? true,
      } as unknown as SponsoredCompany;
    });

    // Apply client-side search if needed
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      companies = companies.filter(company =>
        company.name.toLowerCase().includes(searchLower) ||
        company.description?.toLowerCase().includes(searchLower) ||
        company.aliases.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination slicing for client-side pagination
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedCompanies = companies.slice(startIndex, endIndex);

    return {
      companies: paginatedCompanies,
      total: companies.length,
      hasMore: endIndex < companies.length
    };
  },

  getAllSponsoredCompaniesForExport: async (options?: {
    search?: string;
    industry?: string;
    sponsorshipType?: string;
    status?: 'active' | 'inactive' | 'all';
  }): Promise<SponsoredCompany[]> => {
    // Verify admin access before fetching sponsored companies
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { search, industry, sponsorshipType, status } = options || {};

    // Build query
    const queryRef = collection(db, "sponsors");

    // Apply filters
    const constraints: any[] = [];

    if (industry && industry !== 'all') {
      constraints.push(where('industry', '==', industry));
    }

    if (sponsorshipType && sponsorshipType !== 'all') {
      constraints.push(where('sponsorshipType', '==', sponsorshipType));
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        constraints.push(where('isActive', '!=', false));
      } else if (status === 'inactive') {
        constraints.push(where('isActive', '==', false));
      }
    }

    // Add ordering (no pagination for export)
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(queryRef, ...constraints);
    const snap = await getDocs(q);

    let companies = snap.docs.map((d) => {
      const data = d.data() as FireCompany;
      return {
        _id: d.id,
        name: data.name,
        aliases: Array.isArray(data.aliases) ? data.aliases : [],
        sponsorshipType: data.sponsorshipType ?? "sponsored",
        description: data.description ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
        isActive: data.isActive ?? true,
      } as unknown as SponsoredCompany;
    });

    // Apply client-side search if needed
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      companies = companies.filter(company =>
        company.name.toLowerCase().includes(searchLower) ||
        company.description?.toLowerCase().includes(searchLower) ||
        company.aliases.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }

    return companies;
  },

  getSponsorshipStats: async (): Promise<SponsorshipStats> => {
    // Verify admin access before fetching sponsorship stats
    await adminApi.verifyAdminAccess();

    // Call server-side API for efficient stats calculation
    const auth = getAuthClient();
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/app/sponsorship/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  addSponsoredCompany: async (data: {
    name: string;
    aliases: string[];
    sponsorshipType: string;
    description?: string;
    website?: string;
    industry?: string;
    createdBy: string;
  }): Promise<{ companyId: string }> => {
    // Verify admin access before adding sponsored companies
    const adminUser = await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const payload = {
      name: data.name,
      aliases: data.aliases ?? [],
      sponsorshipType: data.sponsorshipType,
      description: data.description ?? "",
      website: data.website ?? "",
      industry: data.industry ?? "",
      createdBy: data.createdBy || adminUser._id, // Use admin ID if not provided
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const res = await addDoc(collection(db, "sponsoredCompanies"), payload);
    return { companyId: res.id };
  },

  deleteSponsoredCompany: async (companyId: string, _requesterId: string): Promise<void> => {
    // Verify admin access before deleting sponsored companies
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "sponsoredCompanies", companyId));
  },

  updateSponsoredCompany: async (
    companyId: string,
    updates: Partial<{
      name: string;
      aliases: string[];
      sponsorshipType: string;
      description: string;
      website: string;
      industry: string;
      isActive: boolean;
    }>
  ): Promise<void> => {
    // Verify admin access before updating sponsored companies
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const updatePayload = {
      ...updates,
      updatedAt: Date.now(),
    };

    await updateDoc(doc(db, "sponsoredCompanies", companyId), updatePayload);
  },

  isUserAdmin: async (userId: string): Promise<boolean> => {
    const auth = getAuthClient();
    if (!auth?.currentUser || auth.currentUser.uid !== userId) {
      return false;
    }

    try {
      const record = await adminApi.getUserByFirebaseUid(userId);
      return record.isAdmin === true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },

  setAdminUser: async (userId: string, _requesterId: string): Promise<void> => {
    // Verify admin access before granting admin privileges
    const requestingAdmin = await adminApi.verifyAdminAccess();

    // Prevent self-demotion or self-promotion issues
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot modify your own admin status");
    }

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    void _requesterId;
    await updateDoc(doc(db, "users", userId), {
      isAdmin: true,
      updatedAt: Date.now(),
      updatedBy: requestingAdmin._id, // Track who made the change
    }).catch(async () => {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "users", userId),
        {
          isAdmin: true,
          updatedAt: Date.now(),
          updatedBy: requestingAdmin._id
        },
        { merge: true }
      );
    });

    invalidateAdminRecord(userId);
    invalidateFetchCache("admin-users");
  },

  removeAdminUser: async (
    userId: string,
    _requesterId: string
  ): Promise<void> => {
    // Verify admin access before removing admin privileges
    const requestingAdmin = await adminApi.verifyAdminAccess();

    // Prevent self-demotion
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot remove your own admin status");
    }

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    void _requesterId;
    await updateDoc(doc(db, "users", userId), {
      isAdmin: false,
      updatedAt: Date.now(),
      updatedBy: requestingAdmin._id, // Track who made the change
    }).catch(async () => {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "users", userId),
        {
          isAdmin: false,
          updatedAt: Date.now(),
          updatedBy: requestingAdmin._id
        },
        { merge: true }
      );
    });

    invalidateAdminRecord(userId);
    invalidateFetchCache("admin-users");
  },

  // User management
  getAllUsers: async (
    options: { forceRefresh?: boolean } = {}
  ): Promise<{ users: UserRecord[]; total: number }> => {
    // Verify admin access before fetching all users
    await adminApi.verifyAdminAccess();
    const response = await fetchWithAdminAuth<AdminUsersResponse>(
      "/api/app/users",
      {},
      {
        cacheKey: "admin-users",
        cacheTtlMs: 60_000,
        forceRefresh: options.forceRefresh === true,
      }
    );

    const rawUsers = Array.isArray(response?.users) ? response.users : [];
    const users: UserRecord[] = rawUsers.map((data) => ({
      _id: data._id,
      email: data.email ?? "",
      name: data.name ?? "",
      isAdmin: data.isAdmin === true,
      createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : undefined,
      lastLoginAt: typeof data.lastLoginAt === "number" ? data.lastLoginAt : undefined,
      emailVerified: data.emailVerified === true,
      subscriptionPlan: data.subscriptionPlan ?? undefined,
      subscriptionStatus: data.subscriptionStatus ?? null,
      provider: data.provider ?? null,
    }));

    const total = typeof response?.count === "number"
      ? response.count
      : typeof response?.total === "number"
        ? response.total
        : users.length;

    return { users, total };
  },

  getUserStats: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersThisMonth: number;
    usersByPlan: Record<string, number>;
    recentLogins: number;
  }> => {
    const { users } = await adminApi.getAllUsers();

    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => (u.updatedAt ?? u.lastLoginAt ?? 0) > oneWeekAgo).length,
      adminUsers: users.filter((u) => u.isAdmin === true).length,
      newUsersThisMonth: users.filter((u) => u.createdAt && u.createdAt > oneMonthAgo).length,
      usersByPlan: {
        free: users.filter((u) => !u.subscriptionPlan || u.subscriptionPlan === "free").length,
        premium: users.filter((u) => u.subscriptionPlan === "premium").length,
        enterprise: users.filter((u) => u.subscriptionPlan === "enterprise").length,
      },
      recentLogins: users.filter((u) => (u.lastLoginAt ?? u.updatedAt ?? 0) > oneWeekAgo).length,
    };

    return stats;
  },

  deleteUser: async (userId: string, _requesterId: string): Promise<void> => {
    // Verify admin access before deleting users
    const requestingAdmin = await adminApi.verifyAdminAccess();

    // Prevent self-deletion
    if (userId === requestingAdmin._id) {
      throw new Error("Cannot delete your own account");
    }

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", userId));

    invalidateFetchCache("admin-users");
    invalidateAdminRecord(userId);
  },

  // Contact submissions
  getAllContactSubmissions: async (): Promise<ContactSubmission[]> => {
    // Verify admin access before fetching contact submissions
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const snap = await getDocs(collection(db, "contacts"));
    return snap.docs.map((d) => {
      const data = d.data() as FireContact;
      return {
        _id: d.id,
        name: data.name ?? "",
        email: data.email ?? "",
        message: data.message ?? "",
        subject: data.subject ?? "",
        status: (data.status as ContactSubmission["status"]) ?? "new",
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
        response: data.response ?? "",
        respondedAt: data.respondedAt,
        respondedBy: data.respondedBy ?? "",
      } satisfies ContactSubmission;
    });
  },

  updateContactSubmission: async (
    contactId: string,
    updates: Partial<
      Pick<
        ContactSubmission,
        "status" | "response" | "respondedAt" | "respondedBy"
      >
    >
  ): Promise<void> => {
    // Verify admin access before updating contact submissions
    const adminUser = await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const payload: Partial<{
      status: ContactSubmission["status"];
      response: string;
      respondedAt: number;
      respondedBy: string;
      updatedAt: number;
    }> = {
      ...updates,
      updatedAt: Date.now(),
    };

    if (updates?.status === "responded" && !updates.respondedAt) {
      payload.respondedAt = Date.now();
    }

    // Set the responder if not provided
    if (!payload.respondedBy) {
      payload.respondedBy = adminUser._id;
    }

    await updateDoc(doc(db, "contacts", contactId), payload);
  },

  deleteContactSubmission: async (
    contactId: string
  ): Promise<void> => {
    // Verify admin access before deleting contact submissions
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "contacts", contactId));
  },

  // Sponsorship rules
  getAllSponsorshipRules: async (): Promise<SponsorshipRule[]> => {
    // Verify admin access before fetching sponsorship rules
    await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const snap = await getDocs(collection(db, "sponsorshipRules"));
    return snap.docs.map((d) => {
      const data = d.data() as FireRule;
      return {
        _id: d.id,
        name: data.name ?? "",
        description: data.description ?? "",
        jobSite: data.jobSite ?? "",
        selectors: Array.isArray(data.selectors) ? data.selectors : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        isActive: data.isActive ?? true,
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
      } as SponsorshipRule;
    });
  },

  addSponsorshipRule: async (data: {
    name: string;
    description: string;
    jobSite: string;
    selectors: string[];
    keywords: string[];
    isActive: boolean;
  }): Promise<{ ruleId: string }> => {
    // Verify admin access before adding sponsorship rules
    const adminUser = await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const payload = {
      ...data,
      selectors: data.selectors ?? [],
      keywords: data.keywords ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: adminUser._id, // Track who created the rule
    };
    const res = await addDoc(collection(db, "sponsorshipRules"), payload);
    return { ruleId: res.id };
  },

  updateSponsorshipRuleStatus: async (
    ruleId: string,
    isActive: boolean
  ): Promise<void> => {
    // Verify admin access before updating sponsorship rules
    const adminUser = await adminApi.verifyAdminAccess();

    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await updateDoc(doc(db, "sponsorshipRules", ruleId), {
      isActive,
      updatedAt: Date.now(),
      updatedBy: adminUser._id, // Track who made the change
    });
  },

  invalidateCache: (cacheKey?: string) => {
    invalidateFetchCache(cacheKey);
  },
};
