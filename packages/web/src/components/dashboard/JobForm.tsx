"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  Building2, 
  MapPin, 
  Link2, 
  DollarSign,
  FileText,
  Save
} from "lucide-react";

interface JobFormData {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary: string;
  isSponsored: boolean;
  isRecruitmentAgency: boolean;
  source: string;
  jobType: string;
  experienceLevel: string;
}

interface JobFormProps {
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel: () => void;
  /** Optional initial data for editing */
  initialData?: Partial<JobFormData>;
  /** Whether this is an edit form */
  isEditing?: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

const DRAFT_STORAGE_KEY = "hireall_job_draft";

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead / Manager" },
  { value: "executive", label: "Executive" },
];

const SOURCES = [
  { value: "manual", label: "Manual Entry" },
  { value: "extension", label: "Chrome Extension" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "other", label: "Other" },
];

export function JobForm({ onSubmit, onCancel, initialData, isEditing = false }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || "",
    company: initialData?.company || "",
    location: initialData?.location || "",
    url: initialData?.url || "",
    description: initialData?.description || "",
    salary: initialData?.salary || "",
    isSponsored: initialData?.isSponsored || false,
    isRecruitmentAgency: initialData?.isRecruitmentAgency || false,
    source: initialData?.source || "manual",
    jobType: initialData?.jobType || "",
    experienceLevel: initialData?.experienceLevel || "",
  });

  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [hasDraft, setHasDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isEditing) return; // Don't load draft when editing
    
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Only restore if there's meaningful content
        if (draft.title || draft.company || draft.description) {
          setFormData(prev => ({ ...prev, ...draft }));
          setHasDraft(true);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
  }, [isEditing]);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    if (isEditing) return;
    
    try {
      setIsSavingDraft(true);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      setHasDraft(true);
      setTimeout(() => setIsSavingDraft(false), 500);
    } catch (e) {
      console.warn("Failed to save draft:", e);
      setIsSavingDraft(false);
    }
  }, [formData, isEditing]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (isEditing) return;
    
    const timer = setInterval(saveDraft, 30000);
    return () => clearInterval(timer);
  }, [saveDraft, isEditing]);

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FieldError[] = [];

    // Required fields
    if (!formData.title.trim()) {
      newErrors.push({ field: "title", message: "Job title is required" });
    }
    if (!formData.company.trim()) {
      newErrors.push({ field: "company", message: "Company name is required" });
    }

    // URL validation (optional but must be valid if provided)
    if (formData.url.trim()) {
      try {
        new URL(formData.url);
      } catch {
        newErrors.push({ field: "url", message: "Please enter a valid URL" });
      }
    }

    // Title length
    if (formData.title.length > 200) {
      newErrors.push({ field: "title", message: "Title must be less than 200 characters" });
    }

    // Company length
    if (formData.company.length > 200) {
      newErrors.push({ field: "company", message: "Company must be less than 200 characters" });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.field !== name));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean | "indeterminate") => {
    setFormData(prev => ({
      ...prev,
      [name]: checked === true
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      await onSubmit(formData);
      setSubmitStatus("success");
      clearDraft();
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: "",
          company: "",
          location: "",
          url: "",
          description: "",
          salary: "",
          isSponsored: false,
          isRecruitmentAgency: false,
          source: "manual",
          jobType: "",
          experienceLevel: "",
        });
        setSubmitStatus("idle");
      }, 1500);

    } catch (error) {
      console.error("Failed to submit job:", error);
      setSubmitStatus("error");
      setErrors([{ field: "_form", message: error instanceof Error ? error.message : "Failed to add job. Please try again." }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formError = errors.find(e => e.field === "_form")?.message;

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{isEditing ? "Edit Job" : "Add New Job"}</CardTitle>
              <CardDescription>
                {isEditing ? "Update job details" : "Track a new job opportunity in your dashboard"}
              </CardDescription>
            </div>
          </div>
          
          {/* Draft indicator */}
          {hasDraft && !isEditing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSavingDraft ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  <span>Draft saved</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Form Error Alert */}
        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{formError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {submitStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Job added successfully!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Essential Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Software Engineer"
                className={getFieldError("title") ? "border-red-500" : ""}
              />
              {getFieldError("title") && (
                <p className="text-xs text-red-500">{getFieldError("title")}</p>
              )}
            </div>
            
            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g., Google"
                className={getFieldError("company") ? "border-red-500" : ""}
              />
              {getFieldError("company") && (
                <p className="text-xs text-red-500">{getFieldError("company")}</p>
              )}
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>
            
            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Salary
              </Label>
              <Input
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g., £120,000 - £150,000"
              />
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Job URL
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://company.com/jobs/123"
              className={getFieldError("url") ? "border-red-500" : ""}
            />
            {getFieldError("url") && (
              <p className="text-xs text-red-500">{getFieldError("url")}</p>
            )}
          </div>

          {/* Job Type & Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={formData.jobType} onValueChange={(v) => handleSelectChange("jobType", v)}>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select value={formData.experienceLevel} onValueChange={(v) => handleSelectChange("experienceLevel", v)}>
                <SelectTrigger id="experienceLevel">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Paste the job description here..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/5000 characters
            </p>
          </div>
          
          {/* Tags & Source Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSponsored"
                  checked={formData.isSponsored}
                  onCheckedChange={(checked) => handleCheckboxChange("isSponsored", checked === true)}
                />
                <Label htmlFor="isSponsored" className="text-sm font-normal cursor-pointer">
                  Visa Sponsorship
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecruitmentAgency"
                  checked={formData.isRecruitmentAgency}
                  onCheckedChange={(checked) => handleCheckboxChange("isRecruitmentAgency", checked === true)}
                />
                <Label htmlFor="isRecruitmentAgency" className="text-sm font-normal cursor-pointer">
                  Recruitment Agency
                </Label>
              </div>
            </div>
            
            {/* Source */}
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(v) => handleSelectChange("source", v)}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map(source => (
                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          {hasDraft && !isEditing && (
            <Button variant="ghost" size="sm" onClick={clearDraft} disabled={isSubmitting}>
              Clear Draft
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                {isEditing ? "Save Changes" : "Add Job"}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}