// utils/api/dashboard.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type UpdateData,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/firebase/client";
import { ImportJob, ImportResult } from "../jobImport";
import { getAuthClient } from "@/firebase/client";

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  description?: string;
  salary?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  jobType?: string;
  experienceLevel?: string;
  remoteWork?: boolean;
  companySize?: string;
  industry?: string;
  postedDate?: string;
  applicationDeadline?: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  source: string;
  dateFound: number;
  userId: string;
}

export interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  order?: number;
  job?: Job;
}

export interface JobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
  byStatus: Record<string, number>;
}

export const dashboardApi = {
  // Returns a user document; creates one if it doesn't exist
  getUserByFirebaseUid: async (
    uid: string
  ): Promise<
    | {
        _id: string;
        email?: string;
        name?: string;
        createdAt: number;
      }
    | never
  > => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    type FireUser = { email?: string; name?: string; createdAt?: number };
    if (snap.exists()) {
      const data = snap.data() as FireUser;
      return {
        _id: snap.id,
        email: data.email,
        name: data.name,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : Date.now(),
      };
    }
    // Create a minimal user record from current auth context if available
    const auth = getAuthClient();
    const currentUser = auth?.currentUser;
    const payload: Partial<FireUser> & {
      isAdmin: boolean;
      provider: string | null;
      createdAt: number;
    } = {
      email: currentUser?.email ?? undefined,
      name: currentUser?.displayName ?? undefined,
      createdAt: Date.now(),
      isAdmin: false,
      provider: currentUser?.providerData?.[0]?.providerId ?? null,
    };
    await updateDoc(userRef, payload).catch(async () => {
      // If update failed because doc is missing, try creating via a sentinel addDoc to collection with explicit id unsupported; fallback to set via update is not allowed, use a tiny add flow
      // Since addDoc can't set a custom ID, use a transaction-like pattern: use fetch API via REST? Simpler: try set by using updateDoc through merging via setDoc when available.
    });
    // Use setDoc to ensure creation
    const { setDoc } = await import("firebase/firestore");
    await setDoc(userRef, payload, { merge: true });
    return {
      _id: uid,
      email: payload.email ?? undefined,
      name: payload.name ?? undefined,
      createdAt: payload.createdAt,
    };
  },

  // No Clerk-specific helpers; use getUserByFirebaseUid

  getApplicationsByUser: async (userId: string): Promise<Application[]> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const q = query(
      collection(db, "applications"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    type FireApp = {
      jobId: string;
      userId: string;
      status: string;
      appliedDate?: number;
      notes?: string;
      interviewDates?: number[];
      followUpDate?: number;
      createdAt?: number;
      updatedAt?: number;
      order?: number;
    };
    const apps: Application[] = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as FireApp;
      const app: Application = {
        _id: docSnap.id,
        jobId: data.jobId,
        userId: data.userId,
        status: data.status,
        appliedDate: data.appliedDate ?? undefined,
        notes: data.notes ?? undefined,
        interviewDates: Array.isArray(data.interviewDates)
          ? data.interviewDates
          : undefined,
        followUpDate: data.followUpDate ?? undefined,
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
        order: typeof data.order === "number" ? data.order : undefined,
      };
      // Join with job if present
      if (data.jobId) {
        try {
          const jobRef = doc(db, "jobs", data.jobId);
          const jobSnap = await getDoc(jobRef);
          if (jobSnap.exists()) {
            type FireJob = {
              title: string;
              company: string;
              location: string;
              url?: string;
              description?: string;
              salary?: string;
              salaryRange?: {
                min?: number;
                max?: number;
                currency?: string;
              } | null;
              skills?: string[];
              requirements?: string[];
              benefits?: string[];
              jobType?: string;
              experienceLevel?: string;
              remoteWork?: boolean;
              companySize?: string;
              industry?: string;
              postedDate?: string;
              applicationDeadline?: string;
              isSponsored?: boolean;
              isRecruitmentAgency?: boolean;
              sponsorshipType?: string;
              source?: string;
              dateFound?: number;
              createdAt?: number;
              userId: string;
            };
            const j = jobSnap.data() as FireJob;
            app.job = {
              _id: jobSnap.id,
              title: j.title,
              company: j.company,
              location: j.location,
              url: j.url,
              description: j.description,
              salary: j.salary,
              salaryRange: j.salaryRange,
              skills: j.skills,
              requirements: j.requirements,
              benefits: j.benefits,
              jobType: j.jobType,
              experienceLevel: j.experienceLevel,
              remoteWork: j.remoteWork,
              companySize: j.companySize,
              industry: j.industry,
              postedDate: j.postedDate,
              applicationDeadline: j.applicationDeadline,
              isSponsored: !!j.isSponsored,
              isRecruitmentAgency: j.isRecruitmentAgency ?? undefined,
              sponsorshipType: j.sponsorshipType,
              source: j.source ?? "manual",
              dateFound: j.dateFound ?? j.createdAt ?? Date.now(),
              userId: j.userId,
            };
          }
        } catch {}
      }
      apps.push(app);
    }
    // Sort by status then order then updatedAt desc as a general default
    apps.sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });
    return apps;
  },

  getJobStats: async (userId: string): Promise<JobStats> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    // Jobs
    const jobsQ = query(collection(db, "jobs"), where("userId", "==", userId));
    const jobsSnap = await getDocs(jobsQ);
    const totalJobs = jobsSnap.size;
    let sponsoredJobs = 0;
    let recruitmentAgencyJobs = 0;
    let jobsToday = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTs = startOfToday.getTime();
    type FireJob = {
      isSponsored?: boolean;
      isRecruitmentAgency?: boolean;
      dateFound?: number;
      createdAt?: number;
    };
    jobsSnap.forEach((d) => {
      const j = d.data() as FireJob;
      if (j.isSponsored) sponsoredJobs++;
      if (j.isRecruitmentAgency) recruitmentAgencyJobs++;
      const ts = j.dateFound ?? j.createdAt ?? 0;
      if (typeof ts === "number" && ts >= startTs) jobsToday++;
    });
    // Applications
    const appsQ = query(
      collection(db, "applications"),
      where("userId", "==", userId)
    );
    const appsSnap = await getDocs(appsQ);
    const byStatus: Record<string, number> = {};
    type FireAppStatus = { status?: string };
    appsSnap.forEach((d) => {
      const s = (d.data() as FireAppStatus).status ?? "interested";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return {
      totalJobs,
      sponsoredJobs,
      recruitmentAgencyJobs,
      jobsToday,
      totalApplications: appsSnap.size,
      byStatus,
    };
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: string
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const ref = doc(db, "applications", applicationId);
    await updateDoc(ref, { status, updatedAt: Date.now() });
  },

  createJob: async (data: Partial<Job>): Promise<{ jobId: string }> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const user = await dashboardApi.getUserByFirebaseUid(uid);
    type NewJob = Omit<Job, "_id"> & { createdAt: number; updatedAt: number };
    const payload: NewJob = {
      title: data.title ?? "",
      company: data.company ?? "",
      location: data.location ?? "",
      url: data.url ?? "",
      description: data.description ?? "",
      salary: data.salary ?? "",
      salaryRange: data.salaryRange ?? null,
      skills: data.skills ?? [],
      requirements: data.requirements ?? [],
      benefits: data.benefits ?? [],
      jobType: data.jobType ?? "",
      experienceLevel: data.experienceLevel ?? "",
      remoteWork: data.remoteWork ?? false,
      companySize: data.companySize ?? "",
      industry: data.industry ?? "",
      postedDate: data.postedDate ?? "",
      applicationDeadline: data.applicationDeadline ?? "",
      isSponsored: !!data.isSponsored,
      isRecruitmentAgency: !!data.isRecruitmentAgency,
      sponsorshipType: data.sponsorshipType ?? "",
      source: data.source ?? "manual",
      dateFound: data.dateFound ?? Date.now(),
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const res = await addDoc(
      collection(db, "jobs"),
      payload as unknown as Record<string, unknown>
    );
    return { jobId: res.id };
  },

  createApplication: async (
    data: Partial<Application>
  ): Promise<{ applicationId: string }> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const user = await dashboardApi.getUserByFirebaseUid(uid);
    type NewApp = Omit<Application, "_id" | "job">;
    const payload: NewApp = {
      jobId: (data.jobId as string) ?? "",
      userId: user._id,
      status: data.status ?? "interested",
      appliedDate: data.appliedDate ?? undefined,
      notes: data.notes ?? "",
      interviewDates: Array.isArray(data.interviewDates)
        ? data.interviewDates
        : [],
      followUpDate: data.followUpDate ?? undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const res = await addDoc(
      collection(db, "applications"),
      payload as unknown as Record<string, unknown>
    );
    return { applicationId: res.id };
  },

  updateApplication: async (
    applicationId: string,
    data: Partial<Application>
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const ref = doc(db, "applications", applicationId);
    const updatePayload: { [key: string]: unknown } = { updatedAt: Date.now() };
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.appliedDate !== undefined)
      updatePayload.appliedDate = data.appliedDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.interviewDates !== undefined)
      updatePayload.interviewDates = data.interviewDates;
    if (data.followUpDate !== undefined)
      updatePayload.followUpDate = data.followUpDate;
    if (data.jobId !== undefined) updatePayload.jobId = data.jobId;
    if (data.userId !== undefined) updatePayload.userId = data.userId;
    if (data.order !== undefined) updatePayload.order = data.order;
    await updateDoc(ref, updatePayload as unknown as UpdateData<DocumentData>);
  },

  deleteApplication: async (applicationId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "applications", applicationId));
  },

  // Bulk operations
  bulkUpdateApplicationsStatus: async (
    applicationIds: string[],
    status: string
  ): Promise<void> => {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    const now = Date.now();
    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), { status, updatedAt: now });
    });
    await batch.commit();
  },

  bulkUpdateApplicationsFollowUp: async (
    applicationIds: string[],
    followUpDate?: number
  ): Promise<void> => {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    const now = Date.now();
    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), {
        followUpDate: followUpDate ?? null,
        updatedAt: now,
      });
    });
    await batch.commit();
  },

  updateApplicationOrder: async (
    applicationId: string,
    order: number
  ): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await updateDoc(doc(db, "applications", applicationId), {
      order,
      updatedAt: Date.now(),
    });
  },

  // Saved Views in user_settings
  getSavedViews: async (): Promise<
    { id: string; name: string; filters: Record<string, unknown> }[]
  > => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const ref = doc(db, "user_settings", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data() as { savedViews?: any[] };
    return Array.isArray(data.savedViews) ? data.savedViews : [];
  },

  saveSavedView: async (view: {
    id?: string;
    name: string;
    filters: Record<string, unknown>;
  }): Promise<string> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const ref = doc(db, "user_settings", uid);
    const snap = await getDoc(ref);
    const existing = (snap.exists() && (snap.data() as any).savedViews) || [];
    const id = view.id || crypto.randomUUID();
    const next = Array.isArray(existing)
      ? [
          ...existing.filter((v: any) => v && v.id !== id),
          { id, name: view.name, filters: view.filters },
        ]
      : [{ id, name: view.name, filters: view.filters }];
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, { savedViews: next }, { merge: true });
    return id;
  },

  deleteSavedView: async (id: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const ref = doc(db, "user_settings", uid);
    const snap = await getDoc(ref);
    const existing = (snap.exists() && (snap.data() as any).savedViews) || [];
    const next = Array.isArray(existing)
      ? existing.filter((v: any) => v && v.id !== id)
      : [];
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, { savedViews: next }, { merge: true });
  },

  setUserSettings: async (partial: Record<string, unknown>): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const ref = doc(db, "user_settings", uid);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, partial, { merge: true });
  },

  importJobsFromCSV: async (data: {
    userId: string;
    jobs: ImportJob[];
  }): Promise<ImportResult> => {
    // For now, delegate to existing API route used by utils/jobImport to avoid duplication
    const res = await fetch("/api/app/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.userId, jobs: data.jobs }),
    });
    if (!res.ok) throw new Error("Failed to import jobs");
    return res.json();
  },

  importJobsFromAPI: async (data: {
    userId: string;
    source: string;
    searchQuery?: string;
    location?: string;
  }): Promise<ImportResult> => {
    const res = await fetch("/api/app/jobs/import-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to import jobs from API");
    return res.json();
  },
};