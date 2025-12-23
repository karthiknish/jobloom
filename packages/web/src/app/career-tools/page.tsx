"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { calculateResumeScore as calculateAtsResumeScore } from "@/lib/ats";
import type { ResumeData as CVResumeData } from "@/types/resume";
import type { ResumeScore as ATSResumeScore } from "@/lib/ats";
import type { ResumeData as AdvancedResumeData } from "@/components/application/types";
import { useCvEvaluator } from "@/hooks/useCvEvaluator";
import { ensureFirebaseApp } from "@/firebase/client";
import { RefreshCw, Save, Download, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/components/ui/Toast";
import { ErrorBoundaryWrapper } from "@/components/ui/error-boundary";
import { NetworkError } from "@/components/ui/error-display";
import { LoadingSpinner, LoadingPage } from "@/components/ui/loading";
import { Skeleton, SkeletonButton, SkeletonText, SkeletonCard } from "@/components/ui/loading-skeleton";

// CV Evaluator Components
import { CvUploadSection } from "@/components/cv-evaluator/CvUploadSection";
import { CvAnalysisHistory } from "@/components/CvAnalysisHistory";
import { CvImprovementTracker } from "@/components/CvImprovementTracker";
import { CvStatsOverview } from "@/components/cv-evaluator";

// Resume Builder Components
import { AIResumeGenerator } from "@/components/application/AIResumeGenerator";
import { AICoverLetterGenerator } from "@/components/application/AICoverLetterGenerator";
import { PersonalInfoForm } from "@/components/application/PersonalInfoForm";
import { ExperienceForm } from "@/components/application/ExperienceForm";
import { SkillsForm } from "@/components/application/SkillsForm";
import { ResumeScore } from "@/components/application/ResumeScore";
import { calculateResumeScore } from "@/components/application/utils";
import { generateResumeId } from "@/components/application/utils";
import ResumePDFGenerator, { ResumePDFOptions } from "@/lib/resumePDFGenerator";
import { EducationSection } from "@/components/resume/EducationSection";
import { ProjectsSection } from "@/components/resume/ProjectsSection";

function ResumeImporterSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <div className="flex flex-wrap gap-2">
            <SkeletonButton />
            <SkeletonButton className="w-32" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          <SkeletonText lines={4} />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ResumeImporter = dynamic(
  () => import("@/components/application/ResumeImporter").then((mod) => mod.ResumeImporter),
  {
    ssr: false,
    loading: () => <ResumeImporterSkeleton />,
  }
);

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

export default function CareerToolsPage() {
  const dashboardTabsListClassName =
    "bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/50 shadow-sm w-full flex flex-wrap gap-1 h-auto sm:inline-flex sm:w-auto sm:flex-nowrap";
  const dashboardTabsTriggerClassName =
    "px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md motion-control rounded-lg font-medium text-sm";

  // Ensure Firebase initialized
  useEffect(() => {
    ensureFirebaseApp();
  }, []);

  const { user, loading: authLoading } = useFirebaseAuth();
  
  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("cv-evaluator");
  
  // CV Evaluator state
  const [currentAtsScore, setCurrentAtsScore] = useState<ATSResumeScore | null>(null);
  const [currentResume, setCurrentResume] = useState<CVResumeData | null>(null);
  const [cvActiveTab, setCvActiveTab] = useState("upload");

  // Resume Builder state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [advancedResumeData, setAdvancedResumeData] = useState<AdvancedResumeData>(defaultAdvancedResumeData);
  const [advancedResumeScore, setAdvancedResumeScore] = useState(calculateResumeScore(defaultAdvancedResumeData));
  const [activeBuilderTab, setActiveBuilderTab] = useState("personal");
  const [resumeActiveTab, setResumeActiveTab] = useState("ai-generator");
  const [resumeOptions, setResumeOptions] = useState<ResumePDFOptions>({
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 11,
    font: 'helvetica'
  });

  const showManualResumeActions = activeMainTab === "resume-builder" && resumeActiveTab === "manual-builder";

  // Auto-seed an empty Education entry when entering the manual builder so PDF export isn't blocked.
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

    return {
      hasNameEmail,
      hasExperience,
      hasEducation,
      hasSkillsCategory,
      hasProjects,
    };
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

  // Load saved resume data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('hireall_resume_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAdvancedResumeData(parsedData);
      } catch (e) {
        console.error("Failed to load saved resume data", e);
      }
    }
  }, []);

  // Update advanced resume score when data changes
  useEffect(() => {
    setAdvancedResumeScore(calculateResumeScore(advancedResumeData));
  }, [advancedResumeData]);

  const saveResume = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem('hireall_resume_data', JSON.stringify(advancedResumeData));
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

  const educationItems = advancedResumeData.education.map((item) => ({
    ...item,
    gpa: item.gpa ?? "",
    honors: item.honors ?? "",
  }));

  const projectItems = advancedResumeData.projects.map((item) => ({
    ...item,
    link: item.link ?? "",
    github: item.github ?? "",
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

  const handleResumeUpdate = (resume: CVResumeData, targetRole?: string, industry?: string) => {
    setCurrentResume(resume);
    if (resume && targetRole) {
      const score = calculateAtsResumeScore(resume, { targetRole, industry });
      setCurrentAtsScore(score);
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return <LoadingPage label="Loading career tools..." />;
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <p className="mb-4">Please sign in to access Career Tools.</p>
            <Button asChild>
              <a href="/sign-in">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('Career Tools page error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
        {/* Premium background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl relative z-10"
        >
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">Career Tools</h1>
                <p className="text-base sm:text-lg text-primary-foreground/90 max-w-2xl leading-relaxed">
                  Build professional resumes, generate cover letters, and optimize your CV with AI-powered tools
                </p>
              </div>
              {showManualResumeActions ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={previewResume}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveResume()}
                    disabled={saving || !dirty}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {saving ? "Saving..." : dirty ? "Save" : "Saved"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportResume}
                    className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </Button>
                </div>
              ) : null}
            </div>
            {showManualResumeActions && dirty && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 w-fit"
              >
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-100 font-medium">Unsaved changes</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          <FeatureGate>
            {/* Main Navigation Tabs */}
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
              <TabsList className={dashboardTabsListClassName}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <TabsTrigger value="cv-evaluator" className={dashboardTabsTriggerClassName}>
                    CV Evaluator
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <TabsTrigger value="resume-builder" className={dashboardTabsTriggerClassName}>
                    Resume Builder
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <TabsTrigger value="cover-letter" className={dashboardTabsTriggerClassName}>
                    Cover Letter
                  </TabsTrigger>
                </motion.div>
              </TabsList>

              {/* CV Evaluator Tab Content */}
              <TabsContent value="cv-evaluator" className="space-y-6">
                {dataError ? (
                  <NetworkError 
                    error={dataError}
                    onRetry={() => refresh()}
                  />
                ) : (
                  <>
                    {/* Stats Overview */}
                    <CvStatsOverview 
                      cvStats={cvStats || undefined} 
                      loading={loadingData}
                    />

                    {/* CV Evaluator Sub-tabs */}
                    <Tabs value={cvActiveTab} onValueChange={setCvActiveTab} className="space-y-4">
                      <TabsList className={dashboardTabsListClassName}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <TabsTrigger value="upload" className={dashboardTabsTriggerClassName}>
                            Upload & Analyze
                          </TabsTrigger>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <TabsTrigger value="history" className={dashboardTabsTriggerClassName}>
                            History
                          </TabsTrigger>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <TabsTrigger value="progress" className={dashboardTabsTriggerClassName}>
                            Progress
                          </TabsTrigger>
                        </motion.div>
                      </TabsList>

                      <TabsContent value="upload">
                        <CvUploadSection
                          userId={user?.uid || ''}
                          onResumeUpdate={handleResumeUpdate}
                          currentResume={currentResume}
                          currentAtsScore={currentAtsScore}
                          setCurrentAtsScore={setCurrentAtsScore}
                        />
                      </TabsContent>

                      <TabsContent value="history">
                        {loadingData ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map((index) => (
                              <SkeletonCard key={index} />
                            ))}
                          </div>
                        ) : (
                          <CvAnalysisHistory analyses={cvAnalyses ?? []} />
                        )}
                      </TabsContent>

                      <TabsContent value="progress">
                        {loadingData ? (
                          <div className="text-center py-12">
                            <LoadingSpinner label="Loading progress data..." />
                          </div>
                        ) : (
                          <CvImprovementTracker analyses={cvAnalyses ?? []} />
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </TabsContent>

              {/* Resume Builder Tab Content */}
              <TabsContent value="resume-builder" className="space-y-6">
                <Tabs value={resumeActiveTab} onValueChange={setResumeActiveTab} className="space-y-4">
                  <TabsList className={dashboardTabsListClassName}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <TabsTrigger value="ai-generator" className={dashboardTabsTriggerClassName}>
                        AI Generator
                      </TabsTrigger>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <TabsTrigger value="manual-builder" className={dashboardTabsTriggerClassName}>
                        Manual Builder
                      </TabsTrigger>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <TabsTrigger value="import" className={dashboardTabsTriggerClassName}>
                        Import
                      </TabsTrigger>
                    </motion.div>
                  </TabsList>

                  <TabsContent value="ai-generator">
                    <AIResumeGenerator />
                  </TabsContent>

                  <TabsContent value="manual-builder">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Main Content */}
                      <div className="lg:col-span-3 space-y-6">
                        {/* Progress Stepper */}
                        <Card className="border-none shadow-sm bg-gradient-to-r from-muted/30 to-muted/10">
                          <CardContent className="py-4">
                            <div className="overflow-x-auto">
                              <div className="flex items-center justify-between min-w-[820px]">
                              {/* Step 1: Personal Info */}
                              <button 
                                onClick={() => setActiveBuilderTab("personal")}
                                className="flex flex-col items-center group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  activeBuilderTab === "personal" 
                                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                                    : manualBuilderProgress.hasNameEmail
                                      ? "bg-green-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                }`}>
                                  {manualBuilderProgress.hasNameEmail ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                  activeBuilderTab === "personal" ? "text-primary" : "text-muted-foreground"
                                }`}>
                                  Personal Info
                                </span>
                              </button>

                              {/* Connector */}
                              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                manualBuilderProgress.hasNameEmail
                                  ? "bg-green-500"
                                  : "bg-muted"
                              }`} />

                              {/* Step 2: Experience */}
                              <button 
                                onClick={() => setActiveBuilderTab("experience")}
                                className="flex flex-col items-center group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  activeBuilderTab === "experience" 
                                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                                    : manualBuilderProgress.hasExperience
                                      ? "bg-green-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                }`}>
                                  {manualBuilderProgress.hasExperience ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                  activeBuilderTab === "experience" ? "text-primary" : "text-muted-foreground"
                                }`}>
                                  Experience
                                </span>
                              </button>

                              {/* Connector */}
                              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                manualBuilderProgress.hasExperience
                                  ? "bg-green-500"
                                  : "bg-muted"
                              }`} />

                              {/* Step 3: Education */}
                              <button 
                                onClick={() => setActiveBuilderTab("education")}
                                className="flex flex-col items-center group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  activeBuilderTab === "education" 
                                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                                    : manualBuilderProgress.hasEducation
                                      ? "bg-green-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                }`}>
                                  {manualBuilderProgress.hasEducation ? <CheckCircle2 className="h-5 w-5" /> : "3"}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                  activeBuilderTab === "education" ? "text-primary" : "text-muted-foreground"
                                }`}>
                                  Education
                                </span>
                              </button>

                              {/* Connector */}
                              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                manualBuilderProgress.hasEducation
                                  ? "bg-green-500"
                                  : "bg-muted"
                              }`} />

                              {/* Step 4: Skills */}
                              <button 
                                onClick={() => setActiveBuilderTab("skills")}
                                className="flex flex-col items-center group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  activeBuilderTab === "skills" 
                                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                                    : manualBuilderProgress.hasSkillsCategory
                                      ? "bg-green-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                }`}>
                                  {manualBuilderProgress.hasSkillsCategory ? <CheckCircle2 className="h-5 w-5" /> : "4"}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                  activeBuilderTab === "skills" ? "text-primary" : "text-muted-foreground"
                                }`}>
                                  Skills
                                </span>
                              </button>

                              {/* Connector */}
                              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                manualBuilderProgress.hasSkillsCategory
                                  ? "bg-green-500"
                                  : "bg-muted"
                              }`} />

                              {/* Step 5: Projects */}
                              <button 
                                onClick={() => setActiveBuilderTab("projects")}
                                className="flex flex-col items-center group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  activeBuilderTab === "projects" 
                                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                                    : manualBuilderProgress.hasProjects
                                      ? "bg-green-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                }`}>
                                  {manualBuilderProgress.hasProjects ? <CheckCircle2 className="h-5 w-5" /> : "5"}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                  activeBuilderTab === "projects" ? "text-primary" : "text-muted-foreground"
                                }`}>
                                  Projects
                                </span>
                              </button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Tabs value={activeBuilderTab} onValueChange={setActiveBuilderTab} className="space-y-4">
                          <TabsList className={dashboardTabsListClassName}>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <TabsTrigger value="personal" className={dashboardTabsTriggerClassName}>
                                Personal Info
                              </TabsTrigger>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <TabsTrigger value="experience" className={dashboardTabsTriggerClassName}>
                                Experience
                              </TabsTrigger>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <TabsTrigger value="education" className={dashboardTabsTriggerClassName}>
                                Education
                              </TabsTrigger>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <TabsTrigger value="skills" className={dashboardTabsTriggerClassName}>
                                Skills
                              </TabsTrigger>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <TabsTrigger value="projects" className={dashboardTabsTriggerClassName}>
                                Projects
                              </TabsTrigger>
                            </motion.div>
                          </TabsList>

                          <TabsContent value="personal">
                            <Card>
                              <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                  Add your contact details and professional summary
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <PersonalInfoForm
                                  data={advancedResumeData.personalInfo}
                                  onChange={updateAdvancedPersonalInfo}
                                />
                                <div className="flex justify-end mt-6 pt-4 border-t">
                                  <Button onClick={() => setActiveBuilderTab("experience")}>
                                    Continue to Experience →
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          <TabsContent value="experience">
                            <Card>
                              <CardHeader>
                                <CardTitle>Work Experience</CardTitle>
                                <CardDescription>
                                  Add your professional work history
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ExperienceForm
                                  data={advancedResumeData.experience}
                                  onChange={updateAdvancedExperience}
                                />
                                <div className="flex justify-between mt-6 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setActiveBuilderTab("personal")}>
                                    ← Back to Personal Info
                                  </Button>
                                  <Button onClick={() => setActiveBuilderTab("education")}>
                                    Continue to Education →
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          <TabsContent value="education">
                            <Card>
                              <CardHeader>
                                <CardTitle>Education</CardTitle>
                                <CardDescription>
                                  Add your degrees, certifications, and academic achievements
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <EducationSection
                                  items={educationItems as any}
                                  add={addEducation}
                                  remove={removeEducation}
                                  update={updateEducation}
                                />
                                <div className="flex justify-between mt-6 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setActiveBuilderTab("experience")}>
                                    ← Back to Experience
                                  </Button>
                                  <Button onClick={() => setActiveBuilderTab("skills")}>
                                    Continue to Skills →
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          <TabsContent value="skills">
                            <Card>
                              <CardHeader>
                                <CardTitle>Skills</CardTitle>
                                <CardDescription>
                                  Showcase your technical and soft skills
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <SkillsForm
                                  data={advancedResumeData.skills}
                                  onChange={updateAdvancedSkills}
                                />
                                <div className="flex justify-between mt-6 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setActiveBuilderTab("education")}>
                                    ← Back to Education
                                  </Button>
                                  <Button onClick={() => setActiveBuilderTab("projects")}>
                                    Continue to Projects →
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          <TabsContent value="projects">
                            <Card>
                              <CardHeader>
                                <CardTitle>Projects</CardTitle>
                                <CardDescription>
                                  Add 1-3 key projects that prove your impact (optional, but recommended)
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <ProjectsSection
                                  items={projectItems as any}
                                  add={addProject}
                                  remove={removeProject}
                                  update={updateProject}
                                />
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-6 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setActiveBuilderTab("skills")}>
                                    ← Back to Skills
                                  </Button>
                                  <Button
                                    onClick={exportResume}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Resume
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-4">
                        {showManualResumeActions && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center justify-between gap-2">
                                <span>Export readiness</span>
                                {exportReadiness.ready ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Incomplete
                                  </span>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Name + email</span>
                                {exportReadiness.hasNameEmail ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">At least 1 experience</span>
                                {exportReadiness.hasExperience ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">At least 1 education</span>
                                {exportReadiness.hasEducation ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">At least 1 skills category</span>
                                {exportReadiness.hasSkillsCategory ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>

                              {!exportReadiness.ready && (
                                <p className="text-xs text-muted-foreground pt-2 border-t">
                                  Fill the missing items to enable a clean PDF export.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              Resume Score
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResumeScore score={advancedResumeScore} compact />
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Export Settings</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Template</Label>
                              <Select 
                                value={resumeOptions.template} 
                                onValueChange={(value: any) => setResumeOptions(prev => ({ ...prev, template: value }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="modern">Modern</SelectItem>
                                  <SelectItem value="classic">Classic</SelectItem>
                                  <SelectItem value="creative">Creative</SelectItem>
                                  <SelectItem value="executive">Executive</SelectItem>
                                  <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Color Scheme</Label>
                              <Select 
                                value={resumeOptions.colorScheme} 
                                onValueChange={(value: any) => setResumeOptions(prev => ({ ...prev, colorScheme: value }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hireall">Hireall (Teal)</SelectItem>
                                  <SelectItem value="blue">Professional Blue</SelectItem>
                                  <SelectItem value="gray">Elegant Gray</SelectItem>
                                  <SelectItem value="green">Nature Green</SelectItem>
                                  <SelectItem value="purple">Creative Purple</SelectItem>
                                  <SelectItem value="orange">Warm Orange</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => saveResume()}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? "Saving..." : "Save Resume"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={exportResume}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export Resume
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-muted/50 border-border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-foreground">Pro Tips</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs text-muted-foreground space-y-2">
                            <p>• Use action verbs like "Led", "Developed", "Achieved"</p>
                            <p>• Include metrics and numbers when possible</p>
                            <p>• Tailor your resume to each job application</p>
                            <p>• Keep it to 1-2 pages maximum</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="import">
                    <ResumeImporter onImport={(data) => {
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
                      setResumeActiveTab("manual-builder");
                      localStorage.setItem('hireall_resume_data', JSON.stringify(data));
                      showSuccess("Resume imported! Switching to builder...");
                    }} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Cover Letter Tab Content */}
              <TabsContent value="cover-letter" className="space-y-6">
                <AICoverLetterGenerator />
              </TabsContent>
            </Tabs>
          </FeatureGate>
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
