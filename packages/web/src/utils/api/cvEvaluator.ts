// utils/api/cvEvaluator.ts
import type { CvAnalysis } from "../../types/convex";
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

export const cvEvaluatorApi = {
  // Temporary shim during migration: treat Firebase UID like old Clerk ID
  getUserByFirebaseUid: async (uid: string): Promise<UserRecord> => {
    const db = getDb();
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
  },

  // Backward alias removed; use getUserByFirebaseUid

  getUserCvAnalyses: async (userId: string): Promise<CvAnalysis[]> => {
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
      const x = d.data() as FireCv;
      return {
        _id: d.id,
        userId: x.userId,
        fileName: x.fileName ?? "",
        fileSize: x.fileSize ?? 0,
        createdAt: x.createdAt ?? Date.now(),
        analysisStatus: x.analysisStatus ?? "completed",
        overallScore: x.overallScore ?? undefined,
        strengths: Array.isArray(x.strengths) ? x.strengths : [],
        atsCompatibility: x.atsCompatibility ?? undefined,
        errorMessage: x.errorMessage ?? undefined,
      } as CvAnalysis;
    });
  },

  getCvAnalysisStats: async (userId: string): Promise<CvStats> => {
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
      const x = d.data() as FireCv;
      total += 1;
      const status = x.analysisStatus ?? "completed";
      if (status === "completed") completed += 1;
      if (typeof x.overallScore === "number") sumScore += x.overallScore;
      if (Array.isArray(x.keywords)) keywordSum += x.keywords.length;
      const candidate: CvAnalysis = {
        _id: d.id,
        userId: x.userId,
        fileName: x.fileName ?? "",
        fileSize: x.fileSize ?? 0,
        createdAt: x.createdAt ?? Date.now(),
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
  },

  deleteCvAnalysis: async (analysisId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "cvAnalyses", analysisId));
  },
};
