"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Download,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/components/ui/Toast";
import { ResumePreview } from "@/components/ResumePreview";

// Import refactored components
import { PersonalInfoForm } from "./components/PersonalInfoForm";
import { ExperienceForm } from "./components/ExperienceForm";
import { SkillsForm } from "./components/SkillsForm";
import { ResumeScore } from "./components/ResumeScore";
import EducationForm from "./components/EducationForm";
import ProjectsForm from "./components/ProjectsForm";
import CertificationsForm from "./components/CertificationsForm";
import LanguagesForm from "./components/LanguagesForm";

// Import types and utilities
import type { ResumeData } from "./types";
import { calculateResumeScore } from "./utils";
import { defaultResumeData, resumeSections } from "./constants";
import { resumeTemplates } from "@/config/resumeTemplates";

export default function ResumeBuilderPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"modern" | "classic" | "creative" | "minimal" | "executive" | "academic" | "tech" | "startup">("modern");
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [resumeScore, setResumeScore] = useState(calculateResumeScore(resumeData));

  // Update score when resume data changes
  useEffect(() => {
    setResumeScore(calculateResumeScore(resumeData));
  }, [resumeData]);

  // Load saved resume data
  useEffect(() => {
    if (!user) return;
    
    const loadResumeData = async () => {
      try {
        setLoading(true);
        // TODO: Load from Firestore
        // const doc = await getDoc(doc(db, "resumes", user.uid));
        // if (doc.exists()) {
        //   setResumeData(doc.data());
        // }
      } catch (error) {
        showError("Load failed", "Unable to load your resume data");
      } finally {
        setLoading(false);
      }
    };

    loadResumeData();
  }, [user]);

  // Save resume data
  const saveResume = useCallback(async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      // TODO: Save to Firestore
      // await setDoc(doc(db, "resumes", user.uid), resumeData);
      showSuccess("Resume saved", "Your resume has been saved successfully");
    } catch (error) {
      showError("Save failed", "Unable to save your resume");
    } finally {
      setSaving(false);
    }
  }, [user, resumeData]);

  // Download resume as PDF
  const downloadResume = useCallback(() => {
    // TODO: Implement PDF download
    showSuccess("Download started", "Your resume is being downloaded");
  }, []);

  // Update personal info
  const updatePersonalInfo = useCallback((personalInfo: ResumeData['personalInfo']) => {
    setResumeData(prev => ({ ...prev, personalInfo }));
  }, []);

  // Update experience
  const updateExperience = useCallback((experience: ResumeData['experience']) => {
    setResumeData(prev => ({ ...prev, experience }));
  }, []);

  // Update skills
  const updateSkills = useCallback((skills: ResumeData['skills']) => {
    setResumeData(prev => ({ ...prev, skills }));
  }, []);

  // Update education
  const updateEducation = useCallback((education: ResumeData['education']) => {
    setResumeData(prev => ({ ...prev, education }));
  }, []);

  // Update projects
  const updateProjects = useCallback((projects: ResumeData['projects']) => {
    setResumeData(prev => ({ ...prev, projects }));
  }, []);

  // Update certifications
  const updateCertifications = useCallback((certifications: ResumeData['certifications']) => {
    setResumeData(prev => ({ ...prev, certifications }));
  }, []);

  // Update languages
  const updateLanguages = useCallback((languages: ResumeData['languages']) => {
    setResumeData(prev => ({ ...prev, languages }));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access the resume builder.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
      >
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Resume Builder</h1>
              <p className="text-primary-foreground/80 mt-1">Create a professional resume that stands out</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setShowPreviewModal(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={downloadResume}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                onClick={saveResume}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                {resumeSections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="text-xs">
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Add your contact details and professional summary
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PersonalInfoForm
                      data={resumeData.personalInfo}
                      onChange={updatePersonalInfo}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>
                      Add your professional work history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExperienceForm
                      data={resumeData.experience}
                      onChange={updateExperience}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>
                      Showcase your technical and soft skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SkillsForm
                      data={resumeData.skills}
                      onChange={updateSkills}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>
                      Add your educational background
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EducationForm
                      education={resumeData.education}
                      setEducation={updateEducation}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>
                      Showcase your personal and professional projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProjectsForm
                      projects={resumeData.projects}
                      setProjects={updateProjects}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                    <CardDescription>
                      Add your professional certifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CertificationsForm
                      certifications={resumeData.certifications}
                      setCertifications={updateCertifications}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="languages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                    <CardDescription>
                      Add languages you speak
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LanguagesForm
                      languages={resumeData.languages}
                      setLanguages={updateLanguages}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resume Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resume Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResumeScore score={resumeScore} />
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resumeTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTemplate(template.id as any)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
          </DialogHeader>
          <ResumePreview
            data={resumeData}
            template={selectedTemplate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}