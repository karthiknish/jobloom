"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Download, 
  Palette, 
  Layout, 
  ArrowRight,
  Eye,
  ShieldCheck,
  BarChart3,
  Settings2,
  Zap,
  Lightbulb,
  History as HistoryIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonalInfoForm } from "@/components/application/PersonalInfoForm";
import { ExperienceForm } from "@/components/application/ExperienceForm";
import { SkillsForm } from "@/components/application/SkillsForm";
import { ResumeScore } from "@/components/application/ResumeScore";
import { EducationSection } from "@/components/resume/EducationSection";
import { ProjectsSection } from "@/components/resume/ProjectsSection";
import { ResumePreview } from "./ResumePreview";
import { VersionHistory } from "./VersionHistory";
import { ResumeDiffView } from "./ResumeDiffView";
import type { CareerToolsState } from "./useCareerToolsState";
import type { ResumeVersion } from "@/utils/api/resumeApi";
import type { ResumeData } from "@/components/application/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

const SAMPLE_PREVIEW_DATA: ResumeData = {
  personalInfo: {
    fullName: "Alex Thompson",
    email: "alex.thompson@example.com",
    phone: "+1 (555) 000-1234",
    location: "San Francisco, CA",
    summary:
      "Results-driven Software Engineer with 5+ years of experience in building scalable web applications. Expert in React, Node.js, and cloud architecture with a proven track record of improving system performance by 40%.",
    linkedin: "linkedin.com/in/alexthompson",
    github: "",
    website: "alexthompson.dev",
  },
  experience: [
    {
      id: "1",
      company: "TechFlow Systems",
      position: "Senior Full Stack Developer",
      location: "Remote",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      description: "Leading the core platform team to modernize legacy infrastructure.",
      achievements: [
        "Architected a microservices-based solution that reduced latency by 35%",
        "Mentored 5 junior developers and implemented rigorous code review standards",
        "Reduced cloud infrastructure costs by $12k/year through optimization",
      ],
    },
    {
      id: "2",
      company: "Innovate AI",
      position: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "June 2018",
      endDate: "Dec 2020",
      current: false,
      description: "Developed and maintained customer-facing AI dashboards.",
      achievements: [
        "Built a real-time data visualization engine using D3.js and React",
        "Improved test coverage from 45% to 92% across the main repository",
      ],
    },
  ],
  education: [
    {
      id: "1",
      institution: "Stanford University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationDate: "2018",
      gpa: "",
      honors: "Cum Laude",
    },
  ],
  skills: [
    { category: "Languages", skills: ["TypeScript", "JavaScript", "Python", "Go", "SQL"] },
    {
      category: "Frameworks",
      skills: ["React", "Next.js", "Node.js", "Express", "Tailwind CSS"],
    },
    { category: "Tools", skills: ["Docker", "AWS", "Git", "Kubernetes", "CI/CD"] },
  ],
  projects: [
    {
      id: "1",
      name: "OpenSource Analytics",
      description: "A privacy-focused analytics platform for developers.",
      technologies: ["Next.js", "PostgreSQL", "Redis"],
      link: "",
      github: "",
    },
  ],
  certifications: [],
  languages: [],
};

interface ManualBuilderSectionProps {
  state: CareerToolsState;
  tabsListClassName: string;
  tabsTriggerClassName: string;
}

export function ManualBuilderSection({ state, tabsListClassName, tabsTriggerClassName }: ManualBuilderSectionProps) {
  const {
    activeBuilderTab,
    setActiveBuilderTab,
    advancedResumeData,
    advancedResumeScore,
    manualBuilderProgress,
    exportReadiness,
    showManualResumeActions,
    resumeOptions,
    setResumeOptions,
    saving,
    saveResume,
    exportResume,
    updateAdvancedPersonalInfo,
    updateAdvancedExperience,
    updateAdvancedSkills,
    updateAdvancedEducation,
    updateAdvancedProjects,
    educationItems,
    projectItems,
    versionHistory,
    isLoadingHistory,
    restoreVersion,
    deleteVersion,
  } = state;

  const [isPendingTabChange, startTabTransition] = useTransition();

  const [diffOpen, setDiffOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{v1: ResumeVersion | null, v2: ResumeVersion | null}>({
    v1: null,
    v2: null
  });

  const handleCompare = (v1: ResumeVersion, v2: ResumeVersion) => {
    setCompareVersions({ v1, v2 });
    setDiffOpen(true);
  };

  const previewData: ResumeData = useMemo(() => {
    if (activeBuilderTab === "theme") return SAMPLE_PREVIEW_DATA;
    return {
      ...advancedResumeData,
      education: educationItems as any,
      projects: projectItems as any,
    };
  }, [activeBuilderTab, advancedResumeData, educationItems, projectItems]);

  const deferredPreviewData = useDeferredValue(previewData);
  const deferredResumeOptions = useDeferredValue(resumeOptions);

  const templates = [
    { id: 'modern', name: 'Modern', desc: 'Clean and professional' },
    { id: 'classic', name: 'Classic', desc: 'Traditional and elegant' },
    { id: 'creative', name: 'Creative', desc: 'Bold and unique' },
    { id: 'executive', name: 'Executive', desc: 'High-level and formal' },
    { id: 'technical', name: 'Technical', desc: 'Skills-focused' },
  ];

  const colorSchemes = [
    { id: 'hireall', name: 'Hireall Teal', color: 'bg-[#10B77F]' },
    { id: 'blue', name: 'Professional Blue', color: 'bg-blue-600' },
    { id: 'gray', name: 'Elegant Gray', color: 'bg-slate-700' },
    { id: 'green', name: 'Nature Green', color: 'bg-emerald-600' },
    { id: 'purple', name: 'Creative Purple', color: 'bg-purple-600' },
    { id: 'orange', name: 'Warm Orange', color: 'bg-orange-600' },
  ];

  const [openSidebarItem, setOpenSidebarItem] = useState<string | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const sidebarItems = [
    { id: 'readiness', icon: ShieldCheck, label: 'Readiness', color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'score', icon: BarChart3, label: 'Resume Score', color: 'text-primary', bg: 'bg-primary/5' },
    { id: 'settings', icon: Settings2, label: 'Export Settings', color: 'text-slate-600', bg: 'bg-slate-50' },
    { id: 'history', icon: HistoryIcon, label: 'Version History', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'actions', icon: Zap, label: 'Quick Actions', color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'tips', icon: Lightbulb, label: 'Pro Tips', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  const sidebarIcons: Record<string, React.ReactNode> = {
    history: (
      <VersionHistory 
        versions={versionHistory}
        isLoading={isLoadingHistory}
        onRestore={restoreVersion}
        onDelete={deleteVersion}
        onCompare={handleCompare}
      />
    )
  };

  return (
    <div className="space-y-6">
      {/* Top Sidebar - Horizontal Icon Bar */}
      <TooltipProvider delayDuration={150}>
        <div className="flex items-center justify-center gap-4 p-2 bg-white/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm sticky top-20 z-[100]">
          {sidebarItems.map((item) => (
            <div 
              key={item.id}
              className="relative"
            >
              {item.id === 'history' ? (
                sidebarIcons.history
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setOpenSidebarItem((prev) => (prev === item.id ? null : item.id))}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        openSidebarItem === item.id ? cn(item.bg, item.color, "scale-110 shadow-sm") : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{item.label}</TooltipContent>
                </Tooltip>
              )}

            {/* Floating Card Content - Drops Down */}
            <AnimatePresence>
              {openSidebarItem === item.id && item.id !== 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[380px] pointer-events-none z-[110]"
                >
                  {item.id === 'readiness' && showManualResumeActions && (
                    <Card className="pointer-events-auto shadow-2xl border-primary/10">
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
                      </CardContent>
                    </Card>
                  )}

                  {item.id === 'score' && (
                    <Card className="pointer-events-auto shadow-2xl border-primary/10">
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
                  )}

                  {item.id === 'settings' && (
                    <Card className="pointer-events-auto shadow-2xl border-primary/10">
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
                  )}

                  {item.id === 'actions' && (
                    <Card className="pointer-events-auto shadow-2xl border-primary/10">
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
                  )}

                  {item.id === 'tips' && (
                    <Card className="pointer-events-auto shadow-2xl border-primary/10 bg-white">
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
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          ))}
        </div>
      </TooltipProvider>

      {(() => {
        const builderTabs = (
          <Tabs
            value={activeBuilderTab}
            onValueChange={(v) => startTabTransition(() => setActiveBuilderTab(v as any))}
            className="space-y-4"
          >
            {/* Mobile Navigation - Dropdown for better responsiveness */}
            <div className="lg:hidden mb-4">
              <Select value={activeBuilderTab} onValueChange={(v) => startTabTransition(() => setActiveBuilderTab(v as any))}>
                <SelectTrigger className="w-full h-14 bg-white border-border/50 shadow-md rounded-xl px-4 focus:ring-2 focus:ring-primary/20">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex flex-col items-start">
                      <span className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">Current Step</span>
                      <div className="text-sm font-bold text-foreground">
                        <SelectValue />
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-2xl z-[200]">
                  <SelectItem value="theme" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Theme & Template</SelectItem>
                  <SelectItem value="personal" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Personal Info</SelectItem>
                  <SelectItem value="experience" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Work Experience</SelectItem>
                  <SelectItem value="education" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Education</SelectItem>
                  <SelectItem value="skills" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Skills</SelectItem>
                  <SelectItem value="projects" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Projects</SelectItem>
                  <SelectItem value="preview" className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg">Live Preview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Navigation - Standard Tabs */}
            <div className="hidden lg:block sticky top-0 z-20 -mx-2 px-2 pt-2 pb-3 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <TabsList className={cn("flex flex-wrap h-auto p-1 bg-muted/50 gap-1", tabsListClassName)}>
                <TabsTrigger value="theme" className={cn("flex-1 min-w-[80px]", tabsTriggerClassName)}>Theme</TabsTrigger>
                <TabsTrigger value="personal" className={cn("flex-1 min-w-[80px]", tabsTriggerClassName)}>Personal</TabsTrigger>
                <TabsTrigger value="experience" className={cn("flex-1 min-w-[100px]", tabsTriggerClassName)}>Experience</TabsTrigger>
                <TabsTrigger value="education" className={cn("flex-1 min-w-[100px]", tabsTriggerClassName)}>Education</TabsTrigger>
                <TabsTrigger value="skills" className={cn("flex-1 min-w-[80px]", tabsTriggerClassName)}>Skills</TabsTrigger>
                <TabsTrigger value="projects" className={cn("flex-1 min-w-[80px]", tabsTriggerClassName)}>Projects</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="theme">
              <Card className="bg-gradient-to-br from-muted/20 to-transparent border-muted/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Choose Your Theme
                  </CardTitle>
                  <CardDescription>
                    Select a template and color scheme that best represents your professional brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Template Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      1. Select Template
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setResumeOptions(prev => ({ ...prev, template: t.id as any }))}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                            resumeOptions.template === t.id 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "border-muted hover:border-muted-foreground/20 bg-white"
                          )}
                        >
                          <span className="font-bold text-sm">{t.name}</span>
                          <span className="text-xs text-muted-foreground mt-1">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      2. Select Color Scheme
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {colorSchemes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setResumeOptions(prev => ({ ...prev, colorScheme: c.id as any }))}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                            resumeOptions.colorScheme === c.id 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "border-muted hover:border-muted-foreground/20 bg-white"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded-full shadow-inner", c.color)} />
                          <span className="font-bold text-xs">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button onClick={() => startTabTransition(() => setActiveBuilderTab("personal"))} className="gap-2">
                      Start Building Your Resume
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal">
              <Card className="bg-gradient-to-br from-muted/20 to-transparent border-muted/40">
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
                  <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => setActiveBuilderTab("theme")}>
                      ← Back to Theme
                    </Button>
                    <Button onClick={() => startTabTransition(() => setActiveBuilderTab("experience"))}>
                      Continue to Experience →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card className="bg-gradient-to-br from-transparent to-muted/20 border-muted/40">
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
                    <Button onClick={() => startTabTransition(() => setActiveBuilderTab("education"))}>
                      Continue to Education →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education">
              <Card className="bg-gradient-to-br from-muted/20 to-transparent border-muted/40">
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>
                    Add your degrees, certifications, and academic achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EducationSection
                    data={educationItems as any}
                    onChange={updateAdvancedEducation}
                  />
                  <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => setActiveBuilderTab("experience")}>
                      ← Back to Experience
                    </Button>
                    <Button onClick={() => startTabTransition(() => setActiveBuilderTab("skills"))}>
                      Continue to Skills →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills">
              <Card className="bg-gradient-to-br from-transparent to-muted/20 border-muted/40">
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
                    <Button onClick={() => startTabTransition(() => setActiveBuilderTab("projects"))}>
                      Continue to Projects →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card className="bg-gradient-to-br from-muted/20 to-transparent border-muted/40">
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    Add 1-3 key projects that prove your impact (optional, but recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProjectsSection
                    data={projectItems as any}
                    onChange={updateAdvancedProjects}
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

            {!isDesktop && (
              <TabsContent value="preview" className="lg:hidden">
                <ResumePreview 
                  data={deferredPreviewData as any}
                  options={deferredResumeOptions}
                />
              </TabsContent>
            )}
          </Tabs>
        );

        if (!isDesktop) {
          return (
            <div className="flex flex-col gap-6 relative">
              {/* Main Content */}
              <div className="flex-1 min-w-0 space-y-6">
                {builderTabs}
              </div>
            </div>
          );
        }

        return (
          <div className="relative h-[calc(100vh-140px)]">
            <ResizablePanelGroup orientation="horizontal" className="gap-0 h-full">
              <ResizablePanel
                defaultSize={40}
                minSize={30}
                className="min-w-0 overflow-auto pr-3"
              >
                <div className="max-w-[760px] mx-auto pt-2">
                  {builderTabs}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="mx-2 bg-transparent hover:bg-primary/20 transition-colors" />

              <ResizablePanel
                defaultSize={60}
                minSize={40}
                className="min-w-0 overflow-hidden"
              >
                <div className="h-full overflow-hidden rounded-2xl border border-border/50 bg-white shadow-xl flex flex-col">
                  <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Live Preview
                    </span>
                    <Badge variant="outline" className="text-xxs font-bold">Real-time</Badge>
                  </div>
                  <div className="relative p-3 flex-1 overflow-auto overscroll-contain scrollbar-hide">
                    {isPendingTabChange && (
                      <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-start justify-end p-3 pointer-events-none">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                          Updating preview…
                        </div>
                      </div>
                    )}
                    <div className="w-full flex justify-center">
                      <ResumePreview 
                        data={deferredPreviewData as any}
                        options={deferredResumeOptions}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        );
      })()}

      <ResumeDiffView 
        open={diffOpen}
        onOpenChange={setDiffOpen}
        v1={compareVersions.v1}
        v2={compareVersions.v2}
      />
    </div>
  );
}
