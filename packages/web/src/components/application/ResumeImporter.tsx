"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  RefreshCw,
  FileCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import { cvEvaluatorApi } from "@/utils/api/cvEvaluator";
import type { CvAnalysis } from "@/types/api";
import { cn } from "@/lib/utils";
import { themeColors, themeUtils } from "@/styles/theme-colors";
import type { ResumeData } from "@/types/resume";

type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

interface ResumeImporterProps {
  onImport?: (data: ResumeData) => void;
}

interface ResumeAnalysisItem {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  status: AnalysisStatus;
  overallScore?: number;
  atsScore?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingSkills: string[];
  atsCompatibility?: CvAnalysis["atsCompatibility"];
  keywordAnalysis?: CvAnalysis["keywordAnalysis"];
  industryAlignment?: CvAnalysis["industryAlignment"];
  targetRole?: string | null;
  industry?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

const statusLabels: Record<AnalysisStatus, string> = {
  pending: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const statusClasses: Record<AnalysisStatus, string> = {
  pending: themeColors.warning.badge,
  processing: themeColors.processing.badge,
  completed: themeColors.success.badge,
  failed: themeColors.error.badge,
};

const supportedFormats = [
  { extension: ".pdf", description: "PDF Document" },
  { extension: ".docx", description: "Word Document" },
  { extension: ".doc", description: "Legacy Word Document" },
  { extension: ".txt", description: "Plain Text" },
];

function mergeUniqueStrings(
  ...collections: Array<ReadonlyArray<string> | null | undefined>
): string[] {
  const set = new Set<string>();
  for (const collection of collections) {
    if (!collection) continue;
    for (const raw of collection) {
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (value) {
        set.add(value);
      }
    }
  }
  return Array.from(set);
}

function normalizeStatus(status?: string | null): AnalysisStatus {
  switch (status) {
    case "pending":
    case "processing":
    case "completed":
    case "failed":
      return status;
    case "error":
      return "failed";
    default:
      return "pending";
  }
}

function clampToPercentage(value?: number | null): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapAnalysis(record: CvAnalysis): ResumeAnalysisItem {
  const recordAny = record as unknown as Record<string, unknown>;

  const status = normalizeStatus(record.analysisStatus ?? (recordAny.status as string | undefined));
  const atsCandidates = [
    record.atsCompatibility?.score,
    record.overallScore,
    recordAny.score as number | undefined,
  ];
  const primaryScore = atsCandidates.find(
    (value): value is number => typeof value === "number" && !Number.isNaN(value)
  );

  const fallbackFileName = recordAny.filename;
  const resolvedFileName =
    record.fileName || (typeof fallbackFileName === "string" ? fallbackFileName : undefined) || "Imported Resume";

  return {
    id: record._id,
    fileName: resolvedFileName,
    fileSize: record.fileSize,
    fileType: record.fileType,
    status,
    overallScore: clampToPercentage(record.overallScore),
    atsScore: clampToPercentage(primaryScore),
    strengths: mergeUniqueStrings(record.strengths),
    weaknesses: mergeUniqueStrings(record.weaknesses),
    recommendations: mergeUniqueStrings(
      record.recommendations,
      recordAny.suggestions as string[] | undefined
    ),
    missingSkills: mergeUniqueStrings(
      record.missingSkills,
      record.keywordAnalysis?.missingKeywords
    ),
    atsCompatibility: record.atsCompatibility,
    keywordAnalysis: record.keywordAnalysis,
    industryAlignment: record.industryAlignment,
    targetRole: record.targetRole ?? null,
    industry: record.industry ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function ResumeImporter({ onImport }: ResumeImporterProps) {
  const { user, loading } = useFirebaseAuth();
  const userId = user?.uid ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyses, setAnalyses] = useState<ResumeAnalysisItem[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalyses = useCallback(async (): Promise<ResumeAnalysisItem[]> => {
    if (!userId) {
      setAnalyses([]);
      return [];
    }

    try {
      const records = await cvEvaluatorApi.getUserCvAnalyses(userId);
      const mapped = records
        .map(mapAnalysis)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setAnalyses(mapped);
      return mapped;
    } catch (error) {
      console.error("Failed to load resume analyses", error);
      return [];
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setAnalyses([]);
      return;
    }
    fetchAnalyses();
  }, [userId, fetchAnalyses]);

  useEffect(() => {
    if (analyses.length === 0) {
      setSelectedAnalysisId(null);
      return;
    }

    setSelectedAnalysisId((current) => {
      if (current && analyses.some((analysis) => analysis.id === current)) {
        return current;
      }
      return analyses[0].id;
    });
  }, [analyses]);

  useEffect(() => {
    const hasPending = analyses.some(
      (analysis) => analysis.status === "pending" || analysis.status === "processing"
    );

    if (hasPending) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchAnalyses();
        }, 5000);
      }
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [analyses, fetchAnalyses]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const selectedAnalysis = useMemo(() => {
    if (analyses.length === 0) {
      return null;
    }
    if (selectedAnalysisId) {
      const match = analyses.find((analysis) => analysis.id === selectedAnalysisId);
      if (match) {
        return match;
      }
    }
    return analyses[0];
  }, [analyses, selectedAnalysisId]);

  const presentKeywords = useMemo(
    () => selectedAnalysis?.keywordAnalysis?.presentKeywords ?? [],
    [selectedAnalysis]
  );

  const missingKeywords = useMemo(() => {
    const keywordGaps = selectedAnalysis?.keywordAnalysis?.missingKeywords ?? [];
    if (keywordGaps.length > 0) {
      return keywordGaps;
    }
    return selectedAnalysis?.missingSkills ?? [];
  }, [selectedAnalysis]);

  const displayAtsScore =
    clampToPercentage(
      selectedAnalysis?.atsScore ??
        selectedAnalysis?.overallScore ??
        selectedAnalysis?.atsCompatibility?.score
    ) ?? 0;

  const atsIssues = useMemo(
    () => (selectedAnalysis?.atsCompatibility?.issues ?? []).slice(0, 3),
    [selectedAnalysis]
  );

  const hasPendingAnalysis = useMemo(
    () => analyses.some((analysis) => analysis.status === "pending" || analysis.status === "processing"),
    [analyses]
  );

  const formatFileSize = useCallback((bytes?: number) => {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) {
      return "Unknown size";
    }
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const formatTimestamp = useCallback((timestamp?: number) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
    return date.toLocaleString();
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      const extension = `.${(file.name.split(".").pop() ?? "").toLowerCase()}`;

      if (!supportedFormats.some((format) => format.extension === extension)) {
        showError("Unsupported Format", "Please upload a PDF, DOC, DOCX, or TXT file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showError("File Too Large", "Please upload a file smaller than 10MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (!userId || !user) {
        showError("Sign-in Required", "Please sign in to import resumes for analysis.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setIsUploading(true);

      try {
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("targetRole", "");
        formData.append("industry", "");

        const response = await fetch("/api/cv/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          if (result?.upgradeRequired) {
            showError(
              "Upgrade Required",
              result.error || "You've reached the monthly analysis limit for your plan."
            );
          } else {
            showError("Upload Failed", result?.error || "Unable to upload resume. Try again.");
          }
          return;
        }

        showSuccess(
          "Resume Uploaded",
          "Your resume is queued for Gemini-powered analysis. Results will appear shortly."
        );

        const analysisId: string | undefined = result?.analysisId;
        if (analysisId) {
          const placeholder: ResumeAnalysisItem = {
            id: analysisId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            status: "processing",
            strengths: [],
            weaknesses: [],
            recommendations: [],
            missingSkills: [],
            createdAt: Date.now(),
          };

          setAnalyses((previous) => {
            const remaining = previous.filter((item) => item.id !== analysisId);
            return [placeholder, ...remaining];
          });
          setSelectedAnalysisId(analysisId);
        }

        await fetchAnalyses();
      } catch (error) {
        console.error("File upload error:", error);
        showError("Upload Failed", "We could not import your resume. Please try again.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [userId, user, fetchAnalyses]
  );

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      await fetchAnalyses();
    } catch (error) {
      console.error("Failed to refresh analyses", error);
      showError("Refresh Failed", "Unable to refresh resume analyses right now.");
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, fetchAnalyses]);

  const handleDeleteAnalysis = useCallback(
    async (analysisId: string) => {
      try {
        await cvEvaluatorApi.deleteCvAnalysis(analysisId);
        showSuccess("Analysis Removed", "The resume analysis has been deleted.");
        setAnalyses((previous) => previous.filter((analysis) => analysis.id !== analysisId));
        if (selectedAnalysisId === analysisId) {
          setSelectedAnalysisId(null);
        }
      } catch (error) {
        console.error("Failed to delete analysis", error);
        showError("Delete Failed", "Unable to remove this analysis. Please try again.");
      } finally {
        await fetchAnalyses();
      }
    },
    [fetchAnalyses, selectedAnalysisId]
  );

  const saveToResumeBuilder = useCallback(() => {
    if (!selectedAnalysis) {
      showError("No Analysis Selected", "Please select a resume analysis to import.");
      return;
    }

    // Build professional summary from analysis data
    const buildSummary = (): string => {
      const parts: string[] = [];
      
      if (selectedAnalysis.targetRole) {
        parts.push(`${selectedAnalysis.targetRole} professional`);
      } else {
        parts.push('Professional');
      }
      
      if (selectedAnalysis.industry) {
        parts.push(`with expertise in ${selectedAnalysis.industry}`);
      }
      
      if (selectedAnalysis.keywordAnalysis?.presentKeywords?.length) {
        const topSkills = selectedAnalysis.keywordAnalysis.presentKeywords.slice(0, 3);
        parts.push(`skilled in ${topSkills.join(', ')}`);
      }
      
      if (selectedAnalysis.atsScore && selectedAnalysis.atsScore >= 70) {
        parts.push('with a strong track record of delivering results');
      }
      
      return parts.join(' ') + '.';
    };

    // Map analysis data to resume builder format
    const resumeData: ResumeData = {
      personalInfo: {
        fullName: user?.displayName || "",
        email: user?.email || "",
        phone: "",
        location: "",
        summary: buildSummary(),
        linkedin: "",
        github: "",
        website: "",
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: []
    };

    // Build structured skills from analysis
    if (selectedAnalysis.keywordAnalysis?.presentKeywords?.length) {
      const keywords = selectedAnalysis.keywordAnalysis.presentKeywords;
      const technicalSkills: string[] = [];
      const softSkills: string[] = [];
      const otherSkills: string[] = [];
      
      // Categorize skills (basic heuristic)
      const technicalPatterns = /^(javascript|typescript|react|node|python|java|sql|aws|azure|docker|kubernetes|git|api|html|css|database|cloud|devops|ci\/cd|testing|agile)/i;
      const softPatterns = /^(communication|leadership|team|management|problem|analytical|creative|strategic|collaboration|presentation)/i;
      
      keywords.forEach(skill => {
        if (technicalPatterns.test(skill)) {
          technicalSkills.push(skill);
        } else if (softPatterns.test(skill)) {
          softSkills.push(skill);
        } else {
          otherSkills.push(skill);
        }
      });
      
      const skillGroups: { category: string; skills: string[] }[] = [];
      
      if (technicalSkills.length > 0) {
        skillGroups.push({ category: "Technical Skills", skills: technicalSkills.slice(0, 15) });
      }
      if (softSkills.length > 0) {
        skillGroups.push({ category: "Soft Skills", skills: softSkills.slice(0, 10) });
      }
      if (otherSkills.length > 0) {
        skillGroups.push({ category: "Additional Skills", skills: otherSkills.slice(0, 10) });
      }
      
      // Fallback if categorization didn't work
      if (skillGroups.length === 0 && keywords.length > 0) {
        for (let i = 0; i < keywords.length; i += 10) {
          skillGroups.push({
            category: i === 0 ? "Key Skills" : "Additional Skills",
            skills: keywords.slice(i, i + 10)
          });
        }
      }
      
      resumeData.skills = skillGroups;
    }

    // Add missing skills as recommendations in a special category
    if (selectedAnalysis.missingSkills?.length) {
      resumeData.skills.push({
        category: "Skills to Develop (From Analysis)",
        skills: selectedAnalysis.missingSkills.slice(0, 10)
      });
    }

    // Always save to local storage for persistence
    try {
      localStorage.setItem('hireall_resume_data', JSON.stringify(resumeData));
      localStorage.setItem('hireall_resume_import_timestamp', new Date().toISOString());
    } catch (storageError) {
      console.warn('Failed to save resume data to localStorage:', storageError);
    }

    // If onImport callback is provided, use it (for direct integration)
    if (onImport) {
      onImport(resumeData);
      showSuccess("Imported to Builder", "Analysis data has been applied to the resume builder.");
    } else {
      // Fallback: Show success with instructions to navigate to resume builder
      showSuccess(
        "Resume Data Saved", 
        "Your analysis has been saved. Go to the Resume Builder tab to see your imported data."
      );
    }
  }, [selectedAnalysis, onImport, user]);

  return (
    <div className="space-y-6">
      {hasPendingAnalysis && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-sm">
            We are analyzing your latest resume. Results will update automatically.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>Supported formats: PDF, DOC, DOCX, TXT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                <UploadCloud className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !userId}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Supported Formats:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {supportedFormats.map((format) => (
                    <div key={format.extension} className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>{format.extension}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {userId
                    ? "Maximum file size: 10MB. Your data is processed securely."
                    : loading
                    ? "Checking your session..."
                    : "Sign in to upload resumes for AI-powered analysis."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyses</CardTitle>
              <CardDescription>Recent resume imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No resume analyses yet. Upload a file to get started.
                </p>
              ) : (
                analyses.map((analysis) => {
                  const listScore = clampToPercentage(
                    analysis.atsScore ?? analysis.overallScore
                  );

                  return (
                    <Button
                      key={analysis.id}
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedAnalysisId(analysis.id)}
                      className={cn(
                        "w-full justify-start rounded-lg border p-3 transition",
                        selectedAnalysis?.id === analysis.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-border hover:border-border/80"
                      )}
                      asChild
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedAnalysisId(analysis.id);
                          }
                        }}
                        className="flex w-full items-start justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="truncate text-sm font-medium">
                              {analysis.fileName}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              className={`text-xs border ${statusClasses[analysis.status]}`}
                            >
                              {statusLabels[analysis.status]}
                            </Badge>
                            {typeof listScore === "number" && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  listScore >= 80 ? "bg-primary/10 text-primary border-primary/30" :
                                  listScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  listScore >= 40 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                )}
                              >
                                ATS: {listScore}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {formatFileSize(analysis.fileSize)} • {formatTimestamp(analysis.createdAt)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteAnalysis(analysis.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {selectedAnalysis.fileName}
                    </CardTitle>
                    <CardDescription className="space-x-1">
                      <span>Uploaded {formatTimestamp(selectedAnalysis.createdAt)}</span>
                      {selectedAnalysis.targetRole && (
                        <span>• Target role: {selectedAnalysis.targetRole}</span>
                      )}
                      {selectedAnalysis.industry && (
                        <span>• Industry: {selectedAnalysis.industry}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`text-xs border ${statusClasses[selectedAnalysis.status]}`}
                    >
                      {statusLabels[selectedAnalysis.status]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing || !userId}
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={saveToResumeBuilder}>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Edit in Builder
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAnalysis.status === "failed" && (
                  <Alert className={cn(themeColors.error.border, themeColors.error.bg, themeColors.error.text)}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Analysis failed. Please retry with a different file format or contact support.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        displayAtsScore >= 80 ? "bg-primary/20" :
                        displayAtsScore >= 60 ? "bg-amber-100" :
                        displayAtsScore >= 40 ? "bg-orange-100" :
                        "bg-red-100"
                      )}>
                        <Zap className={cn(
                          "h-4 w-4",
                          displayAtsScore >= 80 ? "text-primary" :
                          displayAtsScore >= 60 ? "text-amber-600" :
                          displayAtsScore >= 40 ? "text-orange-600" :
                          "text-red-600"
                        )} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        ATS Score
                      </span>
                    </div>
                    <span className={cn(
                      "text-lg font-bold px-2.5 py-0.5 rounded-full",
                      displayAtsScore >= 80 ? "bg-primary/20 text-primary" :
                      displayAtsScore >= 60 ? "bg-amber-100 text-amber-700" :
                      displayAtsScore >= 40 ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {displayAtsScore}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        displayAtsScore >= 80 ? "bg-primary" :
                        displayAtsScore >= 60 ? "bg-amber-400" :
                        displayAtsScore >= 40 ? "bg-orange-400" :
                        "bg-red-400"
                      )}
                      style={{ width: `${displayAtsScore}%` }}
                    />
                  </div>
                  {atsIssues.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Top issues:</span>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {atsIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {selectedAnalysis.strengths.length > 0 && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className={cn("h-4 w-4", themeColors.success.icon)} />
                        Strengths
                      </h4>
                      <ul className="list-disc space-y-2 pl-4 text-sm text-gray-700">
                        {selectedAnalysis.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedAnalysis.weaknesses.length > 0 && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className={cn("h-4 w-4", themeColors.warning.icon)} />
                        Improvements
                      </h4>
                      <ul className="list-disc space-y-2 pl-4 text-sm text-gray-700">
                        {selectedAnalysis.weaknesses.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {selectedAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Zap className={cn("h-4 w-4", themeColors.info.icon)} />
                      Recommended Next Steps
                    </h4>
                    <ul className="list-disc space-y-2 pl-4 text-sm text-gray-700">
                      {selectedAnalysis.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {missingKeywords.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-800">
                      High-Impact Keywords to Add
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {missingKeywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {presentKeywords.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-800">Detected Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {presentKeywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          className={cn("text-xs", themeColors.success.badge)}
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.industryAlignment?.feedback && (
                  <div className={cn("rounded-lg border p-4 text-sm", themeColors.info.bg, themeColors.info.border, themeColors.info.text)}>
                    {selectedAnalysis.industryAlignment.feedback}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-4 py-12 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No Resume Imported</h3>
                  <p className="text-sm text-gray-500">
                    Upload a resume to receive Gemini-powered ATS insights and recommendations.
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !userId}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
