"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
  const { plan } = useSubscription();
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
    { value: "modern", label: "Modern", description: "Clean and contemporary" },
    { value: "classic", label: "Classic", description: "Traditional and professional" },
    { value: "creative", label: "Creative", description: "For creative industries" },
    { value: "tech", label: "Tech", description: "For technical roles" },
  ];

  const canGenerate = Boolean(formData.jobTitle.trim() && formData.experience.trim());

  const generateResume = async () => {
    if (!canGenerate) {
      showError("Missing Information", "Please fill in the required fields.");
      return;
    }

    if (plan === "free") {
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
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch("/api/ai/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          atsOptimization,
          aiEnhancement,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (payload && typeof payload === "object" && "error" in payload && typeof (payload as any).error === "string"
            ? (payload as any).error
            : "Failed to generate resume");
        throw new Error(message);
      }

      if (!payload) {
        throw new Error("Invalid response from server");
      }

      setGeneratedResume(payload as GeneratedResume);
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
      
      // Convert generated resume content to structured resume data
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

      // Validate resume data
      const validation = ResumePDFGenerator.validateResumeData(resumeData);
      if (!validation.valid) {
        showError("Validation Failed", validation.errors.join(', '));
        return;
      }

      // Generate and download PDF
      await ResumePDFGenerator.generateAndDownloadResume(
        resumeData,
        undefined,
        {
          template: formData.style,
          fontSize: 11,
          lineHeight: 1.4,
          margin: 15,
          font: 'helvetica',
          includePhoto: false,
          colorScheme: 'blue'
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
      // Convert generated resume content to structured resume data
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

      // Generate and preview PDF
      await ResumePDFGenerator.previewResumePDF(resumeData, {
        template: formData.style,
        fontSize: 11,
        lineHeight: 1.4,
        margin: 15,
        font: 'helvetica',
        includePhoto: false,
        colorScheme: 'blue'
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
          {plan === "free" && (
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
        {/* Input Form */}
        <Card className="shadow-lg border-muted/40 h-fit">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Your Information
            </CardTitle>
            <CardDescription>
              Provide your personal details and background for the resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</span>
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/johndoe"
                    value={formData.linkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website / Portfolio</Label>
                  <Input
                    id="website"
                    placeholder="johndoe.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Professional Info Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</span>
                Target Role
              </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry" className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  Industry
                </Label>
                <Select value={formData.industry} onValueChange={(value: any) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger className="bg-background">
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
              <Label htmlFor="experience">Your Experience <span className="text-red-500">*</span></Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience, achievements, and responsibilities..."
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={5}
                className="bg-background resize-none"
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
                className="bg-background resize-none"
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
                  className="bg-background"
                />
                <Button type="button" onClick={addSkill} size="sm" variant="secondary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-muted/20 rounded-lg border border-dashed">
                {formData.skills.length === 0 && (
                  <span className="text-sm text-muted-foreground italic p-1">No skills added yet</span>
                )}
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="level">Experience Level</Label>
                <Select value={formData.level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Resume Style</Label>
                <Select value={formData.style} onValueChange={(value: any) => setFormData(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeStyles.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</span>
                AI Options
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="ats-optimization" className="text-base">ATS Optimization</Label>
                    <p className="text-xs text-muted-foreground">Optimize keywords for tracking systems</p>
                  </div>
                  <Switch
                    id="ats-optimization"
                    checked={atsOptimization}
                    onCheckedChange={setAtsOptimization}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-enhancement" className="text-base">AI Content Enhancement</Label>
                    <p className="text-xs text-muted-foreground">Improve phrasing and impact</p>
                  </div>
                  <Switch
                    id="ai-enhancement"
                    checked={aiEnhancement}
                    onCheckedChange={setAiEnhancement}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={generateResume} 
              disabled={isGenerating || !canGenerate}
              className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card className="shadow-lg border-muted/40 flex flex-col h-full">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generated Resume
              </span>
              {generatedResume && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={previewPDF}
                    disabled={!generatedResume || !formData.jobTitle}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={downloadPDF}
                    disabled={downloadingPDF || !generatedResume || !formData.jobTitle}
                    className={cn("hover:opacity-90 shadow-sm", "bg-green-600 text-white")}
                  >
                    {downloadingPDF ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 bg-muted/5">
            {generatedResume ? (
              <div className="space-y-6">
                {/* ATS Score */}
                <div className="p-5 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Target className={cn("h-4 w-4", themeColors.primary.text)} />
                      </div>
                      <span className="font-semibold">ATS Score</span>
                    </div>
                    <span className={cn("font-bold text-lg", themeUtils.scoreColor(generatedResume.atsScore))}>
                      {generatedResume.atsScore}%
                    </span>
                  </div>
                  <Progress value={generatedResume.atsScore} className="h-2.5" />
                  <p className="text-xs text-muted-foreground mt-2 text-right font-medium">
                    {getAtsScoreLabel(generatedResume.atsScore)}
                  </p>
                </div>

                {/* Keywords */}
                {generatedResume.keywords.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                      <Zap className={cn("h-4 w-4", themeColors.warning.icon)} />
                      Keywords Optimized
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedResume.keywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className={cn(themeColors.success.badge, "px-2 py-1")}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Content - Document View */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Preview</h4>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {generatedResume.wordCount} words • {formData.style} style
                    </div>
                  </div>
                  
                  <div className="p-8 bg-white text-black shadow-md border rounded-sm min-h-[400px] max-h-[600px] overflow-y-auto font-sans text-[10pt] leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {generatedResume.content}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {generatedResume.suggestions.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-700">
                      <Lightbulb className={cn("h-4 w-4", themeColors.primary.text)} />
                      AI Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {generatedResume.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                          <Star className={cn("h-4 w-4 mt-0.5 flex-shrink-0", themeColors.warning.icon)} />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/10">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground max-w-xs">
                  Fill in your information on the left and click "Generate Resume" to create your professional document.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
