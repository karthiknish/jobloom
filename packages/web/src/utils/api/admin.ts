// utils/api/admin.ts
import type {
  SponsoredCompany,
  SponsorshipStats,
  ContactSubmission,
} from "../../types/api";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb, getAuthClient } from "@/firebase/client";

export interface UserRecord {
  _id: string;
  isAdmin?: boolean;
  email: string;
  name: string;
  createdAt: number;
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

type FireUser = {
  email?: string;
  name?: string;
  isAdmin?: boolean;
  createdAt?: number;
  updatedAt?: number;
  subscriptionPlan?: string;
};

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

export const adminApi = {
  // Fetch user doc by Firebase UID; create minimal doc if missing
  getUserByFirebaseUid: async (firebaseUid: string): Promise<UserRecord> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, "users", firebaseUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data() as FireUser;
      return {
        _id: snap.id,
        email: d.email ?? "",
        name: d.name ?? "",
        isAdmin: d.isAdmin ?? false,
        createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
      };
    }
    const auth = getAuthClient();
    const u = auth?.currentUser;
    const payload: FireUser = {
      email: u?.email ?? "",
      name: u?.displayName ?? "",
      createdAt: Date.now(),
      isAdmin: false,
    };
    const { setDoc } = await import("firebase/firestore");
    await setDoc(userRef, payload, { merge: true });
    return {
      _id: firebaseUid,
      email: payload.email ?? "",
      name: payload.name ?? "",
      isAdmin: false,
      createdAt: payload.createdAt ?? Date.now(),
    };
  },

  // Use getUserByFirebaseUid for user operations

  getAllSponsoredCompanies: async (): Promise<SponsoredCompany[]> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const snap = await getDocs(collection(db, "sponsoredCompanies"));
    return snap.docs.map((d) => {
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
  },

  getSponsorshipStats: async (): Promise<SponsorshipStats> => {
    const companies = await adminApi.getAllSponsoredCompanies();
    const industryStats: Record<string, number> = {};
    const sponsorshipTypeStats: Record<string, number> = {};
    type MinimalCompany = { industry?: string; sponsorshipType?: string };
    companies.forEach((c) => {
      const mc = c as unknown as MinimalCompany;
      const ind = mc.industry || "Unknown";
      industryStats[ind] = (industryStats[ind] ?? 0) + 1;
      const type = mc.sponsorshipType || "sponsored";
      sponsorshipTypeStats[type] = (sponsorshipTypeStats[type] ?? 0) + 1;
    });
    return {
      totalSponsoredCompanies: companies.length,
      industryStats,
      sponsorshipTypeStats,
    };
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
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const payload = {
      name: data.name,
      aliases: data.aliases ?? [],
      sponsorshipType: data.sponsorshipType,
      description: data.description ?? "",
      website: data.website ?? "",
      industry: data.industry ?? "",
      createdBy: data.createdBy,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const res = await addDoc(collection(db, "sponsoredCompanies"), payload);
    return { companyId: res.id };
  },

  deleteSponsoredCompany: async (companyId: string, _requesterId: string): Promise<void> => {
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
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const updatePayload = {
      ...updates,
      updatedAt: Date.now(),
    };

    await updateDoc(doc(db, "sponsoredCompanies", companyId), updatePayload);
  },

  isUserAdmin: async (userId: string): Promise<boolean> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const snap = await getDoc(doc(db, "users", userId));
    const data = snap.exists() ? (snap.data() as FireUser) : undefined;
    return !!(data && data.isAdmin === true);
  },

  setAdminUser: async (userId: string, _requesterId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    void _requesterId;
    // NOTE: No server-side enforcement; assumes UI gating.
    await updateDoc(doc(db, "users", userId), {
      isAdmin: true,
      updatedAt: Date.now(),
    }).catch(async () => {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "users", userId),
        { isAdmin: true, updatedAt: Date.now() },
        { merge: true }
      );
    });
  },

  removeAdminUser: async (
    userId: string,
    _requesterId: string
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    void _requesterId;
    await updateDoc(doc(db, "users", userId), {
      isAdmin: false,
      updatedAt: Date.now(),
    }).catch(async () => {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "users", userId),
        { isAdmin: false, updatedAt: Date.now() },
        { merge: true }
      );
    });
  },

  // User management
  getAllUsers: async (): Promise<{ users: UserRecord[]; total: number }> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => {
      const data = d.data() as FireUser;
      return {
        _id: d.id,
        email: data.email ?? "",
        name: data.name ?? "",
        isAdmin: !!data.isAdmin,
        createdAt: data.createdAt ?? Date.now(),
      } as UserRecord;
    });
    return { users, total: users.length };
  },

  getUserStats: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersThisMonth: number;
    usersByPlan: Record<string, number>;
    recentLogins: number;
  }> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => d.data() as FireUser);

    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.updatedAt && u.updatedAt > oneWeekAgo).length,
      adminUsers: users.filter(u => u.isAdmin === true).length,
      newUsersThisMonth: users.filter(u => u.createdAt && u.createdAt > oneMonthAgo).length,
      usersByPlan: {
        free: users.filter(u => !u.subscriptionPlan || u.subscriptionPlan === 'free').length,
        premium: users.filter(u => u.subscriptionPlan === 'premium').length,
        enterprise: users.filter(u => u.subscriptionPlan === 'enterprise').length,
      },
      recentLogins: users.filter(u => u.updatedAt && u.updatedAt > oneWeekAgo).length,
    };

    return stats;
  },

  deleteUser: async (userId: string, _requesterId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", userId));
  },

  // Contact submissions
  getAllContactSubmissions: async (): Promise<ContactSubmission[]> => {
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

    await updateDoc(doc(db, "contacts", contactId), payload);
  },

  deleteContactSubmission: async (
    contactId: string
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "contacts", contactId));
  },

  // Sponsorship rules
  getAllSponsorshipRules: async (): Promise<SponsorshipRule[]> => {
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
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const payload = {
      ...data,
      selectors: data.selectors ?? [],
      keywords: data.keywords ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const res = await addDoc(collection(db, "sponsorshipRules"), payload);
    return { ruleId: res.id };
  },

  updateSponsorshipRuleStatus: async (
    ruleId: string,
    isActive: boolean
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await updateDoc(doc(db, "sponsorshipRules", ruleId), {
      isActive,
      updatedAt: Date.now(),
    });
  },
};
