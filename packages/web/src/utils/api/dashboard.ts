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
import { apiClient } from "@/lib/api/client";

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
  // Returns a user record based on Firebase Auth - simplified to just use auth data directly
  // No need to query Firestore user doc for dashboard purposes
  getUserByFirebaseUid: async (
    uid: string
  ): Promise<{
    _id: string;
    email?: string;
    name?: string;
    createdAt: number;
  }> => {
    // Simply return the uid as the _id - no Firestore lookup needed
    // The applications/jobs APIs already use the Firebase UID as the userId
    const auth = getAuthClient();
    const currentUser = auth?.currentUser;
    
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error("Not authenticated or UID mismatch");
    }
    
    // Return user info from Firebase Auth directly
    const userRecord = {
      _id: uid, // This is the Firebase UID - same as what's stored in jobs/applications
      email: currentUser.email ?? undefined,
      name: currentUser.displayName ?? undefined,
      createdAt: Date.now(), // We don't need the actual createdAt for dashboard purposes
    };
    
    return userRecord;
  },

  // No Clerk-specific helpers; use getUserByFirebaseUid

  getApplicationsByUser: async (userId: string): Promise<Application[]> => {
    // Use server API to fetch applications - this bypasses client-side security rules
    // and uses Admin SDK on the server side
    const auth = getAuthClient();
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    
    const token = await currentUser.getIdToken();
    const applications = await apiClient.get<any[]>(`/app/applications/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Map response to Application type
    return Array.isArray(applications) ? applications.map((app: any) => ({
      _id: app._id || app.id,
      jobId: app.jobId,
      userId: app.userId,
      status: app.status,
      appliedDate: app.appliedDate ?? undefined,
      notes: app.notes ?? undefined,
      interviewDates: Array.isArray(app.interviewDates) ? app.interviewDates : undefined,
      followUpDate: app.followUpDate ?? undefined,
      createdAt: app.createdAt ?? Date.now(),
      updatedAt: app.updatedAt ?? Date.now(),
      order: typeof app.order === "number" ? app.order : undefined,
      job: app.job ? {
        _id: app.job._id || app.job.id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        url: app.job.url,
        description: app.job.description,
        salary: app.job.salary,
        salaryRange: app.job.salaryRange,
        skills: app.job.skills,
        requirements: app.job.requirements,
        benefits: app.job.benefits,
        jobType: app.job.jobType,
        experienceLevel: app.job.experienceLevel,
        remoteWork: app.job.remoteWork,
        companySize: app.job.companySize,
        industry: app.job.industry,
        postedDate: app.job.postedDate,
        applicationDeadline: app.job.applicationDeadline,
        isSponsored: !!app.job.isSponsored,
        isRecruitmentAgency: app.job.isRecruitmentAgency ?? undefined,
        sponsorshipType: app.job.sponsorshipType,
        source: app.job.source ?? "manual",
        dateFound: app.job.dateFound ?? Date.now(),
        userId: app.job.userId,
      } : undefined,
    })) : [];
  },

  getJobStats: async (userId: string): Promise<JobStats> => {
    const auth = getAuthClient();
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const token = await currentUser.getIdToken();
    const stats = await apiClient.get<JobStats>(`/app/jobs/stats/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('[dashboardApi.getJobStats] Response:', stats);
    return stats;
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
    return apiClient.post<ImportResult>("/app/jobs/import", data);
  },

  importJobsFromAPI: async (data: {
    userId: string;
    source: string;
    searchQuery?: string;
    location?: string;
  }): Promise<ImportResult> => {
    return apiClient.post<ImportResult>("/app/jobs/import-api", data);
  },

  getJobsByUser: async (userId: string): Promise<Job[]> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    const q = query(
      collection(db, "jobs"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
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
    const jobs: Job[] = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as FireJob;
      const job: Job = {
        _id: docSnap.id,
        title: data.title,
        company: data.company,
        location: data.location,
        url: data.url,
        description: data.description,
        salary: data.salary,
        salaryRange: data.salaryRange,
        skills: data.skills,
        requirements: data.requirements,
        benefits: data.benefits,
        jobType: data.jobType,
        experienceLevel: data.experienceLevel,
        remoteWork: data.remoteWork,
        companySize: data.companySize,
        industry: data.industry,
        postedDate: data.postedDate,
        applicationDeadline: data.applicationDeadline,
        isSponsored: !!data.isSponsored,
        isRecruitmentAgency: data.isRecruitmentAgency,
        sponsorshipType: data.sponsorshipType,
        source: data.source ?? "manual",
        dateFound: data.dateFound ?? data.createdAt ?? Date.now(),
        userId: data.userId,
      };
      jobs.push(job);
    }
    // Sort by dateFound desc
    jobs.sort((a, b) => (b.dateFound ?? 0) - (a.dateFound ?? 0));
    return jobs;
  },
};
