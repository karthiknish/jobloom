"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  RefreshCw,
  Eye,
  Zap,
  Download,
  Loader2,
  Palette,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/components/ui/Toast";
import PDFGenerator from "@/lib/pdfGenerator";
import { getAuthClient } from "@/firebase/client";
import { dashboardApi, type Job } from "@/utils/api/dashboard";
import { formatLetter } from "./cover-letter/format-letter";
import { DEFAULT_LETTER_DATA } from "./cover-letter/templates";
import type { CoverLetterData, CoverLetterGeneratorProps } from "./cover-letter/types";
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

// Modular Sub-components
import { JobSelector } from "./cover-letter/JobSelector";
import { TemplateGallery } from "./cover-letter/TemplateGallery";
import { CoverLetterForm } from "./cover-letter/CoverLetterForm";

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

  const updateArrayField = (
    field: "keyRequirements" | "companyValues",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addArrayItem = (field: "keyRequirements" | "companyValues") => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field: "keyRequirements" | "companyValues", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setFormData(prev => ({
      ...prev,
      jobTitle: job.title,
      companyName: job.company,
      companyLocation: job.location || "",
      jobDescription: job.description?.split('.')[0] || "",
      keyRequirements: (job.requirements || job.skills || []).slice(0, 3) || [""]
    }));
  };

  const handleClearJobSelection = () => {
    setSelectedJob(null);
    setFormData(prev => ({
      ...prev,
      jobTitle: "",
      companyName: "",
      companyLocation: "",
      jobDescription: "",
      keyRequirements: [""]
    }));
  };

  const calculateLetterScore = (letterText: string) => {
    let score = 0;
    if (letterText.includes("Dear")) score += 10;
    if (letterText.includes("Sincerely") || letterText.includes("Best regards")) score += 10;
    if (letterText.includes(formData.companyName)) score += 10;
    if (letterText.includes(formData.jobTitle)) score += 10;
    if (letterText.includes(resumeData.personalInfo?.fullName || "")) score += 20;
    const paragraphs = letterText.split("\n\n").filter(p => p.trim().length > 50);
    if (paragraphs.length >= 3) score += 20;
    if (includeAchievements && letterText.includes("•")) score += 20;
    return Math.min(100, score);
  };

  const handleGenerate = () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      showError("Enter at least a job title and company");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const generated = formatLetter(formData, resumeData, { includeAchievements, selectedJob });
        setLetter(generated);
        setLetterScore(calculateLetterScore(generated));
        onGenerate?.(generated);
        showSuccess("Cover letter generated!");
      } catch (e) {
        showError("Failed to generate cover letter");
      } finally {
        setGenerating(false);
      }
    }, 500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    showSuccess("Copied to clipboard");
  };

  const handleDownloadPDF = async () => {
    if (!letter) {
      showError("No content to export");
      return;
    }

    const validation = PDFGenerator.validateContent(letter);
    if (!validation.valid) {
      showError(validation.errors[0]);
      return;
    }

    setDownloadingPDF(true);
    try {
      const metadata = {
        candidateName: resumeData.personalInfo?.fullName || "Your Name",
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        email: resumeData.personalInfo?.email || "",
        phone: resumeData.personalInfo?.phone || "",
        location: resumeData.personalInfo?.location || "",
        recipientTitle: formData.hiringManager || "Hiring Manager",
      };

      const pdfOptions = {
        template: formData.template,
        colorScheme: formData.colorScheme,
        fontSize: 12,
        font: 'helvetica' as const,
      };

      await PDFGenerator.generateAndDownloadCoverLetter(letter, metadata, undefined, pdfOptions);
      showSuccess("Professional PDF downloaded!");
    } catch (e) {
      console.error("PDF download failed:", e);
      showError("PDF download failed. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <Card className="mt-8 bg-white shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="border-b bg-gray-50/50 pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 font-bold">
              <div className="p-2 bg-primary rounded-lg shadow-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              AI Cover Letter Generator
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm italic">
              Create a personalized cover letter that highlights your value
            </CardDescription>
          </div>
          {letterScore > 0 && (
            <div className="text-right px-4 py-2 bg-white rounded-xl border shadow-sm">
              <div className={cn("text-2xl font-black", themeColors.primary.text)}>{letterScore}%</div>
              <div className="text-xxs uppercase tracking-wider font-bold text-gray-400">Quality Score</div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-10">
        {/* Step 1: Template Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary text-primary font-bold">1</Badge>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Select a Professional Template</h3>
          </div>
          <TemplateGallery
            selectedTemplate={formData.template}
            onTemplateSelect={(t) => updateField("template", t)}
          />

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Accent Color Scheme</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select 
                value={formData.colorScheme} 
                onValueChange={(val: any) => updateField("colorScheme", val)}
              >
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Select a color scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hireall">Hireall (Teal)</SelectItem>
                  <SelectItem value="blue">Professional Blue</SelectItem>
                  <SelectItem value="gray">Sleek Gray</SelectItem>
                  <SelectItem value="green">Nature Green</SelectItem>
                  <SelectItem value="purple">Creative Purple</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xxs text-gray-400 mt-2 md:col-span-2 lg:col-span-3">
                This color will be used for headers and accents in your PDF.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Job & Input */}
          <div className="space-y-10">
            {/* Step 2: Job Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary text-primary font-bold">2</Badge>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Focus on a Job Application</h3>
              </div>
              <JobSelector
                jobs={jobs}
                selectedJob={selectedJob}
                onJobSelect={handleJobSelect}
                onClear={handleClearJobSelection}
                loading={loadingJobs}
              />
            </section>

            {/* Step 3: Details */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary text-primary font-bold">3</Badge>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Refine Application Details</h3>
              </div>
              <CoverLetterForm
                formData={formData}
                onUpdateField={updateField}
                onAddArrayItem={addArrayItem}
                onRemoveArrayItem={removeArrayItem}
                onUpdateArrayField={updateArrayField}
              />
            </section>

            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 text-sm cursor-pointer select-none bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={includeAchievements}
                  onChange={e => setIncludeAchievements(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Include Resume Achievements</span>
                  <span className="text-xs text-gray-500">Add bullet points of your key successes automatically</span>
                </div>
              </label>

              <Button 
                onClick={handleGenerate} 
                disabled={generating || !formData.jobTitle.trim() || !formData.companyName.trim()}
                className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                    Crafting your letter...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-3 fill-white" />
                    Generate AI Cover Letter
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col h-full">
            <section className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary text-primary font-bold">4</Badge>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Review & Export</h3>
                </div>
                {letter && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="h-8 gap-1">
                      <Eye className="h-3.5 w-3.5" /> {showPreview ? "Edit" : "Preview"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[500px] flex flex-col">
                {letter ? (
                  <div className="flex flex-col h-full space-y-4">
                    {showPreview ? (
                      <div className="flex-1 p-8 bg-gray-50 border-2 border-dashed rounded-xl overflow-y-auto">
                        <div className="bg-white p-10 shadow-xl rounded-sm border min-h-full whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-[11pt]">
                          {letter}
                        </div>
                      </div>
                    ) : (
                      <Textarea 
                        value={letter} 
                        onChange={(e) => setLetter(e.target.value)}
                        className="flex-1 p-6 font-mono text-sm border-gray-200 focus:ring-primary h-full resize-none bg-gray-50/30" 
                      />
                    )}
                    
                    <Button 
                      variant="default" 
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF || !letter}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors shadow-md"
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
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-3xl border-gray-200 bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                      <FileText className="h-8 w-8 text-gray-300" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Ready to shine?</h4>
                    <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
                      Fill in the job details and let our AI craft a compelling narrative for your next career move.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
