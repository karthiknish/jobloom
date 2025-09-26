"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Palette,
  Download,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  Code2,
  Layout,
  Save,
  ListChecks,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resumeTemplates } from "@/config/resumeTemplates";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
// Extracted resume editor sections
import { PersonalInfoSection } from "@/components/resume/PersonalInfoSection";
import { ExperienceSection } from "@/components/resume/ExperienceSection";
import { EducationSection } from "@/components/resume/EducationSection";
import { SkillsSection } from "@/components/resume/SkillsSection";
import { ProjectsSection } from "@/components/resume/ProjectsSection";

// Helper to get icon component by name
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    FileText,
    ClipboardList,
    Palette,
    Sparkles,
  };
  return icons[iconName] || FileText;
};

interface ResumeState {
  id?: string;
  templateId: string;
  version?: number;
  resumeData: {
    personalInfo: any;
    experience: any[];
    education: any[];
    skills: { category: string; skills: string[] }[];
    projects: any[];
  };
}

function getEmptyResume(): ResumeState["resumeData"] {
  return {
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
    experience: [
      {
        id: "1",
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        achievements: [""],
      },
    ],
    education: [
      {
        id: "1",
        institution: "",
        degree: "",
        field: "",
        graduationDate: "",
        gpa: "",
        honors: "",
      },
    ],
    skills: [
      { category: "Technical", skills: [] },
      { category: "Soft Skills", skills: [] },
      { category: "Languages", skills: [] },
    ],
    projects: [
      { id: "1", name: "", description: "", technologies: [], link: "", github: "" },
    ],
  };
}

export default function ApplicationPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [resume, setResume] = useState<ResumeState>({
    templateId: "modern",
    resumeData: getEmptyResume(),
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null); // will be removed after toast migration
  const [dirty, setDirty] = useState(false);
  const autosaveDelay = 1500; // ms
  const [pendingSave, setPendingSave] = useState<NodeJS.Timeout | null>(null);

  const fetchResume = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/resume", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load resume");
      const data = await res.json();
      if ((data as any).error) throw new Error((data as any).error);
      setResume({
        id: data.id,
        templateId: data.templateId,
        version: data.version,
        resumeData: data.resumeData,
      });
    } catch (e: any) {
      showError(e.message || "Could not load resume");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  // Debounced autosave (fires 1.5s after last change when dirty)
  useEffect(() => {
    if (!dirty) return;
    if (pendingSave) clearTimeout(pendingSave);
    const t = setTimeout(() => {
      saveResume({ silent: true });
    }, autosaveDelay);
    setPendingSave(t as unknown as NodeJS.Timeout);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, resume]);

  const updatePersonalInfo = (field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      resumeData: {
        ...prev.resumeData,
        personalInfo: { ...prev.resumeData.personalInfo, [field]: value },
      },
    }));
    setDirty(true);
  };

  const setResumeData = (updater: (d: ResumeState["resumeData"]) => ResumeState["resumeData"]) => {
    setResume(prev => ({ ...prev, resumeData: updater(prev.resumeData) }));
    setDirty(true);
  };

  const addExperience = () => {
    setResumeData(d => ({
      ...d,
      experience: [
        ...d.experience,
        {
          id: Date.now().toString(),
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
          achievements: [""],
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(d => ({ ...d, experience: d.experience.filter(e => e.id !== id) }));
  };

  const addProject = () => {
    setResumeData(d => ({
      ...d,
      projects: [
        ...d.projects,
        { id: Date.now().toString(), name: "", description: "", technologies: [], link: "", github: "" },
      ],
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));
  };

  const addEducation = () => {
    setResumeData(d => ({
      ...d,
      education: [
        ...d.education,
        { id: Date.now().toString(), institution: "", degree: "", field: "", graduationDate: "", gpa: "", honors: "" },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(d => ({ ...d, education: d.education.filter(e => e.id !== id) }));
  };

  const updateSkillCategory = (index: number, skills: string) => {
    setResumeData(d => ({
      ...d,
      skills: d.skills.map((g, i) => (i === index ? { ...g, skills: skills.split(",").map(s => s.trim()).filter(Boolean) } : g)),
    }));
  };

  // Update helpers for extracted components
  const updateExperienceItem = (index: number, updater: (draft: any) => void) => {
    setResumeData(d => {
      const experience = [...d.experience];
      const draft = { ...experience[index] };
      updater(draft);
      experience[index] = draft;
      return { ...d, experience };
    });
  };

  const updateEducationItem = (index: number, updater: (draft: any) => void) => {
    setResumeData(d => {
      const education = [...d.education];
      const draft = { ...education[index] };
      updater(draft);
      education[index] = draft;
      return { ...d, education };
    });
  };

  const updateProjectItem = (index: number, updater: (draft: any) => void) => {
    setResumeData(d => {
      const projects = [...d.projects];
      const draft = { ...projects[index] };
      updater(draft);
      projects[index] = draft;
      return { ...d, projects };
    });
  };

  const saveResume = async (opts: { silent?: boolean } = {}) => {
    if (!user) return;
    setSaving(true);
    if (!opts.silent) showInfo("Saving resume...");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: resume.templateId,
          resumeData: resume.resumeData,
          version: resume.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Version conflict: refetch, merge, retry once
        const latest = await fetch("/api/portfolio/resume", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (!(latest as any).resumeData) throw new Error("Conflict: could not load latest");
        // Naive merge: prefer local changes; append new array items
        const merged = { ...latest.resumeData };
        const local = resume.resumeData as any;
        for (const k of ["experience","education","skills","projects"]) {
          if (Array.isArray(local[k])) {
            const mapById = new Map<string, any>();
            (latest.resumeData as any)[k].forEach((item: any) => item?.id && mapById.set(item.id, item));
            local[k].forEach((item: any) => {
              if (item?.id) mapById.set(item.id, { ...mapById.get(item.id), ...item });
            });
            merged[k] = Array.from(mapById.values());
          }
        }
        merged.personalInfo = { ...(latest.resumeData.personalInfo||{}), ...(local.personalInfo||{}) };
        const retry = await fetch("/api/portfolio/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateId: resume.templateId, resumeData: merged, version: latest.version }),
        });
        const retryData = await retry.json();
        if (!retry.ok || (retryData as any).error) throw new Error((retryData as any).error || "Retry failed");
        setResume(r => ({ ...r, id: retryData.id, version: retryData.version, resumeData: merged }));
        showSuccess("Resume saved (merged)");
        setDirty(false);
        setSaving(false);
        return;
      }
      if (!res.ok || (data as any).error) throw new Error((data as any).error || "Save failed");
      setResume(r => ({
        ...r,
        id: data.id,
        version: data.version,
      }));
      showSuccess("Resume saved");
      setDirty(false);
    } catch (e: any) {
      showError(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const exportResume = () => {
    alert("Export coming soon – upgrade required");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4">Please sign in to access the application workspace.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white">Application Workspace</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl">
            Build and maintain your resume. Templates, editing and exports moved here from Portfolio.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button size="sm" variant={previewMode ? "outline" : "default"} onClick={() => setPreviewMode(p => !p)}>
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />} {previewMode ? "Exit Preview" : "Preview"}
            </Button>
            <Button size="sm" onClick={() => saveResume()} disabled={saving || loading}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportResume}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 gap-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form Sections (extracted components) */}
                <div className="space-y-6 lg:col-span-2">
                  <PersonalInfoSection data={resume.resumeData.personalInfo} onChange={updatePersonalInfo} />
                  <ExperienceSection
                    items={resume.resumeData.experience}
                    add={addExperience}
                    remove={removeExperience}
                    update={updateExperienceItem}
                  />
                  <EducationSection
                    items={resume.resumeData.education}
                    add={addEducation}
                    remove={removeEducation}
                    update={updateEducationItem}
                  />
                  <SkillsSection
                    groups={resume.resumeData.skills}
                    update={updateSkillCategory}
                  />
                </div>

                {/* Right: Projects */}
                <div className="space-y-6">
                  <ProjectsSection
                    items={resume.resumeData.projects}
                    add={addProject}
                    remove={removeProject}
                    update={updateProjectItem}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" /> Resume Templates</CardTitle>
                  <CardDescription>Select a template style for your generated resume.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {resumeTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setResume(r => ({ ...r, templateId: t.id }))}
                        className={cn(
                          "relative p-4 rounded-lg border text-left transition-all hover:shadow-sm bg-white",
                          resume.templateId === t.id ? "border-primary ring-2 ring-primary/30" : "border-gray-200"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {(() => {
                                const Icon = getIcon(t.icon);
                                return <Icon className="h-4 w-4" />;
                              })()}
                              {t.name}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                          </div>
                          {t.popular && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white">Popular</span>}
                        </div>
                        {resume.templateId === t.id && (
                          <div className="absolute top-1 right-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Selected</div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab (alias to focus projects only) */}
            <TabsContent value="projects" className="space-y-6">
              <p className="text-sm text-muted-foreground">Projects are editable in the Editor tab. A dedicated advanced project manager will arrive soon.</p>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Resume Preview</CardTitle>
                  <CardDescription>Live preview of your resume using the selected template.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-6 border rounded-lg shadow-sm prose max-w-none">
                    <h1 className="text-2xl font-bold mb-1">{resume.resumeData.personalInfo.fullName || "Your Name"}</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      {[resume.resumeData.personalInfo.email, resume.resumeData.personalInfo.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    {resume.resumeData.personalInfo.summary && (
                      <p className="text-sm mb-4">{resume.resumeData.personalInfo.summary}</p>
                    )}

                    {resume.resumeData.experience.some(e => e.company || e.position) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold border-b pb-1 mb-3">Experience</h2>
                        <div className="space-y-4">
                          {resume.resumeData.experience.filter(e => e.company || e.position).map(e => (
                            <div key={e.id}>
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-semibold">{e.position || "Position"}</h3>
                                  <p className="text-muted-foreground text-sm">{e.company || "Company"}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{e.startDate} - {e.endDate || "Present"}</span>
                              </div>
                              {e.description && <p className="text-sm mt-1">{e.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.resumeData.education.some(ed => ed.institution || ed.degree) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold border-b pb-1 mb-3">Education</h2>
                        <div className="space-y-4">
                          {resume.resumeData.education.filter(ed => ed.institution || ed.degree).map(ed => (
                            <div key={ed.id}>
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-semibold">{ed.degree || "Degree"}</h3>
                                  <p className="text-muted-foreground text-sm">{ed.institution || "Institution"}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{ed.graduationDate}</span>
                              </div>
                              {ed.honors && <p className="text-sm mt-1">{ed.honors}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.resumeData.projects.some(p => p.name) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold border-b pb-1 mb-3">Projects</h2>
                        <div className="space-y-4">
                          {resume.resumeData.projects.filter(p => p.name).map(p => (
                            <div key={p.id}>
                              <h3 className="font-semibold">{p.name}</h3>
                              {p.description && <p className="text-sm mt-1">{p.description}</p>}
                              {p.technologies.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">Tech: {p.technologies.join(", ")}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.resumeData.skills.some(g => g.skills.length) && (
                      <div className="mb-2">
                        <h2 className="text-xl font-semibold border-b pb-1 mb-3">Skills</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {resume.resumeData.skills.filter(g => g.skills.length).map(g => (
                            <div key={g.category}>
                              <h3 className="font-semibold text-sm mb-1">{g.category}</h3>
                              <p className="text-xs text-muted-foreground">{g.skills.join(", ")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </div>
  );
}
