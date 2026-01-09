import { useState, useCallback, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';
import { ResumeGeneratorFormData, GeneratedResume } from './types';
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from '@/constants/storageKeys';

type ResumeOptions = {
  template:
    | 'modern'
    | 'classic'
    | 'creative'
    | 'executive'
    | 'technical'
    | 'academic'
    | 'startup'
    | 'designer'
    | 'healthcare'
    | 'legal';
  colorScheme: 'hireall' | 'blue' | 'gray' | 'green' | 'purple' | 'orange';
  fontSize: number;
  font: 'helvetica' | 'times' | 'courier';
};

type AIResumeDraft = {
  v: 1;
  updatedAt: number;
  step: number;
  formData: ResumeGeneratorFormData;
  resumeOptions: ResumeOptions;
  editedContent: string;
  isEditing: boolean;
};

export const useAIResumeState = () => {
  const { user } = useFirebaseAuth();

  const initialDraft = readAndMigrateJsonFromStorage<AIResumeDraft>(
    STORAGE_KEYS.aiResumeDraft,
    LEGACY_STORAGE_KEYS.aiResumeDraft
  );

  const [step, setStep] = useState(() => {
    const stored = initialDraft?.step;
    if (typeof stored === 'number' && stored >= 1 && stored <= 4) return stored;
    return 1;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [editedContent, setEditedContent] = useState(() => initialDraft?.editedContent ?? "");
  const [isEditing, setIsEditing] = useState(() => Boolean(initialDraft?.isEditing));

  const [formData, setFormData] = useState<ResumeGeneratorFormData>(() => {
    if (initialDraft?.formData) {
      return {
        fullName: initialDraft.formData.fullName || "",
        email: initialDraft.formData.email || "",
        phone: initialDraft.formData.phone || "",
        location: initialDraft.formData.location || "",
        linkedin: initialDraft.formData.linkedin || "",
        website: initialDraft.formData.website || "",
        jobTitle: initialDraft.formData.jobTitle || "",
        experience: initialDraft.formData.experience || "",
        skills: Array.isArray(initialDraft.formData.skills) ? initialDraft.formData.skills : [],
        education: initialDraft.formData.education || "",
        industry: initialDraft.formData.industry || "Technology",
        level: initialDraft.formData.level || "mid",
        style: initialDraft.formData.style || "modern",
        includeObjective: Boolean(initialDraft.formData.includeObjective),
      };
    }

    return {
      fullName: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
      jobTitle: "",
      experience: "",
      skills: [],
      education: "",
      industry: "Technology",
      level: "mid",
      style: "modern",
      includeObjective: true,
    };
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => {
      // Only fill from user profile if the form is still empty.
      const nextFullName = prev.fullName || user.displayName || "";
      const nextEmail = prev.email || user.email || "";
      if (nextFullName === prev.fullName && nextEmail === prev.email) return prev;
      return { ...prev, fullName: nextFullName, email: nextEmail };
    });
  }, [user]);

  const [resumeOptions, setResumeOptions] = useState<ResumeOptions>(() => {
    if (initialDraft?.resumeOptions) return initialDraft.resumeOptions;
    return {
      template: 'modern',
      colorScheme: 'hireall',
      fontSize: 11,
      font: 'helvetica',
    };
  });

  const saveTimeoutRef = useRef<number | null>(null);
  const suppressWritesRef = useRef(false);

  useEffect(() => {
    if (suppressWritesRef.current) return;
    if (typeof window === 'undefined') return;

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      const payload: AIResumeDraft = {
        v: 1,
        updatedAt: Date.now(),
        step,
        formData,
        resumeOptions,
        editedContent,
        isEditing,
      };
      writeJsonToStorage(STORAGE_KEYS.aiResumeDraft, payload, LEGACY_STORAGE_KEYS.aiResumeDraft);
    }, 250);

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [editedContent, formData, isEditing, resumeOptions, step]);

  const nextStep = useCallback(() => setStep(s => Math.min(s + 1, 4)), []);
  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 1)), []);

  const addSkill = useCallback((skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  }, [formData.skills]);

  const removeSkill = useCallback((skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  }, []);

  return {
    step,
    setStep,
    isGenerating,
    setIsGenerating,
    generatedResume,
    setGeneratedResume,
    formData,
    setFormData,
    resumeOptions,
    setResumeOptions,
    nextStep,
    prevStep,
    addSkill,
    removeSkill,
    editedContent,
    setEditedContent,
    isEditing,
    setIsEditing
  };
};
