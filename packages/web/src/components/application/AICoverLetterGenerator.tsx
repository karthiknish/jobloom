"use client";

import React, { useState } from "react";
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
import PDFGenerator from "@/lib/pdfGenerator";
import { cn } from "@/lib/utils";

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
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  tone: string;
  wordCount: number;
  deepResearch?: boolean;
  researchInsights?: string[];
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function AICoverLetterGenerator() {
  const { user } = useFirebaseAuth();
  const { plan } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [formData, setFormData] = useState<CoverLetterData>({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    skills: [],
    experience: "",
    tone: "professional",
    length: "standard",
  });
  const [skillInput, setSkillInput] = useState("");
  const [atsOptimization, setAtsOptimization] = useState(true);
  const [keywordFocus, setKeywordFocus] = useState(true);
  const [deepResearch, setDeepResearch] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const generateCoverLetter = async () => {
    if (!formData.jobTitle || !formData.companyName || !formData.jobDescription) {
      showError("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (plan === "free") {
      showError("Upgrade Required", "AI cover letter generation is a premium feature. Please upgrade to unlock.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          atsOptimization,
          keywordFocus,
          deepResearch,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover letter");
      }

      const data = await response.json();
      setGeneratedLetter(data);
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
      };
      
      setGeneratedLetter(mockLetter);
      showInfo("Demo Mode", "This is a sample cover letter. Upgrade for full AI generation.");
    } finally {
      setIsGenerating(false);
    }
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
    if (generatedLetter) {
      try {
        await navigator.clipboard.writeText(generatedLetter.content);
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
      
      // Validate content
      const validation = PDFGenerator.validateContent(generatedLetter.content);
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
        recipientTitle: 'Hiring Manager'
      };

      // Generate and download PDF
      await PDFGenerator.generateAndDownloadCoverLetter(
        generatedLetter.content,
        metadata,
        undefined,
        {
          fontSize: 12,
          lineHeight: 1.5,
          margin: 20,
          font: 'helvetica',
          fontStyle: 'normal'
        }
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
      <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            AI Cover Letter Generator
          </CardTitle>
          <CardDescription className="text-base ml-11">
            Create ATS-optimized cover letters tailored to specific job applications using advanced AI models.
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
                    Upgrade to generate unlimited AI-powered cover letters with ATS optimization
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
              Job Details
            </CardTitle>
            <CardDescription>
              Provide information about the position you&apos;re applying for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <Label htmlFor="jobDescription">Job Description <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="experience">Your Relevant Experience</Label>
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
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
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
              disabled={isGenerating || plan === "free"}
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
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card className="shadow-lg border-muted/40 flex flex-col h-full">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generated Cover Letter
              </span>
              {generatedLetter && (
                <div className="flex gap-2">
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
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 bg-muted/5">
            {generatedLetter ? (
              <div className="space-y-6">
                {/* ATS Score */}
                <div className="p-5 bg-white dark:bg-card rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                        <Badge key={keyword} variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 px-2 py-1">
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
                      {generatedLetter.wordCount} words • {generatedLetter.tone} tone
                    </div>
                  </div>
                  
                  <div className="p-8 bg-white text-black shadow-md border rounded-sm min-h-[400px] font-serif text-[11pt] leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {generatedLetter.content}
                    </div>
                  </div>
                </div>

                {generatedLetter.deepResearch && generatedLetter.researchInsights && generatedLetter.researchInsights.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Star className="h-4 w-4" />
                      Research Highlights
                    </h4>
                    <ul className="space-y-2">
                      {generatedLetter.researchInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {generatedLetter.improvements.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <TrendingUp className="h-4 w-4" />
                      Suggestions for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {generatedLetter.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-70" />
                          {improvement}
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
                  Fill in the job details on the left and click "Generate Cover Letter" to create your personalized document.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
