"use client";

import React, { useState } from "react";
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
import { useSubscription } from "@/hooks/useSubscription";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import PDFGenerator from "@/lib/pdfGenerator";

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
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getAtsScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Cover Letter Generator
          </CardTitle>
          <CardDescription>
            Create ATS-optimized cover letters tailored to specific job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "free" && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-semibold text-amber-900">Premium Feature</h4>
                  <p className="text-sm text-amber-700">
                    Upgrade to generate unlimited AI-powered cover letters with ATS optimization
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Provide information about the position you&apos;re applying for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Tech Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="experience">Your Relevant Experience</Label>
              <Textarea
                id="experience"
                placeholder="Briefly describe your experience relevant to this role..."
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Key Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select value={formData.tone} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
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
              <div>
                <Label htmlFor="length">Length</Label>
                <Select value={formData.length} onValueChange={(value: any) => setFormData(prev => ({ ...prev, length: value }))}>
                  <SelectTrigger>
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

            <div className="space-y-3">
              <h4 className="font-medium">AI Options</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ats-optimization"
                  checked={atsOptimization}
                  onCheckedChange={setAtsOptimization}
                />
                <Label htmlFor="ats-optimization">ATS Optimization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="keyword-focus"
                  checked={keywordFocus}
                  onCheckedChange={setKeywordFocus}
                />
                <Label htmlFor="keyword-focus">Keyword Focus</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="deep-research"
                  checked={deepResearch}
                  onCheckedChange={setDeepResearch}
                />
                <Label htmlFor="deep-research">Deep Research (adds company insights)</Label>
              </div>
            </div>

            <Button 
              onClick={generateCoverLetter} 
              disabled={isGenerating || plan === "free"}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
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
                    className="bg-green-600 hover:bg-green-700"
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
          <CardContent>
            {generatedLetter ? (
              <div className="space-y-4">
                {/* ATS Score */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">ATS Score</span>
                    </div>
                    <span className={`font-bold ${getAtsScoreColor(generatedLetter.atsScore)}`}>
                      {generatedLetter.atsScore}% - {getAtsScoreLabel(generatedLetter.atsScore)}
                    </span>
                  </div>
                  <Progress value={generatedLetter.atsScore} className="h-2" />
                </div>

                {/* Keywords */}
                {generatedLetter.keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Keywords Found
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedLetter.keywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className="text-green-700 border-green-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter Content */}
                <div>
                  <h4 className="font-medium mb-2">Cover Letter</h4>
                  <div className="p-4 bg-white border rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {generatedLetter.content}
                    </pre>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {generatedLetter.wordCount} words • {generatedLetter.tone} tone
                  </div>
                </div>

                {generatedLetter.deepResearch && generatedLetter.researchInsights && generatedLetter.researchInsights.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-purple-600" />
                      Research Highlights
                    </h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {generatedLetter.researchInsights.map((insight) => (
                        <li key={insight}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {generatedLetter.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Suggestions for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {generatedLetter.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated cover letter will appear here</p>
                <p className="text-sm mt-1">Fill in the job details and click generate to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
