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
  Mail,
  Copy,
  Edit,
  Star,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resumeTemplates } from "@/config/resumeTemplates";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import { usePreConfiguredTabs, PRECONFIGURED_TABS, TabContent, PreConfiguredTabs } from "@/lib/tabs-utils";
import { AICoverLetterGenerator } from "@/components/application/AICoverLetterGenerator";
import { AIResumeGenerator } from "@/components/application/AIResumeGenerator";
import { ResumeImporter } from "@/components/application/ResumeImporter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PersonalInfoForm } from "@/components/application/PersonalInfoForm";
import { ExperienceForm } from "@/components/application/ExperienceForm";
import { SkillsForm } from "@/components/application/SkillsForm";
import { ResumeScore } from "@/components/application/ResumeScore";
import type { ResumeData as AdvancedResumeData } from "@/components/application/types";
import { calculateResumeScore } from "@/components/application/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResumeData {
  id?: string;
  templateId: string;
  content: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: any[];
  education: any[];
  skills: string[];
}

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

// Cover letter templates
const coverLetterTemplates = {
  softwareEngineer: {
    title: "Software Engineer Cover Letter",
    content: `Dear Hiring Manager,

I am excited to apply for the Software Engineer position at [Company Name]. With [X] years of experience in full-stack development and a passion for creating scalable, user-centric applications, I am confident in my ability to contribute to your team's success.

In my previous role at [Previous Company], I led the development of [specific project], which resulted in [quantifiable achievement]. My expertise in [key technologies] and commitment to writing clean, maintainable code align perfectly with [Company Name]'s mission of [company mission].

I am particularly drawn to [Company Name] because of [specific reason about company]. I would welcome the opportunity to discuss how my skills and experience can contribute to your continued success.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
[Your Name]`,
  },
  productManager: {
    title: "Product Manager Cover Letter",
    content: `Dear Hiring Manager,

I am writing to express my strong interest in the Product Manager position at [Company Name]. With [X] years of experience driving product strategy and delivering user-focused solutions, I am eager to bring my expertise to your innovative team.

At [Previous Company], I successfully launched [product/feature], which increased [metric] by [percentage] and generated [revenue impact]. My background in [relevant experience] combined with my data-driven approach to product development would enable me to contribute immediately to [Company Name]'s growth objectives.

What excites me most about [Company Name] is [specific aspect of company/culture]. I am passionate about [relevant industry trend] and believe my experience in [specific skill] would be valuable in driving [company goal].

I would welcome the opportunity to discuss how my product leadership experience and strategic vision align with [Company Name]'s objectives.

Thank you for your consideration.

Sincerely,
[Your Name]`,
  },
};

// Email templates
const emailTemplates = {
  followUp: {
    title: "Interview Follow-up Email",
    subject: "Thank You for the Interview - [Position] Role",
    content: `Dear [Interviewer's Name],

Thank you for taking the time to interview me for the [Position] role at [Company Name] yesterday. I enjoyed learning more about [specific topic discussed] and [Company Name]'s approach to [relevant topic].

Our conversation about [specific discussion point] was particularly interesting, and it reinforced my enthusiasm for [specific aspect of role/company].

I am confident that my experience in [relevant experience] would allow me to contribute effectively to [specific team/project mentioned].

I would welcome the opportunity to discuss next steps and learn more about the timeline for your decision. Please don't hesitate to contact me if you need any additional information.

Thank you again for your time and consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email Address]
[Your LinkedIn Profile]`,
  },
  networking: {
    title: "Networking Introduction Email",
    subject: "Introduction - [Your Background] Interested in [Company/Industry]",
    content: `Dear [Contact's Name],

I hope this email finds you well. My name is [Your Name], and I'm a [Your Current Position] with [X] years of experience in [Your Field].

I came across your profile/work on [how you found them] and was impressed by [specific accomplishment/project]. I am particularly interested in [Company Name/Industry] and would love to learn more about your experience in [relevant area].

I am currently exploring opportunities in [specific area of interest] and would greatly value any insights you might be willing to share about [specific question/topic].

Would you be open to a brief call or meeting to discuss [specific topic]? I completely understand if you're busy, and I appreciate you taking the time to read this message.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your LinkedIn Profile]`,
  },
};

// Resume tips
const resumeTips = [
  {
    category: "Content",
    tips: [
      "Use quantifiable achievements (numbers, percentages, metrics)",
      "Tailor your resume for each job application",
      "Include relevant keywords from the job description",
      "Focus on accomplishments, not just responsibilities",
    ],
  },
  {
    category: "Format",
    tips: [
      "Keep it to 1-2 pages for most professionals",
      "Use clear, readable fonts (10-12pt)",
      "Maintain consistent formatting throughout",
      "Use bullet points for easy scanning",
    ],
  },
  {
    category: "Keywords",
    tips: [
      "Include industry-specific terms",
      "Use action verbs (achieved, implemented, led)",
      "Match keywords from job postings",
      "Balance keywords with natural language",
    ],
  },
];

function getIcon(iconName: string) {
  const icons: Record<string, any> = {
    FileText,
    Palette,
    Briefcase,
    GraduationCap,
    Code2,
    Layout,
    Sparkles,
    ListChecks,
    ClipboardList,
  };
  return icons[iconName] || FileText;
}




export default function ApplicationPage() {
  const { user } = useFirebaseAuth();
  const { activeTab, setActiveTab, tabs } = usePreConfiguredTabs("APPLICATION", "resume-maker");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resume, setResume] = useState<ResumeData>({
    templateId: "modern",
    content: "",
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
  });

  // Advanced resume builder state
  const [advancedResumeData, setAdvancedResumeData] = useState<AdvancedResumeData>(defaultAdvancedResumeData);
  const [advancedResumeScore, setAdvancedResumeScore] = useState(calculateResumeScore(defaultAdvancedResumeData));
  const [activeBuilderTab, setActiveBuilderTab] = useState("personal");

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState("");
  const [templateActiveTab, setTemplateActiveTab] = useState("cover-letters");

  const saveResume = useCallback(async () => {
    setSaving(true);
    try {
      // TODO: Implement actual save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDirty(false);
      showSuccess("Resume saved successfully!");
    } catch (error) {
      showError("Failed to save resume");
    } finally {
      setSaving(false);
    }
  }, []);

  // Update advanced resume score when data changes
  useEffect(() => {
    setAdvancedResumeScore(calculateResumeScore(advancedResumeData));
  }, [advancedResumeData]);

  // Update personal info in advanced resume
  const updateAdvancedPersonalInfo = useCallback((personalInfo: AdvancedResumeData['personalInfo']) => {
    setAdvancedResumeData(prev => ({ ...prev, personalInfo }));
    setDirty(true);
  }, []);

  // Update experience in advanced resume
  const updateAdvancedExperience = useCallback((experience: AdvancedResumeData['experience']) => {
    setAdvancedResumeData(prev => ({ ...prev, experience }));
    setDirty(true);
  }, []);

  // Update skills in advanced resume
  const updateAdvancedSkills = useCallback((skills: AdvancedResumeData['skills']) => {
    setAdvancedResumeData(prev => ({ ...prev, skills }));
    setDirty(true);
  }, []);

  const exportResume = useCallback(() => {
    // TODO: Implement export functionality
    showInfo("Export functionality coming soon!");
  }, []);

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess("Content copied to clipboard!");
    } catch (error) {
      showError("Failed to copy to clipboard");
    }
  };

  const handleDownload = (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("Template downloaded successfully!");
    } catch (error) {
      showError("Failed to download template");
    }
  };

  

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="mb-4">Please sign in to access the application workspace.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-xl"
      >
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Resume & Cover Letter Builder</h1>
              <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
                Create professional resumes and cover letters with AI-powered optimization and advanced ATS scoring
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 flex flex-wrap items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="sm" 
                variant={previewMode ? "outline" : "default"} 
                onClick={() => setPreviewMode(p => !p)}
                className="btn-premium rounded-xl font-medium"
              >
                {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />} {previewMode ? "Exit Preview" : "Preview"}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="sm" 
                onClick={() => saveResume()} 
                disabled={saving || loading}
                className="btn-premium rounded-xl font-medium"
              >
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={exportResume}
                className="btn-premium rounded-xl font-medium"
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </motion.div>
            {dirty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200"
              >
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-700 font-medium">Unsaved changes</span>
              </motion.div>
            )}
          </motion.div>

          {/* Centralized Tab Navigation */}
          <PreConfiguredTabs
            configKey="APPLICATION"
            initialTab="resume-maker"
            onTabChange={setActiveTab}
            variant="default"
            showIcons={true}
            showDescriptions={true}
          />

            {/* Resume Maker Tab */}
            <TabContent value="resume-maker" activeTab={activeTab}>
              <div className="space-y-6">
                <AIResumeGenerator />
              </div>
            </TabContent>

            {/* Advanced Resume Builder Tab */}
            <TabContent value="advanced-resume-builder" activeTab={activeTab}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                  <Tabs value={activeBuilderTab} onValueChange={setActiveBuilderTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal">Personal Info</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                      <TabsTrigger value="skills">Skills</TabsTrigger>
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
                            data={advancedResumeData.personalInfo}
                            onChange={updateAdvancedPersonalInfo}
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
                            data={advancedResumeData.experience}
                            onChange={updateAdvancedExperience}
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
                            data={advancedResumeData.skills}
                            onChange={updateAdvancedSkills}
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
                      <ResumeScore score={advancedResumeScore} />
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                </div>
              </div>
            </TabContent>

            {/* Cover Letter Tab */}
            <TabContent value="cover-letter" activeTab={activeTab}>
              <AICoverLetterGenerator />
            </TabContent>

            {/* Import Resume Tab */}
            <TabContent value="import" activeTab={activeTab}>
              <ResumeImporter />
            </TabContent>

            {/* Templates Tab */}
            <TabContent value="templates" activeTab={activeTab}>
              <Tabs value={templateActiveTab} onValueChange={setTemplateActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="resume-templates">Resume Templates</TabsTrigger>
                  <TabsTrigger value="cover-letters">Cover Letters</TabsTrigger>
                  <TabsTrigger value="emails">Email Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="resume-templates" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" /> Resume Templates</CardTitle>
                      <CardDescription>Select a template style for your generated resume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {resumeTemplates.map(t => (
                          <Button
                            key={t.id}
                            type="button"
                            variant="outline"
                            onClick={() => setResume(r => ({ ...r, templateId: t.id }))}
                            className={cn(
                              "relative flex h-full w-full flex-col items-stretch gap-3 rounded-lg border bg-background p-4 text-left transition-all hover:shadow-sm",
                              "justify-start",
                              resume.templateId === t.id
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border"
                            )}
                          >
                            <div className="flex items-start justify-between w-full">
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
                              {t.popular && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Popular</span>}
                            </div>
                            {resume.templateId === t.id && (
                              <div className="absolute top-1 right-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Selected</div>
                            )}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resume Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Resume Tips & Best Practices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resumeTips.map((category, index) => (
                          <div key={index} className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              {category.category}
                            </h3>
                            <ul className="space-y-2">
                              {category.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="text-sm flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cover-letters" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cover Letter Templates Selection */}
                    <div className="space-y-4">
                      <Card className="shadow-lg border-border/50 hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Cover Letter Templates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(coverLetterTemplates).map(([key, template], index) => (
                              <motion.button
                                key={key}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedTemplate(key);
                                  setCustomContent(template.content);
                                }}
                                className={cn(
                                  "w-full text-left p-4 rounded-xl border transition-premium shadow-premium hover:shadow-premium-lg hover-lift",
                                  selectedTemplate === key
                                    ? "border-primary bg-primary/5 shadow-premium-lg"
                                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                                )}
                              >
                                <div className="font-semibold text-foreground">{template.title}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Professional template with customizable sections
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cover Letter Template Preview */}
                    <div className="lg:col-span-2">
                      {selectedTemplate ? (
                        <Card className="shadow-lg border-border/50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>
                                {coverLetterTemplates[selectedTemplate as keyof typeof coverLetterTemplates].title}
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(customContent)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(customContent, "cover-letter.txt")}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={customContent}
                              onChange={(e) => setCustomContent(e.target.value)}
                              rows={20}
                              className="font-mono text-sm resize-none"
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            Select a template
                          </h3>
                          <p className="text-muted-foreground">
                            Choose a cover letter template to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="emails" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(emailTemplates).map(([key, template]) => (
                      <Card key={key}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {template.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Subject:</Label>
                            <p className="text-sm bg-muted p-2 rounded border mt-1">
                              {template.subject}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Email Content:</Label>
                            <Textarea
                              value={template.content}
                              readOnly
                              rows={12}
                              className="font-mono text-sm resize-none mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleCopyToClipboard(template.content)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Content
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDownload(template.content, `${key}-email.txt`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabContent>
        </FeatureGate>
      </div>
    </div>
  );
}
