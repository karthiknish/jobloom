"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  FileText,
  Brain,
  Target,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Zap,
  TrendingUp,
  Star,
  Briefcase,
  Building2,
  PenTool,
  CheckCircle2,
  Info,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { dashboardApi } from "@/utils/api/dashboard";
import type { Application, PaginatedApplications } from "@/utils/api/dashboard";
import PDFGenerator, { PDFOptions } from "@/lib/pdfGenerator";
import { cn } from "@/lib/utils";
import { generateContentHash, getCachedAIResponse, setCachedAIResponse } from "@/utils/ai-cache";
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from "@/constants/storageKeys";

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: "professional" | "friendly" | "enthusiastic" | "formal";
  length: "concise" | "standard" | "detailed";
}

interface GeneratedCoverLetter {
  _id?: string;
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  tone: string;
  wordCount: number;
  deepResearch?: boolean;
  researchInsights?: string[];
  source?: 'gemini' | 'fallback' | 'mock';
  createdAt?: string;
  jobTitle?: string;
  companyName?: string;
}

interface AICoverLetterGeneratorProps {
  applicationId?: string;
}

type CoverLetterDraft = {
  v: 1;
  updatedAt: number;
  formData: CoverLetterData;
  editedContent: string;
  atsOptimization: boolean;
  keywordFocus: boolean;
  deepResearch: boolean;
  pdfOptions: PDFOptions;
  showHistory: boolean;
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function AICoverLetterGenerator({ applicationId }: AICoverLetterGeneratorProps) {
  const { user } = useFirebaseAuth();
  const { plan, isAdmin } = useSubscription();

  const initialDraft = readAndMigrateJsonFromStorage<CoverLetterDraft>(
    STORAGE_KEYS.coverLetterDraft,
    LEGACY_STORAGE_KEYS.coverLetterDraft
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [editedContent, setEditedContent] = useState(() => initialDraft?.editedContent ?? "");
  const [formData, setFormData] = useState<CoverLetterData>(() => {
    if (initialDraft?.formData) {
      return {
        jobTitle: initialDraft.formData.jobTitle || "",
        companyName: initialDraft.formData.companyName || "",
        jobDescription: initialDraft.formData.jobDescription || "",
        skills: Array.isArray(initialDraft.formData.skills) ? initialDraft.formData.skills : [],
        experience: initialDraft.formData.experience || "",
        tone: initialDraft.formData.tone || "professional",
        length: initialDraft.formData.length || "standard",
      };
    }

    return {
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      skills: [],
      experience: "",
      tone: "professional",
      length: "standard",
    };
  });
  const [skillInput, setSkillInput] = useState("");
  const [atsOptimization, setAtsOptimization] = useState(() => initialDraft?.atsOptimization ?? true);
  const [keywordFocus, setKeywordFocus] = useState(() => initialDraft?.keywordFocus ?? true);
  const [deepResearch, setDeepResearch] = useState(() => initialDraft?.deepResearch ?? false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(() => {
    if (initialDraft?.pdfOptions) return initialDraft.pdfOptions;
    return {
      template: 'modern',
      colorScheme: 'hireall',
      fontSize: 12,
      font: 'helvetica'
    };
  });

  const [history, setHistory] = useState<GeneratedCoverLetter[]>([]);
  const [showHistory, setShowHistory] = useState(() => initialDraft?.showHistory ?? false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const draftSaveTimeoutRef = useRef<number | null>(null);
  const suppressDraftWritesRef = useRef(false);

  // Debounced autosave of in-progress form state
  useEffect(() => {
    if (suppressDraftWritesRef.current) return;
    if (typeof window === "undefined") return;

    if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = window.setTimeout(() => {
      const payload: CoverLetterDraft = {
        v: 1,
        updatedAt: Date.now(),
        formData,
        editedContent,
        atsOptimization,
        keywordFocus,
        deepResearch,
        pdfOptions,
        showHistory,
      };
      writeJsonToStorage(
        STORAGE_KEYS.coverLetterDraft,
        payload,
        LEGACY_STORAGE_KEYS.coverLetterDraft
      );
    }, 250);

    return () => {
      if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [atsOptimization, deepResearch, editedContent, formData, keywordFocus, pdfOptions, showHistory]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await aiApi.getCoverLetterHistory();
      setHistory(data);
    } catch (err) {
      console.error("History Error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiApi.deleteCoverLetterHistory(id);
      setHistory(prev => prev.filter(item => item._id !== id));
      showSuccess("Deleted", "Cover letter removed from history.");
    } catch (err) {
      showError("Delete Failed", "Failed to remove cover letter.");
    }
  };

  const jobDescriptionChars = formData.jobDescription.length;
  const experienceChars = formData.experience.length;

  const canGenerate = Boolean(
    formData.jobTitle.trim() &&
      formData.companyName.trim() &&
      formData.jobDescription.trim()
  );

  const generateCoverLetter = async () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim() || !formData.jobDescription.trim()) {
      showError("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (formData.jobDescription.trim().length < 50) {
      showError("Job Description Too Short", "Please paste at least 50 characters of the job description.");
      return;
    }


    setIsGenerating(true);
    
    try {
      // Check cache first (only for premium users as free uses mock)
      const cachePayload = {
        ...formData,
        atsOptimization,
        keywordFocus,
        deepResearch,
      };
      const payloadHash = await generateContentHash(cachePayload);
      const cachedData = getCachedAIResponse<GeneratedCoverLetter>(payloadHash);
      
      if (cachedData) {
        setGeneratedLetter(cachedData);
        setEditedContent(cachedData.content ?? "");
        showSuccess("Success", "Loaded from history!");
        setIsGenerating(false);
        return;
      }

      const payload = await aiApi.generateCoverLetter({
        ...formData,
        atsOptimization,
        keywordFocus,
        deepResearch,
        applicationId,
      });

      // Store in cache
      setCachedAIResponse(payloadHash, payload);

      setGeneratedLetter(payload);
      setEditedContent(payload.content ?? "");
      showSuccess("Success", "Your cover letter has been generated!");
    } catch (error: any) {
      console.error("Cover letter generation error:", error);
      
      // Fallback to mock data for development
      const mockLetter: GeneratedCoverLetter = {
        content: `Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.jobTitle} position at ${formData.companyName}. With my background and skills, I am confident that I would be a valuable addition to your team.

${formData.jobDescription.slice(0, 200)}... [This is a demo version]

${formData.skills.length > 0 ? `My key skills include: ${formData.skills.join(", ")}.` : ""}

I am excited about the opportunity to contribute to ${formData.companyName} and would welcome the chance to discuss how my experience aligns with your needs.

Thank you for your consideration.

Sincerely,
[Your Name]`,
        atsScore: 85,
        keywords: ["leadership", "communication", "problem-solving", "teamwork"],
        improvements: [
          "Add specific quantifiable achievements",
          "Include more company-specific keywords",
          "Strengthen the opening statement"
        ],
        tone: formData.tone,
        wordCount: 250,
        deepResearch,
        researchInsights: deepResearch ? [
          `Highlight how ${formData.companyName}'s culture aligns with your values`,
          "Reference a recent company initiative to show research"
        ] : [],
        source: 'fallback',
      };
      
      setGeneratedLetter(mockLetter);
      setEditedContent(mockLetter.content);

      const message = error instanceof Error ? error.message : "AI generation failed";
      showError("Generation Failed", message);
      showInfo("Fallback Used", "Showing a fallback cover letter so you can keep going.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedLetter) {
      setEditedContent(generatedLetter.content ?? "");
    } else {
      setEditedContent("");
    }
  }, [generatedLetter]);

  useEffect(() => {
    if (applicationId && user?.uid) {
      // Fetch application details to pre-fill
      dashboardApi.getApplicationsByUser(user.uid)
        .then((result: PaginatedApplications) => {
          const apps: Application[] = result?.applications ?? [];
          const app = apps.find((a) => a._id === applicationId);
          if (app && app.job) {
            const job = app.job;
            const jobSkills = Array.isArray(job.skills) ? job.skills : [];
            setFormData(prev => ({
              ...prev,
              jobTitle: job.title || prev.jobTitle,
              companyName: job.company || prev.companyName,
              jobDescription: job.description || prev.jobDescription,
            }));
            
            if (jobSkills.length > 0) {
               setFormData(prev => ({
                 ...prev,
                 skills: Array.from(new Set([...prev.skills, ...jobSkills]))
               }));
            }
          }
        })
        .catch((err: any) => console.error("Failed to pre-fill from application:", err));
    }
  }, [applicationId, user?.uid]);

  const previewWordCount = useMemo(() => {
    const content = (editedContent || "").trim();
    if (!content) return 0;
    return content.split(/\s+/).filter(Boolean).length;
  }, [editedContent]);

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
    if (generatedLetter) {
      try {
        await navigator.clipboard.writeText(editedContent || generatedLetter.content);
        showSuccess("Copied!", "Cover letter copied to clipboard.");
      } catch {
        showError("Failed to copy", "Please try again.");
      }
    }
  };

  const downloadPDF = async () => {
    if (!generatedLetter || !formData.jobTitle || !formData.companyName) {
      showError("Missing Information", "Please generate a cover letter first.");
      return;
    }

    try {
      setDownloadingPDF(true);

      const contentToExport = (editedContent || generatedLetter.content || "").trim();
      if (!contentToExport) {
        showError("Missing Content", "Cover letter content is empty.");
        return;
      }
      
      // Validate content
      const validation = PDFGenerator.validateContent(contentToExport);
      if (!validation.valid) {
        showError("Validation Failed", validation.errors.join(', '));
        return;
      }

      // Prepare metadata
      const metadata = {
        candidateName: user?.displayName || 'Your Name',
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        recipientTitle: 'Hiring Manager',
        email: user?.email || '',
        phone: '',
        location: ''
      };

      // Generate and download PDF
      await PDFGenerator.generateAndDownloadCoverLetter(
        contentToExport,
        metadata,
        undefined,
        pdfOptions
      );

      showSuccess("Success", "PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF download failed:", error);
      showError("Download Failed", "Failed to download PDF: " + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getAtsScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
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
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            AI Cover Letter Generator
          </CardTitle>
          <CardDescription className="text-base ml-11">
            Create ATS-optimized cover letters tailored to specific job applications using advanced AI models.
          </CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-lg border-muted/40 h-fit">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Job Details
            </CardTitle>
            <CardDescription>
              Provide information about the position you&apos;re applying for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Job Title <span className="text-red-500">*</span>
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
                <Label htmlFor="companyName" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Tech Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="jobDescription">
                  Job Description <span className="text-red-500">*</span>
                </Label>
                <div className="text-xs text-muted-foreground tabular-nums">
                  <span className={cn(jobDescriptionChars > 15000 ? "text-destructive" : undefined)}>
                    {jobDescriptionChars}/15000
                  </span>
                  <span className={cn(jobDescriptionChars > 0 && jobDescriptionChars < 50 ? "text-amber-600" : "text-muted-foreground")}>
                    {jobDescriptionChars < 50 ? ` • ${Math.max(0, 50 - jobDescriptionChars)} to min` : " • min met"}
                  </span>
                </div>
              </div>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                rows={5}
                className="bg-background resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="experience">Your Relevant Experience</Label>
                <div className="text-xs text-muted-foreground tabular-nums">
                  <span className={cn(experienceChars > 5000 ? "text-destructive" : undefined)}>
                    {experienceChars}/5000
                  </span>
                </div>
              </div>
              <Textarea
                id="experience"
                placeholder="Briefly describe your experience relevant to this role..."
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={3}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={formData.tone} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={formData.length} onValueChange={(value: any) => setFormData(prev => ({ ...prev, length: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise (150-200 words)</SelectItem>
                    <SelectItem value="standard">Standard (200-300 words)</SelectItem>
                    <SelectItem value="detailed">Detailed (300+ words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Export Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-template">Template</Label>
                  <Select 
                    value={pdfOptions.template} 
                    onValueChange={(value: any) => setPdfOptions(prev => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger id="pdf-template" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-color">Color Scheme</Label>
                  <Select 
                    value={pdfOptions.colorScheme} 
                    onValueChange={(value: any) => setPdfOptions(prev => ({ ...prev, colorScheme: value }))}
                  >
                    <SelectTrigger id="pdf-color" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hireall">Hireall (Teal)</SelectItem>
                      <SelectItem value="blue">Professional Blue</SelectItem>
                      <SelectItem value="gray">Elegant Gray</SelectItem>
                      <SelectItem value="green">Nature Green</SelectItem>
                      <SelectItem value="purple">Creative Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">AI Options</h4>
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
                    <Label htmlFor="keyword-focus" className="text-base">Keyword Focus</Label>
                    <p className="text-xs text-muted-foreground">Prioritize job description keywords</p>
                  </div>
                  <Switch
                    id="keyword-focus"
                    checked={keywordFocus}
                    onCheckedChange={setKeywordFocus}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="deep-research" className="text-base">Deep Research</Label>
                    <p className="text-xs text-muted-foreground">Include company-specific insights</p>
                  </div>
                  <Switch
                    id="deep-research"
                    checked={deepResearch}
                    onCheckedChange={setDeepResearch}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={generateCoverLetter} 
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
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>

            {!canGenerate ? (
              <p className="text-xs text-muted-foreground">
                Fill Job Title, Company Name, and Job Description to generate.
              </p>
            ) : formData.jobDescription.trim().length < 50 ? (
              <p className="text-xs text-muted-foreground">
                Tip: paste at least 50 characters of the job description for best results.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card className="shadow-lg border-muted/40 flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {showHistory ? "Version History" : "Generated Cover Letter"}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={showHistory ? "default" : "outline"} 
                  onClick={() => {
                    if (!showHistory) fetchHistory();
                    setShowHistory(!showHistory);
                  }}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
                
                {!showHistory && generatedLetter && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={downloadPDF}
                      disabled={downloadingPDF}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
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
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/5 overflow-y-auto">
            {showHistory ? (
              <div className="p-4 space-y-3">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading your history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="p-3 bg-muted rounded-full">
                      <History className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <h4 className="font-medium">No history yet</h4>
                      <p className="text-sm text-muted-foreground max-w-[200px]">Generated letters will appear here for easy access later.</p>
                    </div>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item._id}
                      onClick={() => {
                        setGeneratedLetter(item);
                        setEditedContent(item.content);
                        setShowHistory(false);
                      }}
                      className={cn(
                        "group p-4 bg-white border rounded-xl shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative",
                        generatedLetter?._id === item._id && "border-primary ring-2 ring-primary/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h5 className="font-bold text-sm leading-tight text-foreground line-clamp-1">{item.jobTitle || "Untitled Position"}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.companyName || "Unknown Company"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-xxs font-bold px-1.5 py-0.5 rounded",
                            (item as any).atsScore >= 80 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {(item as any).atsScore}%
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteHistoryItem(e, item._id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        &quot;{item.content.slice(0, 100)}...&quot;
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xxs text-muted-foreground">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{item.tone}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : generatedLetter ? (
              <div className="p-6 space-y-6">
                {/* Fallback Notification */}
                {generatedLetter.source === 'fallback' && (
                  <Alert className="bg-blue-50 border-blue-200 text-blue-800 py-3">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-xs font-bold uppercase tracking-tight mb-1">AI Service Unavailable</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      We&apos;ve generated a high-quality template based on your experience. You can edit this directly or try re-generating in a few minutes.
                    </AlertDescription>
                  </Alert>
                )}

                {/* ATS Score */}
                <div className="p-5 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold">ATS Score</span>
                    </div>
                    <span className={`font-bold text-lg ${getAtsScoreColor(generatedLetter.atsScore)}`}>
                      {generatedLetter.atsScore}%
                    </span>
                  </div>
                  <Progress value={generatedLetter.atsScore} className="h-2.5" />
                  <p className="text-xs text-muted-foreground mt-2 text-right font-medium">
                    {getAtsScoreLabel(generatedLetter.atsScore)}
                  </p>
                </div>

                {/* Keywords */}
                {generatedLetter.keywords.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Keywords Optimized
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedLetter.keywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter Content - Document View */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Preview</h4>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {previewWordCount || generatedLetter.wordCount} words • {generatedLetter.tone} tone
                    </div>
                  </div>
                  
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[300px] sm:min-h-[400px] p-8 bg-white text-black shadow-md border rounded-sm font-serif text-sm leading-relaxed resize-y"
                  />
                </div>

                {generatedLetter.deepResearch && generatedLetter.researchInsights && generatedLetter.researchInsights.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-700">
                      <Star className="h-4 w-4" />
                      Research Highlights
                    </h4>
                    <ul className="space-y-2">
                      {generatedLetter.researchInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-purple-800">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {generatedLetter.improvements.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-700">
                      <TrendingUp className="h-4 w-4" />
                      Suggestions for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {generatedLetter.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-70" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/10 my-4 mx-6">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No Letter Generated</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                    Fill in the form and click generate, or check your history for previous letters.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-6"
                    onClick={() => {
                      fetchHistory();
                      setShowHistory(true);
                    }}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          {!showHistory && !generatedLetter && (
            <CardFooter className="bg-muted/5 border-t py-4 text-center justify-center">
              <p className="text-xs text-muted-foreground">
                Your generated cover letters are saved automatically to your history.
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
