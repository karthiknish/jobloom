// components/dashboard/JobImportModal.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, Job } from "@/utils/api/dashboard";
import {
  importJobsFromCSV,
  importJobsFromAPI,
  downloadSampleCSV,
} from "@/utils/jobImport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { showError, showSuccess, showWarning, showInfo } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Chrome, 
  Upload, 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  Briefcase,
  Clock,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { extensionAuthBridge } from "@/lib/extensionAuthBridge";
import Link from "next/link";
import { CHROME_EXTENSION_URL, isExternalUrl } from "@/config/links";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { getSalaryDisplay } from "@/utils/dashboard";

interface JobImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  userRecord?: any;
}

interface ExtensionJob {
  id?: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  source?: string;
  dateFound?: number;
  isSponsored?: boolean;
  sponsorshipType?: string;
}

export function JobImportModal({
  isOpen,
  onClose,
  onImportComplete,
  userRecord: userRecordProp,
}: JobImportModalProps) {
  const { user } = useFirebaseAuth();
  const [importMethod, setImportMethod] = useState<"extension" | "csv" | "api" | "url">("extension");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [apiSource, setApiSource] = useState<
    "indeed" | "glassdoor" | "custom"
  >("indeed");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // URL Import state
  const [jobUrl, setJobUrl] = useState("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parsedJob, setParsedJob] = useState<Partial<Job> | null>(null);
  
  // Extension-specific state
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [extensionJobs, setExtensionJobs] = useState<ExtensionJob[]>([]);
  const [isLoadingExtensionJobs, setIsLoadingExtensionJobs] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const extensionJobIds = useMemo(
    () => extensionJobs.map((j, i) => j.id || `job-${i}`),
    [extensionJobs]
  );
  const extensionSelection = useBulkSelection(extensionJobIds);

  // Fetch user record using TanStack Query (only if not provided as prop)
  const { 
    data: fetchedUserRecord, 
    error: userRecordError,
    refetch: refetchUserRecord,
    isLoading: isUserRecordLoading
  } = useQuery({
    queryKey: ["dashboard", "user", user?.uid],
    queryFn: () => dashboardApi.getUserByFirebaseUid(user!.uid),
    enabled: !!user?.uid && !userRecordProp,
    staleTime: 60 * 1000,
  });

  const userRecord = userRecordProp || fetchedUserRecord;

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      try {
        if (typeof window !== 'undefined') {
          // Check for extension-specific global variable
          if ((window as any).__hireall_extension) {
            setIsExtensionInstalled(true);
            return;
          }
          // Check if extension auth bridge is available
          if (extensionAuthBridge.isExtensionAvailable()) {
            setIsExtensionInstalled(true);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking extension status:', error);
      }
    };
    
    checkExtension();
    // Re-check periodically
    const interval = setInterval(checkExtension, 3000);
    return () => clearInterval(interval);
  }, []);

  useRestoreFocus(isOpen);

  // Fetch jobs from extension storage
  const fetchExtensionJobs = useCallback(async () => {
    if (!isExtensionInstalled || !userRecord) return;
    
    setIsLoadingExtensionJobs(true);
    try {
      // Request jobs from extension via postMessage
      window.postMessage({
        type: 'HIREALL_GET_SAVED_JOBS',
        userId: userRecord._id,
        timestamp: Date.now()
      }, '*');

      // Listen for response
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'HIREALL_SAVED_JOBS_RESPONSE') {
          const jobs = event.data.jobs || [];
          setExtensionJobs(jobs);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Timeout fallback
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setIsLoadingExtensionJobs(false);
      }, 5000);
    } catch (error) {
      console.error('Error fetching extension jobs:', error);
      showError("Failed to load jobs", "Unable to fetch saved jobs from extension.");
    } finally {
      setIsLoadingExtensionJobs(false);
    }
  }, [isExtensionInstalled, userRecord]);

  // Auto-select all whenever the extension job list changes
  useEffect(() => {
    if (!isOpen || importMethod !== "extension") return;
    if (extensionJobs.length === 0) {
      extensionSelection.clearSelection();
      return;
    }
    extensionSelection.selectAll();
  }, [extensionJobs, extensionSelection, importMethod, isOpen]);

  // Load extension jobs when modal opens and extension method is selected
  useEffect(() => {
    if (isOpen && importMethod === 'extension' && isExtensionInstalled) {
      fetchExtensionJobs();
    }
  }, [isOpen, importMethod, isExtensionInstalled, fetchExtensionJobs]);

  // Handle extension job import
  const handleExtensionImport = async () => {
    if (!userRecord || extensionSelection.selectedCount === 0) {
      showWarning("No jobs selected", "Select at least one job to import.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const jobsToImport = extensionJobs.filter((job, index) => 
        extensionSelection.selectedIds.has(job.id || `job-${index}`)
      );

      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < jobsToImport.length; i++) {
        const job = jobsToImport[i];
        try {
          await dashboardApi.createJob({
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.description,
            salary: job.salary,
            source: job.source || 'extension',
            dateFound: job.dateFound || Date.now(),
            isSponsored: job.isSponsored || false,
            sponsorshipType: job.sponsorshipType,
          });
          imported++;
        } catch (error: any) {
          if (error?.message?.includes('duplicate') || error?.message?.includes('exists')) {
            skipped++;
          } else {
            console.error('Error importing job:', error);
          }
        }
        setImportProgress(Math.round(((i + 1) / jobsToImport.length) * 100));
      }

      showSuccess(
        "Jobs imported",
        skipped > 0
          ? `${imported} imported, ${skipped} duplicates skipped.`
          : `${imported} jobs added to your dashboard.`
      );
      
      // Notify extension to clear imported jobs
      window.postMessage({
        type: 'HIREALL_JOBS_IMPORTED',
        jobIds: extensionSelection.selectedArray,
        timestamp: Date.now()
      }, '*');

      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Error importing from extension:', error);
      showError("Import failed", "Unable to import jobs. Please try again.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Toggle job selection
  const toggleJobSelection = (jobId: string) => {
    extensionSelection.toggleSelection(jobId);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    extensionSelection.toggleSelectAll();
  };

  const handleCsvImport = async () => {
    if (!userRecord || !csvFile) {
      showWarning(
        "CSV file required",
        "Choose a CSV containing your job listings to import them into your dashboard."
      );
      return;
    }

    setIsImporting(true);

    try {
      // Read CSV file
      const csvText = await csvFile.text();

      // Import jobs
      const result = await importJobsFromCSV(userRecord._id, csvText);

      showSuccess(
        "Jobs imported",
        result.skippedCount > 0
          ? `${result.importedCount} imported, ${result.skippedCount} duplicates skipped.`
          : `${result.importedCount} jobs added to your dashboard.`
      );
      onImportComplete();
      onClose();
    } catch (error: unknown) {
      console.error("Error importing CSV:", error);
      if (error instanceof Error) {
        showError(
          "Unable to import jobs from CSV",
          `${error.message || "Something went wrong."} Check the file format and try again.`
        );
      } else {
        showError(
          "Unable to import jobs from CSV",
          "Check the file format and try again."
        );
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleApiImport = async () => {
    if (!userRecord) {
      showError(
        "Session expired",
        "Sign in again to continue importing jobs."
      );
      return;
    }

    if (apiSource === "custom") {
      showWarning(
        "Select a job board",
        "Choose Indeed or Glassdoor before importing."
      );
      return;
    }

    setIsImporting(true);

    try {
      // Import jobs from API
      const result = await importJobsFromAPI(
        userRecord._id,
        apiSource,
        searchQuery,
        location
      );

      showSuccess(
        `Imported from ${result.source}`,
        result.skippedCount > 0
          ? `${result.importedCount} jobs added, ${result.skippedCount} duplicates skipped.`
          : `${result.importedCount} jobs now available in your dashboard.`
      );
      onImportComplete();
      onClose();
    } catch (error: unknown) {
      console.error("Error importing from API:", error);
      if (error instanceof Error) {
        showError(
          "Unable to import jobs from API",
          `${error.message || "Something went wrong."} Check search terms and try again.`
        );
      } else {
        showError(
          "Unable to import jobs from API",
          "Check search terms and try again."
        );
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        showWarning(
          "Invalid file type",
          "Select a .csv file to continue."
        );
        return;
      }
      setCsvFile(file);
    }
  };

  const handleUrlParse = async () => {
    if (!jobUrl) return;
    
    setIsParsingUrl(true);
    try {
      const job = await dashboardApi.parseJobFromUrl(jobUrl);
      setParsedJob(job);
      showSuccess("Job parsed", "We've extracted the details from the page.");
    } catch (error: any) {
      console.error("Error parsing URL:", error);
      showError("Parsing failed", error.message || "Unable to extract job details from this URL.");
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleSaveParsedJob = async () => {
    if (!parsedJob || !userRecord) return;

    setIsImporting(true);
    try {
      await dashboardApi.createJob({
        ...parsedJob,
        userId: userRecord._id,
        source: parsedJob.source || 'url_import',
        dateFound: Date.now(),
      });
      
      showSuccess("Job saved", "The job has been added to your board.");
      onImportComplete();
      onClose();
      setParsedJob(null);
      setJobUrl("");
    } catch (error: any) {
      console.error("Error saving job:", error);
      showError("Save failed", error.message || "Unable to save the job.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-border/50">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Download className="h-5 w-5 text-white" />
            </div>
            Import Jobs to Dashboard
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Add jobs from your browser extension or CSV file. 
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-emerald-600 hover:underline inline-flex items-center gap-1">
                  How it works <Sparkles className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Use our Chrome extension to save jobs directly from Job Boards, or upload a spreadsheet of your existing applications.</p>
              </TooltipContent>
            </Tooltip>
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Import Method Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Select Import Method
              </Label>
              <Badge variant="outline" className="text-xxs font-bold text-emerald-600 bg-emerald-50 border-emerald-200 uppercase tracking-tighter">
                Most Popular: Extension
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Extension Import */}
              <button
                type="button"
                onClick={() => setImportMethod("extension")}
                aria-label="Import jobs from browser extension"
                aria-pressed={importMethod === "extension"}
                className={cn(
                  "relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group overflow-hidden",
                  importMethod === "extension"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5"
                    : "border-border hover:border-emerald-400/50 hover:bg-emerald-50/30 hover:shadow-md"
                )}
              >
                {/* Recommended Ribbon */}
                <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none">
                  <div className="absolute top-2 -right-4 bg-emerald-500 text-white text-[8px] font-black uppercase py-1 px-5 rotate-45 shadow-sm">
                    BEST
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={cn(
                    "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    importMethod === "extension" ? "bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg" : "bg-muted text-muted-foreground"
                  )}>
                    <Chrome className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className={cn(
                      "block font-bold text-sm",
                      importMethod === "extension" ? "text-emerald-900" : "text-foreground"
                    )}>Extension</span>
                    <p className="text-xxs text-muted-foreground leading-tight font-medium">Auto-sync from job sites as you browse</p>
                  </div>
                </div>
                {isExtensionInstalled && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-green-700 uppercase">Live Detection</span>
                  </div>
                )}
              </button>

              {/* CSV Import */}
              <button
                type="button"
                onClick={() => setImportMethod("csv")}
                aria-label="Import jobs from CSV file"
                aria-pressed={importMethod === "csv"}
                className={cn(
                  "relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group",
                  importMethod === "csv"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5"
                    : "border-border hover:border-emerald-400/50 hover:bg-emerald-50/30 hover:shadow-md"
                )}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={cn(
                    "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    importMethod === "csv" ? "bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg" : "bg-muted text-muted-foreground"
                  )}>
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className={cn(
                      "block font-bold text-sm",
                      importMethod === "csv" ? "text-emerald-900" : "text-foreground"
                    )}>CSV Upload</span>
                    <p className="text-xxs text-muted-foreground leading-tight font-medium">Bulk import your existing database</p>
                  </div>
                </div>
              </button>

              {/* URL Import */}
              <button
                type="button"
                onClick={() => setImportMethod("url")}
                aria-label="Import job from URL"
                aria-pressed={importMethod === "url"}
                className={cn(
                  "relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group",
                  importMethod === "url"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5"
                    : "border-border hover:border-emerald-400/50 hover:bg-emerald-50/30 hover:shadow-md"
                )}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={cn(
                    "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    importMethod === "url" ? "bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg" : "bg-muted text-muted-foreground"
                  )}>
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className={cn(
                      "block font-bold text-sm",
                      importMethod === "url" ? "text-emerald-900" : "text-foreground"
                    )}>Job Link</span>
                    <p className="text-xxs text-muted-foreground leading-tight font-medium">Extract details from any job listing</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {userRecordError && !userRecord && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-red-900 mb-1">Failed to Load User Data</h3>
              <p className="text-xs text-red-700 mb-4">
                We couldn't retrieve your account information. This is required to import jobs.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchUserRecord()}
                className="border-red-200 hover:bg-red-100 text-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </div>
          )}

          {/* Import Method Selection */}
          <AnimatePresence mode="wait">
            {importMethod === "extension" && (
              <motion.div
                key="extension"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {!isExtensionInstalled ? (
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <Chrome className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900 mb-2">
                          Install the Hireall Extension
                        </h3>
                        <p className="text-sm text-emerald-700 mb-4">
                          Save jobs from LinkedIn, Indeed, Glassdoor, and more with one click. 
                          Jobs are automatically synced to your dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                            asChild
                          >
                            {isExternalUrl(CHROME_EXTENSION_URL) ? (
                              <a
                                href={CHROME_EXTENSION_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Chrome className="h-4 w-4 mr-2" />
                                Install Chrome Extension
                              </a>
                            ) : (
                              <Link href={CHROME_EXTENSION_URL}>
                                <Chrome className="h-4 w-4 mr-2" />
                                Install Chrome Extension
                              </Link>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setImportMethod("csv")}>
                            Use CSV Instead
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Extension Jobs List */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-700">
                          Extension Connected
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchExtensionJobs}
                        disabled={isLoadingExtensionJobs}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingExtensionJobs ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    {isLoadingExtensionJobs ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                          <p className="text-sm text-muted-foreground">Loading saved jobs...</p>
                        </div>
                      </div>
                    ) : extensionJobs.length === 0 ? (
                      <div className="text-center py-12 rounded-xl bg-muted/30 border border-dashed border-border">
                        <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                        <h4 className="font-medium text-foreground mb-1">No saved jobs found</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Use the extension&apos;s &quot;Add to Board&quot; button on job listings to save them here.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="text-sm"
                          >
                            {extensionSelection.isAllSelected
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                          <Badge variant="secondary" className="font-medium">
                            {extensionSelection.selectedCount} of {extensionJobs.length} selected
                          </Badge>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                          {extensionJobs.map((job, index) => {
                            const jobId = job.id || `job-${index}`;
                            const isSelected = extensionSelection.selectedIds.has(jobId);
                            return (
                              <motion.div
                                key={jobId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => toggleJobSelection(jobId)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-50"
                                    : "border-border hover:border-emerald-200 hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500"
                                      : "border-muted-foreground/30"
                                  }`}>
                                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{job.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {job.company} • {job.location} {job.salary && `• ${getSalaryDisplay(job.salary)}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {job.source && (
                                        <Badge variant="outline" className="text-xxs px-1.5 py-0">
                                          {job.source}
                                        </Badge>
                                      )}
                                      {job.isSponsored && (
                                        <Badge className="text-xxs px-1.5 py-0 bg-green-500 hover:bg-green-500">
                                          Sponsored
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Import Progress */}
                    {isImporting && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Importing jobs...</span>
                          <span className="font-medium">{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={onClose} disabled={isImporting}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleExtensionImport}
                        disabled={isImporting || extensionSelection.selectedCount === 0}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Import {extensionSelection.selectedCount} Job{extensionSelection.selectedCount !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* CSV Import */}
            {importMethod === "csv" && (
              <motion.div
                key="csv"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Upload CSV File
                  </Label>
                  <div className={`mt-1 flex justify-center px-6 pt-6 pb-6 border-2 border-dashed rounded-xl transition-colors ${
                    csvFile ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:border-emerald-300"
                  }`}>
                    <div className="space-y-2 text-center">
                      <div className={`mx-auto p-3 rounded-xl ${csvFile ? "bg-emerald-100" : "bg-muted"}`}>
                        {csvFile ? (
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex text-sm justify-center">
                        <Label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                          <span>{csvFile ? "Change file" : "Upload a file"}</span>
                          <Input
                            type="file"
                            className="sr-only"
                            accept=".csv,text/csv"
                            onChange={handleFileChange}
                          />
                        </Label>
                        {!csvFile && <p className="pl-1 text-muted-foreground">or drag and drop</p>}
                      </div>
                      <p className="text-xs text-muted-foreground">CSV files only, max 5MB</p>
                      {csvFile && (
                        <p className="text-sm font-medium text-emerald-700">{csvFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-900">
                        Need a template?
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Download our sample CSV to get started
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-2">
                      <Download className="h-4 w-4" />
                      Template
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose} disabled={isImporting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCsvImport}
                    disabled={isImporting || !csvFile}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white gap-2"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import CSV
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* URL Import */}
            {importMethod === "url" && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {!parsedJob ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="job-url" className="text-sm font-bold text-foreground">Paste Job Listing URL</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="job-url"
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            placeholder="https://linkedin.com/jobs/view/..."
                            className="pl-10 h-11 rounded-xl border-2 focus-visible:ring-emerald-500/20"
                          />
                        </div>
                        <Button 
                          onClick={handleUrlParse} 
                          disabled={!jobUrl || isParsingUrl}
                          className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/20"
                        >
                          {isParsingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Parse
                        </Button>
                      </div>
                      <p className="text-xxs text-muted-foreground italic px-1">
                        We&apos;ll use AI to extract title, company, and salary directly from the link.
                      </p>
                    </div>
                    <div className="py-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border group hover:border-emerald-300 transition-colors">
                      <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-xs text-muted-foreground font-medium max-w-[240px] mx-auto leading-relaxed">
                        Supports LinkedIn, Indeed, Glassdoor, and 50+ other job platforms.
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-sm text-emerald-900 uppercase tracking-tight">Parsed Successfully</h4>
                      </div>
                      <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 text-xxs font-bold">
                        AI Result
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Job Title</p>
                        <p className="text-sm font-bold text-foreground truncate bg-white/50 p-2 rounded-lg border border-emerald-100/50">{parsedJob.title || "Not found"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Company</p>
                        <p className="text-sm font-bold text-foreground truncate bg-white/50 p-2 rounded-lg border border-emerald-100/50">{parsedJob.company || "Not found"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Location</p>
                        <p className="text-sm font-bold text-foreground truncate bg-white/50 p-2 rounded-lg border border-emerald-100/50">{parsedJob.location || "Remote"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Salary</p>
                        <p className="text-sm font-bold text-emerald-700 truncate bg-white/50 p-2 rounded-lg border border-emerald-100/50">{getSalaryDisplay(parsedJob.salary) || "Competitive"}</p>
                      </div>
                    </div>

                    {parsedJob.description && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Description Extract</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-white/50 p-2 rounded-lg border border-emerald-100/50 leading-relaxed italic">
                          &quot;{parsedJob.description}&quot;
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-emerald-100 flex justify-end gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setParsedJob(null)}
                        className="text-xs font-bold hover:bg-emerald-100/50 hover:text-emerald-700"
                      >
                        Try Different URL
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveParsedJob}
                        disabled={isImporting}
                        className="px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-lg shadow-emerald-600/10"
                      >
                        {isImporting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Confirm & Save Job
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}