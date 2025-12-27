"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import type { ResumeData as AdvancedResumeData } from "@/components/application/types";
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from "@/constants/storageKeys";

// Default advanced resume data
const defaultAdvancedResumeData: AdvancedResumeData = {
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
  const [activeSection, setActiveSection] = useState<CareerToolsSection>("dashboard");
  
  // CV Evaluator state
  const [currentAtsScore, setCurrentAtsScore] = useState<ATSResumeScore | null>(null);
  const [currentResume, setCurrentResume] = useState<CVResumeData | null>(null);

  // Resume Builder state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [advancedResumeData, setAdvancedResumeData] = useState<AdvancedResumeData>(defaultAdvancedResumeData);
  const [advancedResumeScore, setAdvancedResumeScore] = useState(calculateResumeScore(defaultAdvancedResumeData));
  const [activeBuilderTab, setActiveBuilderTab] = useState("theme");
  const [resumeOptions, setResumeOptions] = useState<ResumePDFOptions>({
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 11,
    font: 'helvetica'
  });

  const showManualResumeActions = activeSection === "manual-builder";

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
    const parsedData = readAndMigrateJsonFromStorage<any>(
      STORAGE_KEYS.resumeData,
      LEGACY_STORAGE_KEYS.resumeData
    );
    if (parsedData) setAdvancedResumeData(parsedData);
  }, []);

  // Update score when data changes
  useEffect(() => {
    setAdvancedResumeScore(calculateResumeScore(advancedResumeData));
  }, [advancedResumeData]);

  // Resume actions
  const saveResume = useCallback(async () => {
    setSaving(true);
    try {
      writeJsonToStorage(STORAGE_KEYS.resumeData, advancedResumeData, LEGACY_STORAGE_KEYS.resumeData);
      await new Promise(resolve => setTimeout(resolve, 500));
      setDirty(false);
      showSuccess("Resume saved successfully!");
    } catch (error) {
      console.error('Save error:', error);
      showError("Failed to save resume");
    } finally {
      setSaving(false);
    }
  }, [advancedResumeData]);

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
  const updateAdvancedPersonalInfo = useCallback((personalInfo: AdvancedResumeData['personalInfo']) => {
    setAdvancedResumeData(prev => ({ ...prev, personalInfo }));
    setDirty(true);
  }, []);

  const updateAdvancedExperience = useCallback((experience: AdvancedResumeData['experience']) => {
    setAdvancedResumeData(prev => ({ ...prev, experience }));
    setDirty(true);
  }, []);

  const updateAdvancedSkills = useCallback((skills: AdvancedResumeData['skills']) => {
    setAdvancedResumeData(prev => ({ ...prev, skills }));
    setDirty(true);
  }, []);

  const updateAdvancedEducation = useCallback((education: AdvancedResumeData['education']) => {
    setAdvancedResumeData(prev => ({ ...prev, education }));
    setDirty(true);
  }, []);

  const updateAdvancedProjects = useCallback((projects: AdvancedResumeData['projects']) => {
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
    setActiveSection("manual-builder");
    writeJsonToStorage(STORAGE_KEYS.resumeData, data, LEGACY_STORAGE_KEYS.resumeData);
    showSuccess("Resume imported! Switching to builder...");
  }, []);

  return {
    // Auth
    user,
    authLoading,
    
    // Navigation
    activeSection,
    setActiveSection,
    
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
