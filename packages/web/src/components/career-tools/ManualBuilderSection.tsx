"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Save, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import type { CareerToolsState } from "./useCareerToolsState";

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
  } = state;

  return (
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
                  manualBuilderProgress.hasNameEmail ? "bg-green-500" : "bg-muted"
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
                  manualBuilderProgress.hasExperience ? "bg-green-500" : "bg-muted"
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
                  manualBuilderProgress.hasEducation ? "bg-green-500" : "bg-muted"
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
                  manualBuilderProgress.hasSkillsCategory ? "bg-green-500" : "bg-muted"
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
          <TabsList className={tabsListClassName}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="personal" className={tabsTriggerClassName}>
                Personal Info
              </TabsTrigger>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="experience" className={tabsTriggerClassName}>
                Experience
              </TabsTrigger>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="education" className={tabsTriggerClassName}>
                Education
              </TabsTrigger>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="skills" className={tabsTriggerClassName}>
                Skills
              </TabsTrigger>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="projects" className={tabsTriggerClassName}>
                Projects
              </TabsTrigger>
            </motion.div>
          </TabsList>

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
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button onClick={() => setActiveBuilderTab("experience")}>
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
                  <Button onClick={() => setActiveBuilderTab("education")}>
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
                  <Button onClick={() => setActiveBuilderTab("skills")}>
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
                  <Button onClick={() => setActiveBuilderTab("projects")}>
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
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Live Preview */}
        <ResumePreview 
          data={{
            personalInfo: advancedResumeData.personalInfo,
            experience: advancedResumeData.experience,
            education: educationItems,
            skills: advancedResumeData.skills,
            projects: projectItems,
          }}
        />

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
  );
}
