"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useCvEvaluator } from "@/hooks/useCvEvaluator";
import { calculateResumeScore as calculateAtsResumeScore } from "@/lib/ats";
import { calculateResumeScore } from "@/components/application/utils";
import { generateResumeId } from "@/components/application/utils";
import ResumePDFGenerator, { ResumePDFOptions } from "@/lib/resumePDFGenerator";
import { showSuccess, showError } from "@/components/ui/Toast";
import type { CareerToolsSection } from "./CareerToolsSidebar";
import type { ResumeData as CVResumeData } from "@/types/resume";
import type { ResumeScore as ATSResumeScore } from "@/lib/ats";
import type { ResumeData, ResumeScore } from "@/components/application/types";
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from "@/constants/storageKeys";
import { resumeApi, type ResumeVersion } from "@/utils/api/resumeApi";

export type ResumeMode = "ai" | "manual";
export type CoverLetterMode = "ai" | "builder";

// Default advanced resume data
const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

export function useCareerToolsState() {
  const { user, loading: authLoading } = useFirebaseAuth();
  
  // Single unified section state for sidebar navigation
  const [activeSection, setActiveSectionInternal] = useState<CareerToolsSection>(() => {
    const stored = readAndMigrateJsonFromStorage<string>(
      STORAGE_KEYS.careerToolsSection,
      LEGACY_STORAGE_KEYS.careerToolsSection
    );
    if (!stored) return "dashboard";

    // Legacy migration: consolidate old resume sections into the unified "resume" section.
    if (stored === "ai-generator") {
      try {
        writeJsonToStorage(STORAGE_KEYS.careerToolsResumeMode, "ai", LEGACY_STORAGE_KEYS.careerToolsResumeMode);
        writeJsonToStorage(STORAGE_KEYS.careerToolsSection, "resume", LEGACY_STORAGE_KEYS.careerToolsSection);
      } catch {
        // ignore
      }
      return "resume";
    }
    if (stored === "manual-builder") {
      try {
        writeJsonToStorage(STORAGE_KEYS.careerToolsResumeMode, "manual", LEGACY_STORAGE_KEYS.careerToolsResumeMode);
        writeJsonToStorage(STORAGE_KEYS.careerToolsSection, "resume", LEGACY_STORAGE_KEYS.careerToolsSection);
      } catch {
        // ignore
      }
      return "resume";
    }

    if (["dashboard", "resume", "import", "cv-optimizer", "cover-letter"].includes(stored)) {
      return stored as CareerToolsSection;
    }

    return "dashboard";
  });

  const [resumeMode, setResumeModeInternal] = useState<ResumeMode>(() => {
    const stored = readAndMigrateJsonFromStorage<string>(
      STORAGE_KEYS.careerToolsResumeMode,
      LEGACY_STORAGE_KEYS.careerToolsResumeMode
    );
    if (stored === "ai" || stored === "manual") return stored;
    return "ai";
  });

  const [coverLetterMode, setCoverLetterModeInternal] = useState<CoverLetterMode>(() => {
    const stored = readAndMigrateJsonFromStorage<string>(
      STORAGE_KEYS.careerToolsCoverLetterMode,
      LEGACY_STORAGE_KEYS.careerToolsCoverLetterMode
    );
    if (stored === "ai" || stored === "builder") return stored;
    return "ai";
  });
  
  // CV Evaluator state
  const [currentAtsScore, setCurrentAtsScore] = useState<ATSResumeScore | null>(null);
  const [currentResume, setCurrentResume] = useState<CVResumeData | null>(null);

  // Resume Builder state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [advancedResumeData, setAdvancedResumeData] = useState<ResumeData>(defaultResumeData);
  const [advancedResumeScore, setAdvancedResumeScore] = useState<ResumeScore>(calculateResumeScore(defaultResumeData));
  const [activeBuilderTab, setActiveBuilderTabInternal] = useState(() => {
    const stored = readAndMigrateJsonFromStorage<string>(
      STORAGE_KEYS.resumeBuilderTab,
      LEGACY_STORAGE_KEYS.resumeBuilderTab
    );
    if (stored && ["theme", "personal", "experience", "education", "skills", "projects", "preview"].includes(stored)) return stored;
    return "theme";
  });
  const [resumeOptions, setResumeOptions] = useState<ResumePDFOptions>({
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 11,
    font: 'helvetica'
  });
  const [versionHistory, setVersionHistory] = useState<ResumeVersion[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const showManualResumeActions = activeSection === "resume" && resumeMode === "manual";

  const setActiveSection = useCallback((section: CareerToolsSection) => {
    setActiveSectionInternal(section);
    writeJsonToStorage(STORAGE_KEYS.careerToolsSection, section, LEGACY_STORAGE_KEYS.careerToolsSection);
  }, []);

  const setResumeMode = useCallback((mode: ResumeMode) => {
    setResumeModeInternal(mode);
    writeJsonToStorage(STORAGE_KEYS.careerToolsResumeMode, mode, LEGACY_STORAGE_KEYS.careerToolsResumeMode);
  }, []);

  const setCoverLetterMode = useCallback((mode: CoverLetterMode) => {
    setCoverLetterModeInternal(mode);
    writeJsonToStorage(STORAGE_KEYS.careerToolsCoverLetterMode, mode, LEGACY_STORAGE_KEYS.careerToolsCoverLetterMode);
  }, []);

  const setActiveBuilderTab = useCallback((tab: string) => {
    setActiveBuilderTabInternal(tab);
    writeJsonToStorage(STORAGE_KEYS.resumeBuilderTab, tab, LEGACY_STORAGE_KEYS.resumeBuilderTab);
  }, []);

  type ResumeDraft = {
    v: 2;
    updatedAt: number;
    data: ResumeData;
    options: ResumePDFOptions;
  };

  const draftSaveTimeoutRef = useRef<number | null>(null);
  const suppressDraftWritesRef = useRef(false);

  const scheduleSaveDraft = useCallback((nextData: ResumeData, nextOptions: ResumePDFOptions) => {
    if (suppressDraftWritesRef.current) return;
    if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = window.setTimeout(() => {
      const payload: ResumeDraft = {
        v: 2,
        updatedAt: Date.now(),
        data: nextData,
        options: nextOptions,
      };
      writeJsonToStorage(STORAGE_KEYS.resumeDraft, payload, LEGACY_STORAGE_KEYS.resumeDraft);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
    };
  }, []);

  // CV Evaluator data
  const {
    analyses: cvAnalyses,
    stats: cvStats,
    loading: loadingData,
    error: dataError,
    refresh
  } = useCvEvaluator({
    userId: user?.uid,
    showNotifications: true,
    onError: (error) => {
      console.error('CV Evaluator error:', error);
    }
  });

  // Auto-seed empty Education entry for manual builder
  useEffect(() => {
    if (!showManualResumeActions) return;
    if (advancedResumeData.education.length > 0) return;

    setAdvancedResumeData((prev) => ({
      ...prev,
      education: [
        {
          id: generateResumeId(),
          institution: "",
          degree: "",
          field: "",
          graduationDate: "",
          gpa: "",
          honors: "",
        },
      ],
    }));
  }, [showManualResumeActions, advancedResumeData.education.length]);

  // Manual builder progress tracking
  const manualBuilderProgress = useMemo(() => {
    const hasNameEmail =
      Boolean(advancedResumeData.personalInfo.fullName.trim()) &&
      Boolean(advancedResumeData.personalInfo.email.trim());

    const hasExperience = advancedResumeData.experience.some((entry) => {
      return (
        Boolean(entry.company?.trim()) ||
        Boolean(entry.position?.trim()) ||
        Boolean(entry.description?.trim()) ||
        Boolean(entry.achievements?.some((item) => Boolean(item?.trim())))
      );
    });

    const hasEducation = advancedResumeData.education.some((entry) => {
      return (
        Boolean(entry.institution?.trim()) ||
        Boolean(entry.degree?.trim()) ||
        Boolean(entry.field?.trim()) ||
        Boolean(entry.graduationDate?.trim()) ||
        Boolean(entry.gpa?.trim()) ||
        Boolean(entry.honors?.trim())
      );
    });

    const hasSkillsCategory = advancedResumeData.skills.some((group) => {
      const hasAnySkill = group.skills?.some((skill) => Boolean(skill?.trim()));
      return Boolean(group.category?.trim()) || Boolean(hasAnySkill);
    });

    const hasProjects = advancedResumeData.projects.some((project) => {
      return (
        Boolean(project.name?.trim()) ||
        Boolean(project.description?.trim()) ||
        Boolean(project.technologies?.some((tech) => Boolean(tech?.trim())))
      );
    });

    return { hasNameEmail, hasExperience, hasEducation, hasSkillsCategory, hasProjects };
  }, [advancedResumeData]);

  const exportReadiness = useMemo(() => {
    const { hasNameEmail, hasExperience, hasEducation, hasSkillsCategory } = manualBuilderProgress;
    return {
      hasNameEmail,
      hasExperience,
      hasEducation,
      hasSkillsCategory,
      ready: hasNameEmail && hasExperience && hasEducation && hasSkillsCategory,
    };
  }, [manualBuilderProgress]);

  // Load saved resume data on mount
  useEffect(() => {
    async function initResume() {
      // Fast local hydration (draft) to preserve in-progress form edits across refresh/navigation.
      // Firestore (if available) will override as the authoritative source for signed-in users.
      suppressDraftWritesRef.current = true;
      try {
        const draft = readAndMigrateJsonFromStorage<ResumeDraft>(
          STORAGE_KEYS.resumeDraft,
          LEGACY_STORAGE_KEYS.resumeDraft
        );

        if (draft?.v === 2 && draft.data) {
          setAdvancedResumeData(draft.data);
          if (draft.options) setResumeOptions(draft.options);
          setDirty(true);
        } else {
          // Legacy fallback
          const parsedData = readAndMigrateJsonFromStorage<any>(
            STORAGE_KEYS.resumeData,
            LEGACY_STORAGE_KEYS.resumeData
          );
          if (parsedData) {
            setAdvancedResumeData(parsedData);
            setDirty(true);
          }
        }
      } finally {
        suppressDraftWritesRef.current = false;
      }

      // 1. Try Firestore first if user is logged in
      if (user?.uid) {
        try {
          const latest = await resumeApi.getLatestResumeVersion(user.uid);
          if (latest) {
            suppressDraftWritesRef.current = true;
            setAdvancedResumeData(latest.data);
            setResumeOptions(latest.options);
            setDirty(false);
            writeJsonToStorage(STORAGE_KEYS.resumeDraft, {
              v: 2,
              updatedAt: Date.now(),
              data: latest.data,
              options: latest.options,
            } satisfies ResumeDraft);
            suppressDraftWritesRef.current = false;
            return;
          }
        } catch (error) {
          console.warn('Failed to load resume from Firestore:', error);
        }
      }
    }

    if (!authLoading) {
      initResume();
    }
  }, [user?.uid, authLoading]);

  // Autosave draft whenever data/options change (debounced)
  useEffect(() => {
    scheduleSaveDraft(advancedResumeData, resumeOptions);
  }, [advancedResumeData, resumeOptions, scheduleSaveDraft]);

  // Load history when manual builder is active
  useEffect(() => {
    if (showManualResumeActions && user?.uid) {
      fetchHistory();
    }
  }, [showManualResumeActions, user?.uid]);

  const fetchHistory = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingHistory(true);
    try {
      const history = await resumeApi.getResumeVersions(user.uid);
      setVersionHistory(history);
    } catch (error) {
      console.error('Failed to fetch resume history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.uid]);

  // Update score when data changes
  useEffect(() => {
    setAdvancedResumeScore(calculateResumeScore(advancedResumeData));
  }, [advancedResumeData]);

  // Resume actions
  const saveResume = useCallback(async (name?: string) => {
    if (!user?.uid) {
      showError("Please sign in to save your resume");
      return;
    }

    setSaving(true);
    try {
      // 1. Save to Firestore (Snapshot)
      await resumeApi.saveResumeVersion(
        user.uid,
        advancedResumeData,
        resumeOptions,
        advancedResumeScore,
        name
      );

      // 2. Keep localStorage as a local secondary backup/cache
      writeJsonToStorage(STORAGE_KEYS.resumeData, advancedResumeData, LEGACY_STORAGE_KEYS.resumeData);
      writeJsonToStorage(STORAGE_KEYS.resumeDraft, {
        v: 2,
        updatedAt: Date.now(),
        data: advancedResumeData,
        options: resumeOptions,
      });
      
      setDirty(false);
      showSuccess("Resume version saved!");
      fetchHistory(); // Refresh history list
    } catch (error) {
      console.error('Save error:', error);
      showError("Failed to save resume version");
    } finally {
      setSaving(false);
    }
  }, [user?.uid, advancedResumeData, resumeOptions, advancedResumeScore, fetchHistory]);

  const restoreVersion = useCallback((version: ResumeVersion) => {
    setAdvancedResumeData(version.data);
    setResumeOptions(version.options);
    setDirty(true);
    writeJsonToStorage(STORAGE_KEYS.resumeDraft, {
      v: 2,
      updatedAt: Date.now(),
      data: version.data,
      options: version.options,
    });
    showSuccess("Resume version restored! Don't forget to save if you want to keep it as latest.");
  }, []);

  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      await resumeApi.deleteResumeVersion(versionId);
      setVersionHistory(prev => prev.filter(v => v.id !== versionId));
      showSuccess("Version removed from history");
    } catch (error) {
      showError("Failed to delete version");
    }
  }, []);

  const exportResume = useCallback(async () => {
    try {
      const validation = ResumePDFGenerator.validateResumeData(advancedResumeData as any);
      if (!validation.valid) {
        showError("Missing Information", validation.errors.join(", "));
        return;
      }
      await ResumePDFGenerator.generateAndDownloadResume(advancedResumeData, undefined, resumeOptions);
      showSuccess("Resume exported successfully!");
    } catch (error) {
      console.error('Export error:', error);
      showError("Failed to export resume");
    }
  }, [advancedResumeData, resumeOptions]);

  const previewResume = useCallback(async () => {
    try {
      const validation = ResumePDFGenerator.validateResumeData(advancedResumeData as any);
      if (!validation.valid) {
        showError("Missing Information", validation.errors.join(", "));
        return;
      }
      await ResumePDFGenerator.previewResumePDF(advancedResumeData as any, resumeOptions);
      showSuccess("Preview opened in a new tab");
    } catch (error) {
      console.error("Preview error:", error);
      showError("Failed to preview resume");
    }
  }, [advancedResumeData, resumeOptions]);

  // Update handlers
  const updateAdvancedPersonalInfo = useCallback((personalInfo: ResumeData['personalInfo']) => {
    setAdvancedResumeData(prev => ({ ...prev, personalInfo }));
    setDirty(true);
  }, []);

  const updateAdvancedExperience = useCallback((experience: ResumeData['experience']) => {
    setAdvancedResumeData(prev => ({ ...prev, experience }));
    setDirty(true);
  }, []);

  const updateAdvancedSkills = useCallback((skills: ResumeData['skills']) => {
    setAdvancedResumeData(prev => ({ ...prev, skills }));
    setDirty(true);
  }, []);

  const updateAdvancedEducation = useCallback((education: ResumeData['education']) => {
    setAdvancedResumeData(prev => ({ ...prev, education }));
    setDirty(true);
  }, []);

  const updateAdvancedProjects = useCallback((projects: ResumeData['projects']) => {
    setAdvancedResumeData(prev => ({ ...prev, projects }));
    setDirty(true);
  }, []);

  // Education helpers
  const educationItems = advancedResumeData.education.map((item) => ({
    ...item,
    gpa: item.gpa ?? "",
    honors: item.honors ?? "",
  }));

  const addEducation = useCallback(() => {
    const next = [
      ...advancedResumeData.education,
      {
        id: generateResumeId(),
        institution: "",
        degree: "",
        field: "",
        graduationDate: "",
        gpa: "",
        honors: "",
      },
    ];
    updateAdvancedEducation(next);
  }, [advancedResumeData.education, updateAdvancedEducation]);

  const removeEducation = useCallback(
    (id: string) => {
      updateAdvancedEducation(advancedResumeData.education.filter((item) => item.id !== id));
    },
    [advancedResumeData.education, updateAdvancedEducation]
  );

  const updateEducation = useCallback(
    (index: number, updater: (draft: any) => void) => {
      const next = advancedResumeData.education.map((item, idx) => {
        if (idx !== index) return item;
        const draft: any = { ...item, gpa: item.gpa ?? "", honors: item.honors ?? "" };
        updater(draft);
        return draft;
      });
      updateAdvancedEducation(next);
    },
    [advancedResumeData.education, updateAdvancedEducation]
  );

  // Project helpers
  const projectItems = advancedResumeData.projects.map((item) => ({
    ...item,
    link: item.link ?? "",
    github: item.github ?? "",
  }));

  const addProject = useCallback(() => {
    const next = [
      ...advancedResumeData.projects,
      {
        id: generateResumeId(),
        name: "",
        description: "",
        technologies: [],
        link: "",
        github: "",
      },
    ];
    updateAdvancedProjects(next);
  }, [advancedResumeData.projects, updateAdvancedProjects]);

  const removeProject = useCallback(
    (id: string) => {
      updateAdvancedProjects(advancedResumeData.projects.filter((item) => item.id !== id));
    },
    [advancedResumeData.projects, updateAdvancedProjects]
  );

  const updateProject = useCallback(
    (index: number, updater: (draft: any) => void) => {
      const next = advancedResumeData.projects.map((item, idx) => {
        if (idx !== index) return item;
        const draft: any = { ...item, link: item.link ?? "", github: item.github ?? "" };
        updater(draft);
        return draft;
      });
      updateAdvancedProjects(next);
    },
    [advancedResumeData.projects, updateAdvancedProjects]
  );

  // CV Evaluator handler
  const handleResumeUpdate = useCallback((resume: CVResumeData, targetRole?: string, industry?: string) => {
    setCurrentResume(resume);
    if (resume && targetRole) {
      const score = calculateAtsResumeScore(resume, { targetRole, industry });
      setCurrentAtsScore(score);
    }
  }, []);

  // Import handler
  const handleResumeImport = useCallback((data: any) => {
    setAdvancedResumeData(prev => ({
      ...prev,
      ...data,
      personalInfo: {
        ...prev.personalInfo,
        ...data.personalInfo,
        fullName: data.personalInfo.fullName || prev.personalInfo.fullName,
        email: data.personalInfo.email || prev.personalInfo.email,
      }
    }));
    setResumeMode("manual");
    setActiveSection("resume");
    writeJsonToStorage(STORAGE_KEYS.resumeData, data, LEGACY_STORAGE_KEYS.resumeData);
    writeJsonToStorage(STORAGE_KEYS.resumeDraft, {
      v: 2,
      updatedAt: Date.now(),
      data,
      options: resumeOptions,
    });
    showSuccess("Resume imported! Switching to builder...");
  }, [resumeOptions, setActiveSection, setResumeMode]);

  return {
    // Auth
    user,
    authLoading,
    
    // Navigation
    activeSection,
    setActiveSection,
    resumeMode,
    setResumeMode,
    coverLetterMode,
    setCoverLetterMode,
    
    // CV Evaluator
    currentAtsScore,
    setCurrentAtsScore,
    currentResume,
    cvAnalyses,
    cvStats,
    loadingData,
    dataError,
    refresh,
    handleResumeUpdate,
    
    // Resume Builder
    saving,
    dirty,
    advancedResumeData,
    setAdvancedResumeData,
    advancedResumeScore,
    activeBuilderTab,
    setActiveBuilderTab,
    resumeOptions,
    setResumeOptions,
    showManualResumeActions,
    manualBuilderProgress,
    exportReadiness,
    
    // Actions
    saveResume,
    exportResume,
    previewResume,
    handleResumeImport,
    restoreVersion,
    deleteVersion,
    fetchHistory,
    
    // History State
    versionHistory,
    isLoadingHistory,
    
    // Update handlers
    updateAdvancedPersonalInfo,
    updateAdvancedExperience,
    updateAdvancedSkills,
    updateAdvancedEducation,
    updateAdvancedProjects,
    
    // Education helpers
    educationItems,
    addEducation,
    removeEducation,
    updateEducation,
    
    // Project helpers
    projectItems,
    addProject,
    removeProject,
    updateProject,
  };
}

export type CareerToolsState = ReturnType<typeof useCareerToolsState>;
