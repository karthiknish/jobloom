"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  RefreshCw,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  Zap,
  Star,
  TrendingUp,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/components/ui/Toast";
import PDFGenerator from "@/lib/pdfGenerator";
import { getAuthClient } from "@/firebase/client";
import { dashboardApi, type Job } from "@/utils/api/dashboard";
import { formatLetter } from "./cover-letter/format-letter";
import { DEFAULT_LETTER_DATA } from "./cover-letter/templates";
import type { CoverLetterData, CoverLetterGeneratorProps } from "./cover-letter/types";
import { themeColors, themeUtils } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  resumeData,
  onGenerate,
}) => {
  const [formData, setFormData] = useState<CoverLetterData>(DEFAULT_LETTER_DATA);
  const [letter, setLetter] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [includeAchievements, setIncludeAchievements] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [letterScore, setLetterScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Load user's jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const auth = getAuthClient();
        const currentUser = auth?.currentUser;
        if (!currentUser) return;
        
        const user = await dashboardApi.getUserByFirebaseUid(currentUser.uid);
        const userJobs = await dashboardApi.getJobsByUser(user._id);
        setJobs(userJobs);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, []);

  const updateField = (field: keyof CoverLetterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    updateField("jobTitle", job.title);
    updateField("companyName", job.company);
    updateField("companyLocation", job.location);
    updateField("jobDescription", job.description?.split('.')[0] || '');
    
    // Extract requirements from job data
    if (job.requirements && job.requirements.length > 0) {
      setFormData(prev => ({
        ...prev,
        keyRequirements: (job.requirements || []).slice(0, 3)
      }));
    }
    
    // Extract skills as requirements if no requirements exist
    if ((!job.requirements || job.requirements.length === 0) && job.skills && job.skills.length > 0) {
      setFormData(prev => ({
        ...prev,
        keyRequirements: (job.skills || []).slice(0, 3)
      }));
    }
  };

  // Clear job selection
  const handleClearJobSelection = () => {
    setSelectedJob(null);
    setFormData(prev => ({
      ...prev,
      jobTitle: '',
      companyName: '',
      companyLocation: '',
      jobDescription: '',
      keyRequirements: ['']
    }));
  };

  const updateArrayField = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (
    field: keyof Pick<CoverLetterData, "keyRequirements" | "companyValues">,
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Calculate cover letter score
  const calculateLetterScore = (letterText: string) => {
    let score = 0;
    
    // Check for key components (40%)
    if (letterText.includes('Dear')) score += 10;
    if (letterText.includes('Sincerely') || letterText.includes('Best regards') || letterText.includes('Yours')) score += 10;
    if (letterText.includes(formData.companyName)) score += 10;
    if (letterText.includes(formData.jobTitle)) score += 10;
    
    // Check for personalization (30%)
    if (letterText.includes(resumeData.personalInfo?.fullName || '')) score += 10;
    if (letterText.includes('experience') || letterText.includes('background')) score += 10;
    if (letterText.includes('skills') || letterText.includes('expertise')) score += 10;
    
    // Check for structure (20%)
    const paragraphs = letterText.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length >= 3) score += 10;
    if (paragraphs.length >= 5) score += 10;
    
    // Check for achievements (10%)
    if (includeAchievements && letterText.includes('•')) score += 10;
    
    return Math.min(100, score);
  };

  // Generate AI suggestions
  const generateSuggestions = () => {
    const ideas = [
      "Mention a specific company achievement or recent news",
      "Include a quantifiable accomplishment from your resume",
      "Reference the company's values or mission statement",
      "Add a sentence about why you're passionate about this industry",
      "Include a call to action for the next steps",
      "Mention a specific skill that matches the job requirements",
      "Add a personal connection to the company or role"
    ];
    
    setSuggestions(ideas.sort(() => Math.random() - 0.5).slice(0, 4));
  };

  const handleGenerate = () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      showError("Enter at least a job title and company");
      return;
    }
    try {
      setGenerating(true);
      const generated = formatLetter(formData, resumeData, { includeAchievements, selectedJob });
      setLetter(generated);
      const score = calculateLetterScore(generated);
      setLetterScore(score);
      onGenerate?.(generated);
      
      if (score >= 80) {
        showSuccess("Excellent cover letter generated!");
      } else if (score >= 60) {
        showSuccess("Cover letter generated. Consider adding more personalization.");
      } else {
        showSuccess("Cover letter generated. Review the suggestions below for improvements.");
      }
      
      generateSuggestions();
    } catch (e) {
      console.error(e);
      showError("Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      showSuccess("Copied to clipboard");
    } catch {
      showError("Clipboard copy failed");
    }
  };

  const handleDownloadPDF = async () => {
    if (!letter || !formData.jobTitle || !formData.companyName) {
      showError("Missing information for PDF generation");
      return;
    }

    try {
      setDownloadingPDF(true);
      
      // Validate content
      const validation = PDFGenerator.validateContent(letter);
      if (!validation.valid) {
        showError(`PDF validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare metadata
      const metadata = {
        candidateName: resumeData.personalInfo?.fullName || 'Your Name',
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        recipientName: formData.hiringManager !== 'Hiring Team' ? formData.hiringManager : undefined,
        recipientTitle: 'Hiring Manager'
      };

      // Generate and download PDF
      await PDFGenerator.generateAndDownloadCoverLetter(
        letter,
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

      showSuccess("PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF download failed:", error);
      showError("Failed to download PDF: " + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!letter || !formData.jobTitle || !formData.companyName) {
      showError("Missing information for PDF preview");
      return;
    }

    try {
      // Validate content
      const validation = PDFGenerator.validateContent(letter);
      if (!validation.valid) {
        showError(`PDF validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare metadata
      const metadata = {
        candidateName: resumeData.personalInfo?.fullName || 'Your Name',
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        recipientName: formData.hiringManager !== 'Hiring Team' ? formData.hiringManager : undefined,
        recipientTitle: 'Hiring Manager'
      };

      // Generate and preview PDF
      await PDFGenerator.previewPDF(letter, metadata);
      showSuccess("PDF preview opened in new tab!");
    } catch (error: any) {
      console.error("PDF preview failed:", error);
      showError("Failed to preview PDF: " + error.message);
    }
  };

  return (
    <Card className="mt-8 bg-white shadow-sm border-gray-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", "bg-blue-50")}>
                <FileText className={cn("h-5 w-5", themeColors.primary.text)} />
              </div>
              AI Cover Letter Generator
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Create a personalized cover letter that stands out
            </CardDescription>
          </div>
          {letterScore > 0 && (
            <div className="text-right">
              <div className={cn("text-3xl font-bold", themeColors.primary.text)}>{letterScore}%</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone and Template Selection */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Options</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Tone Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['professional', 'enthusiastic', 'formal', 'casual'] as const).map((tone) => (
                  <Button
                    key={tone}
                    variant={formData.tone === tone ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateField("tone", tone)}
                    className={cn("text-xs", formData.tone === tone
                      ? cn("bg-primary", "hover:opacity-90 text-white")
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    )}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Template Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['modern', 'classic', 'creative', 'executive'] as const).map((template) => (
                  <Button
                    key={template}
                    variant={formData.template === template ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateField("template", template)}
                    className={cn("text-xs", formData.template === template
                      ? cn("bg-primary", "hover:opacity-90 text-white")
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    )}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Job Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Selection</h3>
          {loadingJobs ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading your saved jobs...
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-3">
              {selectedJob ? (
                <div className={cn("p-4 border rounded-lg", "bg-blue-50", "border-blue-200")}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={cn("font-medium", "text-blue-900")}>{selectedJob.title}</div>
                      <div className={cn("text-sm", themeColors.primary.text)}>{selectedJob.company} • {selectedJob.location}</div>
                      {selectedJob.skills && selectedJob.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedJob.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="outline" className={cn("text-xs bg-white", themeColors.primary.border, themeColors.primary.text)}>
                              {skill}
                            </Badge>
                          ))}
                          {selectedJob.skills.length > 4 && (
                            <Badge variant="outline" className={cn("text-xs bg-white", themeColors.primary.border, themeColors.primary.text)}>
                              +{selectedJob.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearJobSelection}
                      className={cn("hover:bg-blue-100", themeColors.primary.text, themeColors.primary.border)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {jobs.slice(0, 5).map((job) => (
                    <Button
                      key={job._id}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left hover:bg-gray-50 border-gray-200"
                      onClick={() => handleJobSelect(job)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-600">{job.company} • {job.location}</div>
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-gray-100">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-xs text-gray-600">+{job.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                  {jobs.length > 5 && (
                    <div className="text-center text-xs text-gray-600 pt-2">
                      And {jobs.length - 5} more jobs...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
              No saved jobs found. Add jobs to your dashboard to use them here.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                Job Title *
              </Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => updateField("jobTitle", e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                Company Name *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="e.g. Acme Corp"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLocation" className="text-sm font-medium text-gray-700">
                Company Location
              </Label>
              <Input
                id="companyLocation"
                value={formData.companyLocation}
                onChange={(e) => updateField("companyLocation", e.target.value)}
                placeholder="e.g. Remote / New York, NY"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hiringManager" className="text-sm font-medium text-gray-700">
                Hiring Manager
              </Label>
              <Input
                id="hiringManager"
                value={formData.hiringManager}
                onChange={(e) => updateField("hiringManager", e.target.value)}
                placeholder="Optional - e.g. Sarah Johnson"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className={cn("rounded-xl border p-6", "bg-gradient-to-br from-blue-50 to-indigo-50", "border-blue-200")}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", "bg-primary")}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">AI-Powered Enhancements</h4>
              <p className="text-xs text-gray-600">Get intelligent suggestions for a stronger cover letter</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const skills = resumeData.skills?.flatMap(s => s.skills).slice(0, 3) || [];
                if (skills.length > 0) {
                  updateArrayField("keyRequirements", 0, skills.join(", "));
                  showSuccess("Key skills added from your resume!");
                }
              }}
              className="text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Extract Skills from Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (resumeData.experience?.[0]) {
                  const exp = resumeData.experience[0];
                  updateField("customOpening", `As a ${exp.position} with proven success at ${exp.company}, I was excited to discover the ${formData.jobTitle} opportunity at ${formData.companyName}.`);
                  showSuccess("Personalized opening created!");
                }
              }}
              className="text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Create Personalized Opening
            </Button>
            {selectedJob && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedJob.requirements && selectedJob.requirements.length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      keyRequirements: (selectedJob.requirements || []).slice(0, 3)
                    }));
                    showSuccess("Requirements extracted from job!");
                  } else if (selectedJob.skills && selectedJob.skills.length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      keyRequirements: (selectedJob.skills || []).slice(0, 3)
                    }));
                    showSuccess("Skills extracted from job as requirements!");
                  }
                }}
                className="text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Use Job Requirements
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Key Requirements from Job Description</Label>
            {formData.keyRequirements.map((req, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={req}
                  onChange={(e) => updateArrayField("keyRequirements", i, e.target.value)}
                  placeholder="e.g. 5+ years React experience"
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("keyRequirements", i)}
                  disabled={formData.keyRequirements.length === 1}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addArrayItem("keyRequirements")}>
              <Plus className="h-3 w-3 mr-1" />
              Add Requirement
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Company Values & Culture</Label>
            {formData.companyValues.map((val, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={val}
                  onChange={(e) => updateArrayField("companyValues", i, e.target.value)}
                  placeholder="e.g. Innovation, Teamwork"
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("companyValues", i)}
                  disabled={formData.companyValues.length === 1}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addArrayItem("companyValues")}>
              <Plus className="h-3 w-3 mr-1" />
              Add Value
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description (First Paragraph)</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => updateField("jobDescription", e.target.value)}
            rows={3}
            placeholder="Paste the first paragraph of the job description to help tailor your letter..."
            className="text-sm"
          />
        </div>

        {/* Custom Sections */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Custom Opening (Optional)</Label>
            <Textarea
              value={formData.customOpening || ""}
              onChange={(e) => updateField("customOpening", e.target.value)}
              rows={2}
              placeholder="Override the default opening..."
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Body (Optional)</Label>
            <Textarea
              value={formData.customBody || ""}
              onChange={(e) => updateField("customBody", e.target.value)}
              rows={2}
              placeholder="Add specific points you want to emphasize..."
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Closing (Optional)</Label>
            <Textarea
              value={formData.customClosing || ""}
              onChange={(e) => updateField("customClosing", e.target.value)}
              rows={2}
              placeholder="Custom closing statement..."
              className="text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center flex-wrap">
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !formData.jobTitle.trim() || !formData.companyName.trim()}
            className={cn("hover:opacity-90", "bg-gradient-to-r from-blue-600 to-indigo-600")}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate AI Cover Letter
              </>
            )}
          </Button>
          
          {letter && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreviewPDF}
                disabled={!letter || !formData.jobTitle || !formData.companyName}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              <Button 
                variant="default" 
                onClick={handleDownloadPDF}
                disabled={downloadingPDF || !letter || !formData.jobTitle || !formData.companyName}
                className={cn("hover:opacity-90", "bg-green-600")}
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </>
          )}
          
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeAchievements}
              onChange={e => setIncludeAchievements(e.target.checked)}
            />
            Include achievements from resume
          </label>
        </div>

        {/* Generated Letter with Preview */}
        {letter && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Generated Cover Letter</Label>
              <div className="flex items-center gap-2">
                {letterScore >= 80 && <Star className="h-5 w-5 text-yellow-500" />}
                <Badge variant={letterScore >= 80 ? "default" : letterScore >= 60 ? "secondary" : "outline"}>
                  {letterScore}% Quality Score
                </Badge>
              </div>
            </div>
            
            {showPreview ? (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                  {letter}
                </div>
              </div>
            ) : (
              <Textarea 
                value={letter} 
                readOnly 
                rows={16} 
                className="font-mono text-sm border-gray-200" 
              />
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className={cn("p-4 rounded-lg border", themeColors.warning.bg, themeColors.warning.border)}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={cn("h-5 w-5", themeColors.warning.text)} />
                  <div>
                    <p className={cn("text-sm font-medium", themeColors.warning.text)}>Suggestions for Improvement</p>
                    <p className={cn("text-xs", themeColors.warning.text, "opacity-90")}>Consider these enhancements to make your letter even stronger</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", themeColors.success.icon)} />
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
