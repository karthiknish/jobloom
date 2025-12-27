"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Zap,
  TrendingUp,
  Wand2,
  Lightbulb,
  Star,
  Eye,
  Briefcase,
  GraduationCap,
  Layers,
  PenTool,
  ChevronDown,
  ChevronUp,
  User,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/providers/subscription-provider";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import { aiApi } from "@/utils/api/ai";
import ResumePDFGenerator from "@/lib/resumePDFGenerator";
import { themeColors, themeUtils } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

interface ResumeData {
  // Personal Details
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  // Professional Info
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: "entry" | "mid" | "senior" | "executive";
  style: "modern" | "classic" | "creative" | "tech";
  includeObjective: boolean;
}

interface GeneratedResume {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  atsScore: number;
  keywords: string[];
  suggestions: string[];
  wordCount: number;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function AIResumeGenerator() {
  const { user } = useFirebaseAuth();
  const { plan, isAdmin } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [formData, setFormData] = useState<ResumeData>({
    // Personal Details
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    // Professional Info
    jobTitle: "",
    experience: "",
    skills: [],
    education: "",
    industry: "technology",
    level: "mid",
    style: "modern",
    includeObjective: true,
  });
  const [skillInput, setSkillInput] = useState("");
  const [atsOptimization, setAtsOptimization] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) setStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const [resumeOptions, setResumeOptions] = useState<{
    template: 'modern' | 'classic' | 'creative' | 'executive' | 'technical';
    colorScheme: 'hireall' | 'blue' | 'gray' | 'green' | 'purple' | 'orange';
    fontSize: number;
    font: 'helvetica' | 'times' | 'courier';
  }>({
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 11,
    font: 'helvetica'
  });

  const industries = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "engineering", label: "Engineering" },
    { value: "consulting", label: "Consulting" },
    { value: "other", label: "Other" },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (2-5 years)" },
    { value: "senior", label: "Senior Level (5-10 years)" },
    { value: "executive", label: "Executive (10+ years)" },
  ];

  const resumeStyles = [
    { value: "modern", label: "Modern", description: "Clean and contemporary", preview: "/images/previews/modern.png" },
    { value: "classic", label: "Classic", description: "Traditional and professional", preview: "/images/previews/classic.png" },
    { value: "creative", label: "Creative", description: "For creative industries", preview: "/images/previews/creative.png" },
    { value: "tech", label: "Technical", description: "For technical/IT roles", preview: "/images/previews/executive.png" },
  ];

  const canGenerate = Boolean(formData.jobTitle.trim() && formData.experience.trim());

  const generateResume = async () => {
    if (!canGenerate) {
      showError("Missing Information", "Please fill in the required fields.");
      return;
    }

    if (plan === "free" && !isAdmin) {
      const mockResume: GeneratedResume = {
        content: generateMockResumeContent(formData),
        sections: {
          summary: generateMockSummary(formData),
          experience: generateMockExperience(formData),
          skills: formData.skills.join(", "),
          education: formData.education || "Bachelor's Degree in relevant field",
        },
        atsScore: 85,
        keywords: extractKeywords(formData),
        suggestions: generateMockSuggestions(formData),
        wordCount: 350,
      };

      setGeneratedResume(mockResume);
      showInfo("Demo Mode", "This is a sample resume. Upgrade for full AI generation.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const payload = await aiApi.generateResume({
        ...formData,
        atsOptimization,
        aiEnhancement,
      });

      setGeneratedResume(payload);
      showSuccess("Success", "Your resume has been generated!");
    } catch (error: any) {
      console.error("Resume generation error:", error);

      // Fallback to mock data (network/API issues)
      const mockResume: GeneratedResume = {
        content: generateMockResumeContent(formData),
        sections: {
          summary: generateMockSummary(formData),
          experience: generateMockExperience(formData),
          skills: formData.skills.join(", "),
          education: formData.education || "Bachelor's Degree in relevant field",
        },
        atsScore: 85,
        keywords: extractKeywords(formData),
        suggestions: generateMockSuggestions(formData),
        wordCount: 350,
      };
      
      setGeneratedResume(mockResume);

      const message = error instanceof Error ? error.message : "AI generation failed";
      showError("Generation Failed", message);
      showInfo("Fallback Used", "Showing a fallback resume so you can keep going.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockResumeContent = (data: ResumeData): string => {
    return `${generateMockSummary(data)}

${generateMockExperience(data)}

SKILLS
${data.skills.join(", ")}

EDUCATION
${data.education || "Bachelor's Degree in relevant field"}

[This is a demo version. Upgrade for full AI-generated resume.]`;
  };

  const generateMockSummary = (data: ResumeData): string => {
    const levelMap = {
      entry: "motivated and detail-oriented",
      mid: "skilled and results-driven", 
      senior: "experienced and strategic",
      executive: "visionary and accomplished"
    };

    return `PROFESSIONAL SUMMARY
${levelMap[data.level]} professional with expertise in ${data.industry}. 
Seeking ${data.jobTitle} position where I can leverage my skills and experience to drive results.`;
  };

  const generateMockExperience = (data: ResumeData): string => {
    return `PROFESSIONAL EXPERIENCE
${data.experience}

[This would include specific achievements, metrics, and responsibilities]`;
  };

  const extractKeywords = (data: ResumeData): string[] => {
    const commonKeywords = [
      "leadership", "communication", "teamwork", "problem-solving", "analytical",
      "project management", "collaboration", "initiative", "adaptability", "creativity"
    ];

    const industryKeywords = {
      technology: ["javascript", "python", "react", "aws", "docker", "agile"],
      healthcare: ["patient care", "medical terminology", "hipaa", "clinical"],
      finance: ["financial analysis", "reporting", "budgeting", "forecasting"],
      marketing: ["digital marketing", "seo", "content strategy", "analytics"],
    };

    const allKeywords = [
      ...commonKeywords,
      ...(industryKeywords[data.industry as keyof typeof industryKeywords] || []),
      ...data.skills
    ];

    return allKeywords.slice(0, 8);
  };

  const generateMockSuggestions = (data: ResumeData): string[] => {
    const suggestions = [
      "Add specific metrics and quantifiable achievements",
      "Include more industry-specific keywords",
      "Strengthen your professional summary",
      "Add relevant certifications or training",
    ];

    return suggestions.slice(0, 3);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const copyToClipboard = async () => {
    if (generatedResume) {
      try {
        await navigator.clipboard.writeText(generatedResume.content);
        showSuccess("Copied!", "Resume copied to clipboard.");
      } catch (error) {
        showError("Failed to copy", "Please try again.");
      }
    }
  };

  const downloadPDF = async () => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      setDownloadingPDF(true);
      
      const resumeData = {
        personalInfo: {
          fullName: formData.fullName || user?.displayName || 'Your Name',
          email: formData.email || user?.email || 'your.email@example.com',
          phone: formData.phone || '',
          location: formData.location || '',
          summary: generatedResume.sections.summary || 'Professional summary',
          linkedin: formData.linkedin || '',
          github: '',
          website: formData.website || ''
        },
        experience: [{
          id: '1',
          company: 'Previous Company',
          position: formData.jobTitle,
          location: 'City, State',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          current: false,
          description: generatedResume.sections.experience || 'Professional experience',
          achievements: [
            'Key achievement 1',
            'Key achievement 2',
            'Key achievement 3'
          ]
        }],
        education: [{
          id: '1',
          institution: 'University Name',
          degree: 'Bachelor\'s Degree',
          field: formData.industry,
          graduationDate: '2019-05-15',
          gpa: '3.5',
          honors: ''
        }],
        skills: [{
          category: 'Technical Skills',
          skills: formData.skills.length > 0 ? formData.skills : ['Skill 1', 'Skill 2', 'Skill 3']
        }],
        projects: []
      };

      const validation = ResumePDFGenerator.validateResumeData(resumeData);
      if (!validation.valid) {
        showError("Validation Failed", validation.errors.join(', '));
        return;
      }

      await ResumePDFGenerator.generateAndDownloadResume(
        resumeData,
        undefined,
        {
          template: resumeOptions.template,
          fontSize: resumeOptions.fontSize,
          lineHeight: 1.4,
          margin: 15,
          font: resumeOptions.font,
          includePhoto: false,
          colorScheme: resumeOptions.colorScheme
        }
      );

      showSuccess("Success", "Resume PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF download failed:", error);
      showError("Download Failed", "Failed to download PDF: " + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const previewPDF = async () => {
    if (!generatedResume || !formData.jobTitle) {
      showError("Missing Information", "Please generate a resume first.");
      return;
    }

    try {
      const resumeData = {
        personalInfo: {
          fullName: formData.fullName || user?.displayName || 'Your Name',
          email: formData.email || user?.email || 'your.email@example.com',
          phone: formData.phone || '',
          location: formData.location || '',
          summary: generatedResume.sections.summary || 'Professional summary',
          linkedin: formData.linkedin || '',
          github: '',
          website: formData.website || ''
        },
        experience: [{
          id: '1',
          company: 'Previous Company',
          position: formData.jobTitle,
          location: 'City, State',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          current: false,
          description: generatedResume.sections.experience || 'Professional experience',
          achievements: [
            'Key achievement 1',
            'Key achievement 2',
            'Key achievement 3'
          ]
        }],
        education: [{
          id: '1',
          institution: 'University Name',
          degree: 'Bachelor\'s Degree',
          field: formData.industry,
          graduationDate: '2019-05-15',
          gpa: '3.5',
          honors: ''
        }],
        skills: [{
          category: 'Technical Skills',
          skills: formData.skills.length > 0 ? formData.skills : ['Skill 1', 'Skill 2', 'Skill 3']
        }],
        projects: []
      };

      await ResumePDFGenerator.previewResumePDF(resumeData, {
        template: resumeOptions.template,
        fontSize: resumeOptions.fontSize,
        lineHeight: 1.4,
        margin: 15,
        font: resumeOptions.font,
        includePhoto: false,
        colorScheme: resumeOptions.colorScheme
      });

      showSuccess("Success", "Resume PDF preview opened in new tab!");
    } catch (error: any) {
      console.error("PDF preview failed:", error);
      showError("Preview Failed", "Failed to preview PDF: " + error.message);
    }
  };

  const getAtsScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <Card className="border-border shadow-md bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary rounded-lg shadow-sm">
              <Wand2 className="h-6 w-6 text-primary-foreground" />
            </div>
            AI Resume Generator
          </CardTitle>
          <CardDescription className="text-base ml-11">
            Create ATS-optimized resumes with AI-powered content generation tailored to your industry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "free" && !isAdmin && (
            <div className="ml-11 p-4 bg-amber-100/50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900">Premium Feature</h4>
                  <p className="text-sm text-amber-700">
                    Upgrade to generate unlimited AI-powered resumes with ATS optimization
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                onClick={() => window.location.href = '/upgrade'}
              >
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step Progress and Input Form */}
        <div className="space-y-8">
          {/* Step Progress */}
          <div className="px-2">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-sm",
                      step === s ? "bg-primary text-primary-foreground scale-110" : 
                      step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < totalSteps && (
                    <div className={cn(
                      "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                      step > s ? "bg-emerald-500" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              <span className={cn(step === 1 && "text-primary")}>Personal</span>
              <span className={cn(step === 2 && "text-primary")}>Experience</span>
              <span className={cn(step === 3 && "text-primary")}>Style</span>
              <span className={cn(step === 4 && "text-primary")}>Review</span>
            </div>
          </div>

          {/* Input Form Card */}
          <Card className="shadow-lg border-muted/40 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                {step === 1 && <User className="h-5 w-5 text-primary" />}
                {step === 2 && <Briefcase className="h-5 w-5 text-primary" />}
                {step === 3 && <Layers className="h-5 w-5 text-primary" />}
                {step === 4 && <Zap className="h-5 w-5 text-primary" />}
                {step === 1 && "Personal Details"}
                {step === 2 && "Professional Info"}
                {step === 3 && "Template & Style"}
                {step === 4 && "Generation Options"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Start with your basic contact information"}
                {step === 2 && "Tell us about your target role and experience"}
                {step === 3 && "Choose a template and customize your style"}
                {step === 4 && "Finalize AI settings and generate your resume"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Personal Details */}
                {step === 1 && (
                  <motion.div 
                    key="step-1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="San Francisco, CA"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                          id="linkedin"
                          placeholder="linkedin.com/in/johndoe"
                          value={formData.linkedin}
                          onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website / Portfolio</Label>
                        <Input
                          id="website"
                          placeholder="johndoe.com"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Professional Info */}
                {step === 2 && (
                  <motion.div 
                    key="step-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle" className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          Target Job Title *
                        </Label>
                        <Input
                          id="jobTitle"
                          placeholder="e.g. Senior Software Engineer"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry" className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                          Industry
                        </Label>
                        <Select value={formData.industry} onValueChange={(value: any) => setFormData(prev => ({ ...prev, industry: value }))}>
                          <SelectTrigger className="h-11 bg-background shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(industry => (
                              <SelectItem key={industry.value} value={industry.value}>
                                {industry.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Your Experience *</Label>
                      <Textarea
                        id="experience"
                        placeholder="Describe your relevant experience, achievements, and responsibilities..."
                        value={formData.experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                        rows={5}
                        className="bg-background resize-none shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education" className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                        Education
                      </Label>
                      <Textarea
                        id="education"
                        placeholder="Your educational background, degrees, certifications..."
                        value={formData.education}
                        onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                        rows={2}
                        className="bg-background resize-none shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Key Skills</Label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Add a skill..."
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                          className="h-11 bg-background shadow-sm"
                        />
                        <Button type="button" onClick={addSkill} size="sm" variant="secondary" className="px-6 h-11">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[3.5rem] p-3 bg-muted/20 rounded-xl border border-dashed">
                        {formData.skills.length === 0 && (
                          <span className="text-sm text-muted-foreground italic p-1">No skills added yet</span>
                        )}
                        {formData.skills.map(skill => (
                          <Badge 
                            key={skill} 
                            variant="secondary" 
                            className="px-3 py-1 gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" 
                            onClick={() => removeSkill(skill)}
                          >
                            {skill} <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Style Selection */}
                {step === 3 && (
                  <motion.div 
                    key="step-3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resumeStyles.map((style) => {
                        // Live preview styles based on template
                        const templateStyles: Record<string, { bg: string; header: string; accent: string; font: string }> = {
                          modern: { bg: "bg-white", header: "bg-slate-800 text-white", accent: "text-blue-600", font: "font-sans" },
                          classic: { bg: "bg-white", header: "bg-white border-b-2 border-black", accent: "text-gray-800", font: "font-serif" },
                          creative: { bg: "bg-gradient-to-br from-purple-50 to-pink-50", header: "bg-gradient-to-r from-purple-600 to-pink-500 text-white", accent: "text-purple-600", font: "font-sans" },
                          tech: { bg: "bg-slate-50", header: "bg-emerald-700 text-white", accent: "text-emerald-600", font: "font-mono" },
                        };
                        const ts = templateStyles[style.value] || templateStyles.modern;
                        const displayName = formData.fullName || "Your Name";
                        const displayTitle = formData.jobTitle || "Job Title";
                        const displaySkills = formData.skills.length > 0 ? formData.skills.slice(0, 3) : ["Skill 1", "Skill 2"];

                        return (
                          <div 
                            key={style.value}
                            onClick={() => setFormData(prev => ({ ...prev, style: style.value as any }))}
                            className={cn(
                              "group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer",
                              formData.style === style.value 
                                ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                                : "border-border hover:border-primary/40 hover:bg-muted/30"
                            )}
                          >
                            {/* Live Preview */}
                            <div className={cn("w-full h-40 p-2 overflow-hidden", ts.bg)}>
                              <div className={cn("rounded-sm overflow-hidden h-full flex flex-col text-[6px] leading-tight", ts.font)}>
                                {/* Header */}
                                <div className={cn("p-1.5 text-center", ts.header)}>
                                  <div className="font-bold text-[8px] truncate">{displayName}</div>
                                  <div className="opacity-80 text-[5px] truncate">{displayTitle}</div>
                                </div>
                                {/* Body */}
                                <div className="flex-1 p-1.5 space-y-1 bg-white/80">
                                  <div>
                                    <div className={cn("font-bold text-[5px] uppercase tracking-wider mb-0.5", ts.accent)}>Summary</div>
                                    <div className="text-gray-600 line-clamp-2 text-[4px]">Dynamic professional with a passion for excellence and innovation.</div>
                                  </div>
                                  <div>
                                    <div className={cn("font-bold text-[5px] uppercase tracking-wider mb-0.5", ts.accent)}>Skills</div>
                                    <div className="flex flex-wrap gap-0.5">
                                      {displaySkills.map((skill, i) => (
                                        <span key={i} className="px-1 py-0.5 bg-gray-100 rounded text-[4px] truncate max-w-[40px]">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border-t bg-card">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold">{style.label}</h4>
                                {formData.style === style.value && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{style.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-bold text-sm">Visual Customization</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Scheme</Label>
                          <Select 
                            value={resumeOptions.colorScheme} 
                            onValueChange={(val: any) => setResumeOptions(prev => ({ ...prev, colorScheme: val }))}
                          >
                            <SelectTrigger className="h-10 bg-background shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hireall">Hireall (Pink/Purple)</SelectItem>
                              <SelectItem value="blue">Professional Blue</SelectItem>
                              <SelectItem value="green">Modern Green</SelectItem>
                              <SelectItem value="gray">Sleek Gray</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font Style</Label>
                          <Select 
                            value={resumeOptions.font} 
                            onValueChange={(val: any) => setResumeOptions(prev => ({ ...prev, font: val }))}
                          >
                            <SelectTrigger className="h-10 bg-background shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="helvetica">Sans-Serif (Modern)</SelectItem>
                              <SelectItem value="times">Serif (Traditional)</SelectItem>
                              <SelectItem value="courier">Monospace (Technical)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Final Generation */}
                {step === 4 && (
                  <motion.div 
                    key="step-4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-bold text-sm">AI Generation Strategy</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-background border shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="font-semibold text-sm">ATS Optimization</Label>
                            <p className="text-xs text-muted-foreground">Tailor content for algorithmic parsing</p>
                          </div>
                          <Switch 
                            checked={atsOptimization} 
                            onCheckedChange={setAtsOptimization} 
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-background border shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="font-semibold text-sm">AI Tone Enhancement</Label>
                            <p className="text-xs text-muted-foreground">Make impact statements more powerful</p>
                          </div>
                          <Switch 
                            checked={aiEnhancement} 
                            onCheckedChange={setAiEnhancement} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Review Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Role:</span>
                          <span className="font-semibold">{formData.jobTitle || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Industry:</span>
                          <span className="font-semibold capitalize">{formData.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-semibold capitalize">{formData.style}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={generateResume}
                      disabled={isGenerating || !canGenerate}
                      className="w-full h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/20"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-6 w-6 animate-spin" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6" />
                          Generate AI Resume
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center justify-between pt-6 border-t mt-4">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={step === 1 || isGenerating}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {step < totalSteps && (
                  <Button
                    onClick={nextStep}
                    className="gap-2 px-8"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Output */}
        <div className="space-y-6">
          <Card className="shadow-lg border-muted/40 flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generated Resume
                </span>
                {generatedResume && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={previewPDF}
                      disabled={!generatedResume || !formData.jobTitle}
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={downloadPDF}
                      disabled={downloadingPDF || !generatedResume || !formData.jobTitle}
                      className={cn("hover:opacity-90 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white")}
                    >
                      {downloadingPDF ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 sm:p-6 bg-muted/5 min-h-[500px]">
              {generatedResume ? (
                <div className="space-y-6 p-4 sm:p-0">
                  {/* ATS Score */}
                  <div className="p-5 bg-white rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <Target className={cn("h-4 w-4 text-blue-600")} />
                        </div>
                        <span className="font-semibold text-sm">ATS Score</span>
                      </div>
                      <span className={cn("font-bold text-lg", themeUtils.scoreColor(generatedResume.atsScore))}>
                        {generatedResume.atsScore}%
                      </span>
                    </div>
                    <Progress value={generatedResume.atsScore} className="h-2.5" />
                    <p className="text-[10px] text-muted-foreground mt-2 text-right font-medium uppercase tracking-wider">
                      {getAtsScoreLabel(generatedResume.atsScore)}
                    </p>
                  </div>

                  {/* Keywords */}
                  {generatedResume.keywords.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        Keywords Optimized
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedResume.keywords.map(keyword => (
                          <Badge key={keyword} variant="outline" className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Content - Document View */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Preview</h4>
                      <div className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
                        {generatedResume.wordCount} words • {formData.style}
                      </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 bg-white text-black shadow-inner border rounded-sm min-h-[400px] max-h-[500px] overflow-y-auto font-sans text-[9pt] leading-relaxed select-all">
                      <div className="whitespace-pre-wrap">
                        {generatedResume.content}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {generatedResume.suggestions.length > 0 && (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                      <h4 className="font-bold mb-3 flex items-center gap-2 text-[10px] text-amber-700 uppercase tracking-widest">
                        <Lightbulb className="h-3.5 w-3.5" />
                        AI Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {generatedResume.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-amber-800/80">
                            <Star className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl border-muted-foreground/10 bg-muted/5 mx-4 sm:mx-0 my-4 sm:my-0">
                  <div className="p-4 bg-background rounded-full shadow-sm mb-4 border">
                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Ready to Build</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                    Complete the steps to generate your AI-optimized professional resume.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
