import { jobsService } from "@/services/api/JobsService";
import { applicationsService } from "@/services/api/ApplicationsService";
import { userService } from "@/services/api/UserService";
import { Job, Application, JobStats } from "@/types/dashboard";
import { ImportJob, ImportResult } from "@/types/jobImport";

export type { Job, Application, JobStats };

export const dashboardApi = {
  getUserByFirebaseUid: (uid: string) => userService.getFirebaseUser(uid),

  getApplicationsByUser: (userId: string) => applicationsService.getByUser(userId),

  getJobStats: (userId: string) => jobsService.getStats(userId),

  updateApplicationStatus: (applicationId: string, status: string) => 
    applicationsService.updateStatus(applicationId, status),

  createJob: (data: Partial<Job>) => jobsService.create(data),

  createApplication: (data: Partial<Application>) => applicationsService.create(data),

  updateApplication: (applicationId: string, data: Partial<Application>) => 
    applicationsService.update(applicationId, data),

  deleteApplication: (applicationId: string) => applicationsService.delete(applicationId),

  restoreApplication: (applicationId: string) => applicationsService.restore(applicationId),

  permanentlyDeleteApplication: (applicationId: string) => applicationsService.hardDelete(applicationId),

  bulkSoftDeleteApplications: (applicationIds: string[]) => applicationsService.bulkSoftDelete(applicationIds),

  bulkRestoreApplications: (applicationIds: string[]) => applicationsService.bulkRestore(applicationIds),

  bulkUpdateApplicationsStatus: (applicationIds: string[], status: string) => 
    applicationsService.bulkUpdateStatus(applicationIds, status),

  bulkUpdateApplicationsFollowUp: (applicationIds: string[], followUpDate?: number) => 
    applicationsService.update(applicationIds[0], { followUpDate } as any), // Improved in service later if needed

  updateApplicationOrder: (applicationId: string, order: number) => 
    applicationsService.updateOrder(applicationId, order),

  // These will be moved to a SettingsService/UserService soon
  getSavedViews: async () => {
    const { getDb, getAuthClient } = await import("@/firebase/client");
    const { doc, getDoc } = await import("firebase/firestore");
    const db = getDb();
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid || !db) return [];
    const snap = await getDoc(doc(db, "user_settings", uid));
    const data = snap.data();
    return data?.savedViews || [];
  },

  saveSavedView: async (view: any) => {
    const { getDb, getAuthClient } = await import("@/firebase/client");
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const db = getDb();
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid || !db) throw new Error("Not authenticated");
    const ref = doc(db, "user_settings", uid);
    const snap = await getDoc(ref);
    const existing = snap.data()?.savedViews || [];
    const id = view.id || crypto.randomUUID();
    const next = [...existing.filter((v: any) => v.id !== id), { ...view, id }];
    await setDoc(ref, { savedViews: next }, { merge: true });
    return id;
  },

  deleteSavedView: async (id: string) => {
    const { getDb, getAuthClient } = await import("@/firebase/client");
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const db = getDb();
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid || !db) return;
    const ref = doc(db, "user_settings", uid);
    const snap = await getDoc(ref);
    const existing = snap.data()?.savedViews || [];
    const next = existing.filter((v: any) => v.id !== id);
    await setDoc(ref, { savedViews: next }, { merge: true });
  },

  setUserSettings: async (partial: Record<string, unknown>) => {
    const { getDb, getAuthClient } = await import("@/firebase/client");
    const { doc, setDoc } = await import("firebase/firestore");
    const db = getDb();
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid || !db) return;
    await setDoc(doc(db, "user_settings", uid), partial, { merge: true });
  },

  importJobsFromCSV: (data: { userId: string; jobs: ImportJob[] }) => 
    jobsService.importFromCSV(data.userId, data.jobs),

  importJobsFromAPI: (data: any) => jobsService.importFromAPI(data),

  parseJobFromUrl: (url: string) => jobsService.parseFromUrl(url),

  getJobsByUser: (userId: string) => jobsService.getByUser(userId),
};
