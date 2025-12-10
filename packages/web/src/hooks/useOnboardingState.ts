"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "@/firebase/client";

export interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedDashboardTour: boolean;
  hasCompletedCvTour: boolean;
  hasAddedFirstJob: boolean;
  hasUploadedCv: boolean;
  hasConnectedExtension: boolean;
  hasAppliedToJob: boolean;
}

const LOCAL_STORAGE_KEY = "hireall:onboarding";

const defaultState: OnboardingState = {
  hasSeenWelcome: false,
  hasCompletedDashboardTour: false,
  hasCompletedCvTour: false,
  hasAddedFirstJob: false,
  hasUploadedCv: false,
  hasConnectedExtension: false,
  hasAppliedToJob: false,
};

export function useOnboardingState() {
  const { user } = useFirebaseAuth();
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from Firebase on user change
  useEffect(() => {
    async function loadFromFirebase() {
      if (!user?.uid) {
        // No user, try localStorage
        if (typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              setState({ ...defaultState, ...JSON.parse(saved) });
            }
          } catch {
            // Invalid JSON
          }
        }
        setIsLoaded(true);
        return;
      }

      try {
        const db = getDb();
        if (!db) {
          throw new Error("Firestore not initialized");
        }
        const userSettingsRef = doc(db, "user_settings", user.uid);
        const docSnap = await getDoc(userSettingsRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const onboarding = data?.onboarding || {};
          setState({ ...defaultState, ...onboarding });
          
          // Sync to localStorage for offline access
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(onboarding));
          }
        } else {
          // No Firebase data, check localStorage
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              const parsed = { ...defaultState, ...JSON.parse(saved) };
              setState(parsed);
              // Migrate localStorage data to Firebase
              await setDoc(userSettingsRef, { onboarding: parsed }, { merge: true });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding state from Firebase:", error);
        // Fallback to localStorage
        if (typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              setState({ ...defaultState, ...JSON.parse(saved) });
            }
          } catch {
            // Invalid JSON
          }
        }
      }
      
      setIsLoaded(true);
    }

    loadFromFirebase();
  }, [user?.uid]);

  // Save state to Firebase (debounced)
  const saveToFirebase = useCallback(async (newState: OnboardingState) => {
    if (!user?.uid) return;

    try {
      const db = getDb();
      if (!db) {
        console.error("Firestore not initialized");
        return;
      }
      const userSettingsRef = doc(db, "user_settings", user.uid);
      await updateDoc(userSettingsRef, { onboarding: newState }).catch(async () => {
        // Document might not exist, create it
        await setDoc(userSettingsRef, { onboarding: newState }, { merge: true });
      });
    } catch (error) {
      console.error("Failed to save onboarding state to Firebase:", error);
    }
  }, [user?.uid]);

  // Save state (localStorage immediately, Firebase debounced)
  const saveState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => {
      const updated = { ...prev, ...updates };
      
      // Save to localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      
      // Debounce Firebase save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToFirebase(updated);
      }, 1000);
      
      return updated;
    });
  }, [saveToFirebase]);

  // Convenience methods
  const markWelcomeSeen = useCallback(() => {
    saveState({ hasSeenWelcome: true });
  }, [saveState]);

  const markDashboardTourComplete = useCallback(() => {
    saveState({ hasCompletedDashboardTour: true });
  }, [saveState]);

  const markCvTourComplete = useCallback(() => {
    saveState({ hasCompletedCvTour: true });
  }, [saveState]);

  const markFirstJobAdded = useCallback(() => {
    saveState({ hasAddedFirstJob: true });
  }, [saveState]);

  const markCvUploaded = useCallback(() => {
    saveState({ hasUploadedCv: true });
  }, [saveState]);

  const markExtensionConnected = useCallback(() => {
    saveState({ hasConnectedExtension: true });
  }, [saveState]);

  const markJobApplied = useCallback(() => {
    saveState({ hasAppliedToJob: true });
  }, [saveState]);

  const resetOnboarding = useCallback(async () => {
    setState(defaultState);
    
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem("hireall:welcome_seen");
      localStorage.removeItem("hireall:completed_tours");
    }
    
    // Clear Firebase
    if (user?.uid) {
      try {
        const db = getDb();
        if (!db) {
          console.error("Firestore not initialized");
          return;
        }
        const userSettingsRef = doc(db, "user_settings", user.uid);
        await updateDoc(userSettingsRef, { onboarding: defaultState });
      } catch (error) {
        console.error("Failed to reset onboarding in Firebase:", error);
      }
    }
  }, [user?.uid]);

  // Calculate completion percentage
  const completionItems = [
    state.hasSeenWelcome,
    state.hasCompletedDashboardTour,
    state.hasAddedFirstJob,
    state.hasUploadedCv,
  ];
  const completedCount = completionItems.filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  // Check if user is a new user (within first 7 days)
  const isNewUser = user?.metadata?.creationTime
    ? (Date.now() - new Date(user.metadata.creationTime).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  // Checklist items for UI
  const checklistItems = [
    {
      id: "tour",
      title: "Take the product tour",
      description: "Learn the basics in 2 minutes",
      completed: state.hasCompletedDashboardTour,
      action: "tour",
    },
    {
      id: "first-job",
      title: "Add your first job",
      description: "Start tracking an opportunity",
      completed: state.hasAddedFirstJob,
      action: "add-job",
    },
    {
      id: "cv-upload",
      title: "Upload your CV",
      description: "Get AI-powered feedback",
      completed: state.hasUploadedCv,
      href: "/cv-evaluator",
    },
    {
      id: "extension",
      title: "Install the extension",
      description: "One-click job import from LinkedIn",
      completed: state.hasConnectedExtension,
      href: "/extension",
    },
  ];

  return {
    ...state,
    isLoaded,
    isSaving,
    isNewUser,
    completionPercentage,
    checklistItems,
    markWelcomeSeen,
    markDashboardTourComplete,
    markCvTourComplete,
    markFirstJobAdded,
    markCvUploaded,
    markExtensionConnected,
    markJobApplied,
    resetOnboarding,
    saveState,
  };
}
