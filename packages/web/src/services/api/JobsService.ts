import { apiClient } from "@/lib/api/client";
import { Job, JobStats } from "@/types/dashboard";
import { ImportJob, ImportResult } from "@/types/jobImport";
import { getDb, getAuthClient } from "@/firebase/client";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  DocumentData
} from "firebase/firestore";

export class JobsService {
  /**
   * Fetch job statistics for a user
   */
  async getStats(userId: string): Promise<JobStats> {
    return apiClient.get<JobStats>(`/app/jobs/stats/${userId}`);
  }

  /**
   * Create a new job manually in Firestore
   */
  async create(data: Partial<Job>): Promise<{ jobId: string }> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const payload = {
      ...data,
      userId: uid,
      isSponsored: !!data.isSponsored,
      isRecruitmentAgency: !!data.isRecruitmentAgency,
      source: data.source ?? "manual",
      dateFound: data.dateFound ?? Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = await addDoc(collection(db, "jobs"), payload as DocumentData);
    return { jobId: res.id };
  }

  /**
   * Fetch all jobs for a specific user from Firestore
   */
  async getByUser(userId: string): Promise<Job[]> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(collection(db, "jobs"), where("userId", "==", userId));
    const snap = await getDocs(q);
    
    const jobs: Job[] = snap.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    } as Job));

    return jobs.sort((a, b) => (b.dateFound ?? 0) - (a.dateFound ?? 0));
  }

  /**
   * Parse job details from a URL using AI
   */
  async parseFromUrl(url: string): Promise<Partial<Job>> {
    const response = await apiClient.post<{ job: Partial<Job> }>("/jobs/parse-url", { url });
    return response.job;
  }

  /**
   * Import jobs from CSV
   */
  async importFromCSV(userId: string, jobs: ImportJob[]): Promise<ImportResult> {
    return apiClient.post<ImportResult>("/app/jobs/import", { userId, jobs });
  }

  /**
   * Import jobs from an external API search
   */
  async importFromAPI(data: {
    userId: string;
    source: string;
    searchQuery?: string;
    location?: string;
  }): Promise<ImportResult> {
    return apiClient.post<ImportResult>("/app/jobs/import-api", data);
  }
}

export const jobsService = new JobsService();
