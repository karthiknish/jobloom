"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { RealTimeAtsFeedback } from "./RealTimeAtsFeedback";
import { calculateResumeScore } from "@/lib/ats";
import type { ResumeData } from "@/types/resume";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showError, showSuccess, showWarning } from "@/components/ui/Toast";

interface CvUploadFormProps {
  userId: string;
  onUploadSuccess?: (analysisId: string) => void;
  onUploadStarted?: () => void;
  onResumeUpdate?: (resume: ResumeData, targetRole?: string, industry?: string) => void;
  currentResume?: ResumeData;
  currentAtsScore?: any;
  setCurrentAtsScore?: (score: any) => void;
}

interface UploadLimits {
  maxSize: number;
  maxSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  description: string;
}

export function CvUploadForm({ userId, onUploadSuccess, onUploadStarted, onResumeUpdate }: CvUploadFormProps) {
  const { user } = useFirebaseAuth();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [upgradePromptVisible, setUpgradePromptVisible] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [showRealTimeFeedback, setShowRealTimeFeedback] = useState(false);
  const [sampleResume, setSampleResume] = useState<ResumeData | null>(null);
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>({
    maxSize: 2 * 1024 * 1024, // 2MB default
    maxSizeMB: 2,
    allowedTypes: ['application/pdf', 'text/plain'],
    allowedExtensions: ['pdf', 'txt'],
    description: 'Free users can upload CVs up to 2MB'
  });
  const [loadingLimits, setLoadingLimits] = useState(true);

  // Fetch upload limits for the current user
  useEffect(() => {
    const fetchUploadLimits = async () => {
      if (!user) return;
      
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/user/upload-limits', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUploadLimits(result.uploadLimits);
            console.log('Upload limits loaded:', result.uploadLimits);
          }
        } else {
          console.warn('Failed to fetch upload limits, using defaults');
        }
      } catch (error) {
        console.error('Error fetching upload limits:', error);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchUploadLimits();
  }, [user]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showWarning("Select a CV file to upload");
      return;
    }

  setUploading(true);
  onUploadStarted?.();

    try {
      console.log("CV Upload Form - Starting upload:");
      console.log("- userId prop:", userId);
      console.log("- file:", file ? `${file.name} (${file.size} bytes)` : "null");
      console.log("- targetRole:", targetRole);
      console.log("- industry:", industry);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("targetRole", targetRole);
      formData.append("industry", industry);

      if (!user) {
        throw new Error("You must be signed in to upload a CV");
      }

      const idToken = await user.getIdToken();
      console.log("- user authenticated:", !!user);
      console.log("- idToken obtained:", !!idToken);

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          "CV uploaded successfully",
          "Our AI is analyzing your CV. You'll receive detailed feedback shortly."
        );
        setFile(null);
        setTargetRole("");
        setIndustry("");
        // Reset file input
        const fileInput = document.getElementById(
          "file-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        if (result.analysisId) {
          // Notify parent so it can refetch & switch tabs
            onUploadSuccess?.(result.analysisId);
        }
      } else if (result.upgradeRequired) {
        // Show upgrade prompt for limit reached
        setUpgradePromptVisible(true);
        setLimitInfo(result);
      } else {
        showError(
          "Upload failed",
          `${result.error ? `${result.error}. ` : ""}Check the file format and size, then try again.`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      showError(
        "Upload interrupted",
        "Check your connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const createSampleResume = (): ResumeData => {
    return {
      personalInfo: {
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "555-123-4567",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/johndoe",
        github: "github.com/johndoe",
        summary: targetRole ? `Experienced ${targetRole} with proven track record of success in ${industry || "technology"} industry.` : "Experienced professional with proven track record of success."
      },
      experience: [
        {
          id: "1",
          company: "Tech Corp",
          position: targetRole || "Senior Professional",
          location: "San Francisco, CA",
          startDate: "2020-01",
          endDate: "2023-12",
          current: false,
          description: "Led key initiatives and delivered exceptional results",
          achievements: [
            "Increased performance by 40% through optimization",
            "Managed cross-functional teams",
            "Reduced costs by 25% through process improvements"
          ]
        }
      ],
      education: [
        {
          id: "1",
          institution: "University of California",
          degree: "Bachelor of Science",
          field: targetRole === "Software Engineer" ? "Computer Science" : "Business Administration",
          graduationDate: "2018-05",
          gpa: "3.8"
        }
      ],
      skills: [
        {
          category: targetRole === "Software Engineer" ? "Technical" : "Core Competencies",
          skills: targetRole === "Software Engineer"
            ? ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker"]
            : ["Leadership", "Project Management", "Communication", "Problem Solving", "Data Analysis"]
        }
      ],
      projects: [],
      certifications: [],
      languages: []
    };
  };

  const handleShowRealTimeFeedback = () => {
    const resume = sampleResume || createSampleResume();
    setSampleResume(resume);
    setShowRealTimeFeedback(true);
    
    // Call the parent's update function for ATS analysis
    if (onResumeUpdate) {
      onResumeUpdate(resume, targetRole, industry);
    }
  };

  const updateResumeField = (field: string, value: string) => {
    if (!sampleResume) return;

    const [section, subsection] = field.split('.');
    const updatedResume = (() => {
      if (subsection) {
        return {
          ...sampleResume,
          [section]: {
            ...(sampleResume as any)[section],
            [subsection]: value
          }
        };
      } else {
        return {
          ...sampleResume,
          [field]: value
        };
      }
    })();

    setSampleResume(updatedResume);

    // Call the parent's update function for ATS analysis when resume changes
    if (onResumeUpdate) {
      onResumeUpdate(updatedResume, targetRole, industry);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Upload Your CV for Analysis</CardTitle>
          <CardDescription className="text-base">
            Get AI-powered insights to improve your CV. Supported formats: PDF,
            TXT (max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <motion.div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 ${
                dragActive
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:shadow-md"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              animate={{ scale: dragActive ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="text-center">
                <motion.div 
                  className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <UploadCloud className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="mt-6">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-base font-medium text-foreground">
                      {file
                        ? file.name
                        : "Drop your CV here or click to browse"}
                    </span>
                    <Input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                    />
                  </Label>
                  {file && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-muted-foreground"
                    >
                      {formatFileSize(file.size)} • {file.type}
                    </motion.p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    PDF or TXT up to 5MB
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Optional Context Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target-role" className="text-sm font-medium">Target Role (Optional)</Label>
                <Input
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  className="focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Helps provide more targeted feedback
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium">Industry (Optional)</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry" className="focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Industry-specific recommendations
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                <Lightbulb className="h-4 w-4 mr-2" /> Tips for better analysis:
              </h4>
              <ul className="text-sm text-foreground/80 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Use a clean, well-formatted CV without complex layouts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Include specific role and industry for targeted feedback
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Ensure your CV has clear sections (Experience, Skills,
                    Education)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Remove any sensitive personal information before uploading
                  </span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <h5 className="flex items-center gap-2 text-xs font-medium text-yellow-900 mb-2">
                  ATS Optimization Tip:
                </h5>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  For best results with Applicant Tracking Systems, use standard
                  section headings (Work Experience, Skills, Education) and
                  avoid graphics, tables, or columns.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={!file || uploading}
              onClick={handleSubmit}
              className="px-6"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your CV with AI...
                </>
              ) : (
                "Analyze CV"
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>

      {/* Real-time ATS Feedback Section */}
      {(targetRole || industry) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="shadow-sm border-border bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-blue-900">
                    Real-time ATS Feedback
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    See how your target role and industry affect ATS optimization
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowRealTimeFeedback}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {showRealTimeFeedback ? "Hide" : "Show"} Preview
                </Button>
              </div>
            </CardHeader>
            {showRealTimeFeedback && sampleResume && (
              <CardContent className="pt-0">
                <RealTimeAtsFeedback
                  resume={sampleResume}
                  targetRole={targetRole}
                  industry={industry}
                  onFieldChange={updateResumeField}
                  compact={true}
                />
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}

      {/* Upgrade Prompt for CV Analysis Limits */}
      {upgradePromptVisible && limitInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <UpgradePrompt feature="cvAnalysesPerMonth" />
        </motion.div>
      )}
    </motion.div>
  );
}
