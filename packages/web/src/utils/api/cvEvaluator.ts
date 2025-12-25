// utils/api/cvEvaluator.ts
import type { CvAnalysis } from "../../types/api";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { getDb, getAuthClient } from "@/firebase/client";
import { apiClient } from "@/lib/api/client";
import { FrontendApiError } from "@/lib/api/client";

export interface UserRecord {
  _id: string;
}

export interface CvStats {
  total: number;
  averageScore: number;
  averageKeywords: number;
  successRate: number;
  totalAnalyses?: number;
  completedAnalyses?: number;
  recentAnalysis?: CvAnalysis;
}

export interface UploadLimits {
  maxSize: number;
  maxSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  description: string;
}

export const cvEvaluatorApi = {
  // Temporary shim during migration: treat Firebase UID as user identifier
  getUserByFirebaseUid: async (uid: string): Promise<UserRecord> => {
    const db = getDb();
    try {
      if (!db) throw new Error("Firestore not initialized");
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { _id: snap.id };
      }
      const { setDoc } = await import("firebase/firestore");
      const auth = getAuthClient();
      const u = auth?.currentUser;
      await setDoc(
        ref,
        {
          email: u?.email ?? "",
          name: u?.displayName ?? "",
          createdAt: Date.now(),
          isAdmin: false,
        },
        { merge: true }
      );
      return { _id: uid };
    } catch (err: any) {
      // Permission denied fallback: call server route to create/fetch user with admin credentials
      const msg = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
      if (msg.includes('permission') || msg.includes('missing or insufficient permissions')) {
        const auth = getAuthClient();
        const current = auth?.currentUser;
        if (!current) throw err;
        const token = await current.getIdToken();
        const data = await apiClient.post<any>('/cv/user', {});
        return { _id: data._id || uid };
      }
      throw err;
    }
  },

  // Backward alias removed; use getUserByFirebaseUid

  getCvAnalysesByUser: async (userId: string): Promise<CvAnalysis[]> => {
    return cvEvaluatorApi.getUserCvAnalyses(userId);
  },

  getUserCvAnalyses: async (userId: string): Promise<CvAnalysis[]> => {
    try {
      // Try the new API first - the endpoint returns array directly
      const response = await apiClient.get<CvAnalysis[]>(
        `/app/cv-analysis/user/${userId}`,
        { retries: 0 }, // Don't retry - fall back to Firestore on failure
        { showGlobalError: false } // Don't show error toast
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      // Fallback to Firestore if API fails (silently for 401 errors)
      const apiError = error as FrontendApiError;
      if (apiError.status !== 401) {
        console.warn('CV Analysis API call failed, falling back to Firestore:', apiError.message);
      }
      
      const db = getDb();
      if (!db) throw new Error("Firestore not initialized");
      const q = query(
        collection(db, "cvAnalyses"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      type FireCv = {
        userId: string;
        fileName?: string;
        fileSize?: number;
        createdAt?: number;
        analysisStatus?: string;
        overallScore?: number;
        strengths?: string[];
        atsCompatibility?: unknown;
        errorMessage?: string;
      };
      return snap.docs.map((d) => {
        const x = d.data() as FireCv & { createdAt?: any };
        // Handle Firestore Timestamp objects
        let createdAtNum: number;
        const raw = x.createdAt as any;
        if (raw && typeof raw === 'object' && typeof raw.toDate === 'function') {
          createdAtNum = raw.toDate().getTime();
        } else if (typeof raw === 'number') {
          createdAtNum = raw;
        } else {
          createdAtNum = Date.now();
        }
        return {
          _id: d.id,
          userId: x.userId,
          fileName: x.fileName ?? "",
          fileSize: x.fileSize ?? 0,
          createdAt: createdAtNum,
          analysisStatus: x.analysisStatus ?? "pending",
          overallScore: x.overallScore ?? undefined,
          strengths: Array.isArray(x.strengths) ? x.strengths : [],
          atsCompatibility: x.atsCompatibility ?? undefined,
          errorMessage: x.errorMessage ?? undefined,
        } as CvAnalysis;
      });
    }
  },

  getCvAnalysisStats: async (userId: string): Promise<CvStats> => {
    try {
      const stats = await apiClient.get<CvStats>(`/app/cv-analysis/stats/${userId}`);
      return stats;
    } catch (error) {
      console.warn('CV Analysis Stats API call failed, falling back to Firestore:', error);
      const db = getDb();
      if (!db) throw new Error("Firestore not initialized");
      const q = query(
        collection(db, "cvAnalyses"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      type FireCv = {
        userId: string;
        fileName?: string;
        fileSize?: number;
        createdAt?: number;
        analysisStatus?: string;
        overallScore?: number;
        strengths?: string[];
        keywords?: string[];
        atsCompatibility?: unknown;
        errorMessage?: string;
      };
      let total = 0;
      let completed = 0;
      let sumScore = 0;
      let keywordSum = 0;
      let recent: CvAnalysis | undefined;
      snap.forEach((d) => {
        const x = d.data() as FireCv & { createdAt?: any };
        total += 1;
        const status = x.analysisStatus ?? "pending";
        if (status === "completed") completed += 1;
        if (typeof x.overallScore === "number") sumScore += x.overallScore;
        if (Array.isArray(x.keywords)) keywordSum += x.keywords.length;
        // Normalize timestamp
        let createdAtNum: number;
        const raw = x.createdAt as any;
        if (raw && typeof raw === 'object' && typeof raw.toDate === 'function') {
          createdAtNum = raw.toDate().getTime();
        } else if (typeof raw === 'number') {
          createdAtNum = raw;
        } else {
          createdAtNum = Date.now();
        }
        const candidate: CvAnalysis = {
          _id: d.id,
          userId: x.userId,
          fileName: x.fileName ?? "",
          fileSize: x.fileSize ?? 0,
          createdAt: createdAtNum,
          analysisStatus: status,
          overallScore: x.overallScore ?? undefined,
          strengths: Array.isArray(x.strengths) ? x.strengths : [],
          atsCompatibility: x.atsCompatibility ?? undefined,
          errorMessage: x.errorMessage ?? undefined,
        } as CvAnalysis;
        if (!recent || candidate.createdAt > recent.createdAt) recent = candidate;
      });
      const averageScore = total ? Math.round((sumScore / total) * 100) / 100 : 0;
      const averageKeywords = total
        ? Math.round((keywordSum / total) * 100) / 100
        : 0;
      const successRate = total ? Math.round((completed / total) * 100) : 0;
      return {
        total,
        averageScore,
        averageKeywords,
        successRate,
        totalAnalyses: total,
        completedAnalyses: completed,
        recentAnalysis: recent,
      };
    }
  },

  deleteCvAnalysis: async (analysisId: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        await apiClient.delete(`/app/cv-analysis/user/${userId}?analysisId=${analysisId}`);
        return;
      } catch (error) {
        console.warn('CV Analysis Delete API call failed, falling back to Firestore:', error);
      }
    }
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "cvAnalyses", analysisId));
  },

  getUploadLimits: async (): Promise<{ uploadLimits: UploadLimits }> => {
    return apiClient.get<{ uploadLimits: UploadLimits }>("/user/upload-limits");
  },

  uploadCv: async (
    file: File,
    payload: { userId: string; targetRole?: string; industry?: string }
  ): Promise<any> => {
    return apiClient.upload<any>("/cv/upload", file, payload);
  },
};
