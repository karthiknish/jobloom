import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  addDoc
} from "firebase/firestore";
import { getDb } from "@/firebase/client";
import type { ResumeData, ResumeScore } from "@/components/application/types";
import type { ResumePDFOptions } from "@/lib/resumePDFGenerator";

export interface ResumeVersion {
  id: string;
  userId: string;
  data: ResumeData;
  options: ResumePDFOptions;
  score: ResumeScore;
  createdAt: number;
  name?: string;
}

export const resumeApi = {
  /**
   * Save a new version of the resume to Firestore
   */
  saveResumeVersion: async (
    userId: string, 
    data: ResumeData, 
    options: ResumePDFOptions, 
    score: ResumeScore,
    name?: string
  ): Promise<string> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const versionData = {
      userId,
      data,
      options,
      score,
      name: name || `Revision at ${new Date().toLocaleString()}`,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "resumes"), versionData);
    return docRef.id;
  },

  /**
   * Get all resume versions for a user, ordered by newest first
   */
  getResumeVersions: async (userId: string): Promise<ResumeVersion[]> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, "resumes"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        data: data.data,
        options: data.options,
        score: data.score,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        name: data.name,
      } as ResumeVersion;
    });
  },

  /**
   * Get the latest resume version for a user
   */
  getLatestResumeVersion: async (userId: string): Promise<ResumeVersion | null> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, "resumes"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      data: data.data,
      options: data.options,
      score: data.score,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
      name: data.name,
    } as ResumeVersion;
  },

  /**
   * Delete a specific resume version
   */
  deleteResumeVersion: async (versionId: string): Promise<void> => {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "resumes", versionId));
  }
};
