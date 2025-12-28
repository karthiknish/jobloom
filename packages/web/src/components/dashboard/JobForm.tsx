"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readAndMigrateJsonFromStorage,
  writeJsonToStorage,
} from "@/constants/storageKeys";

import { Job } from "@/types/dashboard";

const jobSchema = z.object({
  title: z.string().min(1, "Job title is required").max(200, "Title must be less than 200 characters"),
  company: z.string().min(1, "Company name is required").max(200, "Company must be less than 200 characters"),
  location: z.string().default(""),
  url: z.string().url("Please enter a valid URL").or(z.literal("")).default(""),
  description: z.string().max(5000, "Description must be less than 5000 characters").default(""),
  salary: z.string().default(""),
  isSponsored: z.boolean().default(false),
  isRecruitmentAgency: z.boolean().default(false),
  source: z.string().default("manual"),
  jobType: z.string().default(""),
  experienceLevel: z.string().default(""),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  onSubmit: (data: Job) => Promise<void>;
  onCancel: () => void;
  /** Optional initial data for editing */
  initialData?: Partial<Job>;
  /** Whether this is an edit form */
  isEditing?: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [hasDraft, setHasDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
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
    },
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isEditing) return;
    
    try {
      const draft = readAndMigrateJsonFromStorage<Partial<Job>>(
        STORAGE_KEYS.jobDraft,
        LEGACY_STORAGE_KEYS.jobDraft
      );
      if (draft) {
        if (draft.title || draft.company || draft.description) {
          form.reset({
            ...form.getValues(),
            ...draft,
          });
          setHasDraft(true);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
  }, [isEditing, form]);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    if (isEditing) return;
    
    try {
      setIsSavingDraft(true);
      const values = form.getValues();
      writeJsonToStorage(STORAGE_KEYS.jobDraft, values, LEGACY_STORAGE_KEYS.jobDraft);
      setHasDraft(true);
      setTimeout(() => setIsSavingDraft(false), 500);
    } catch (e) {
      console.warn("Failed to save draft:", e);
      setIsSavingDraft(false);
    }
  }, [form, isEditing]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (isEditing) return;
    
    const timer = setInterval(saveDraft, 30000);
    return () => clearInterval(timer);
  }, [saveDraft, isEditing]);

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.jobDraft);
      for (const legacyKey of LEGACY_STORAGE_KEYS.jobDraft) {
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // ignore
    }
    setHasDraft(false);
  };

  const onFormSubmit = async (values: JobFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setFormError(null);

    try {
      const payload: Job = {
        ...(initialData as Job),
        ...values,
        _id: initialData?._id || "",
        userId: initialData?.userId || "",
        dateFound: initialData?.dateFound || Date.now(),
      };

      await onSubmit(payload);
      setSubmitStatus("success");
      clearDraft();
      
      // Reset form after success
      setTimeout(() => {
        if (!isEditing) {
          form.reset();
        }
        setSubmitStatus("idle");
      }, 1500);

    } catch (error) {
      console.error("Failed to submit job:", error);
      setSubmitStatus("error");
      setFormError(error instanceof Error ? error.message : "Failed to add job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = useMemo(
    () =>
      isEditing
        ? [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Job Details" },
            { label: "Edit Job" },
          ]
        : [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Add Job" },
          ],
    [isEditing]
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Breadcrumbs className="mb-4" items={breadcrumbItems} showHome={false} />
      <Card className="border-2 shadow-lg">
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success-soft text-success border border-success/20">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Job added successfully!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Job Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Software Engineer" 
                        className="input-premium"
                        autoComplete="organization-title"
                        inputMode="text"
                        enterKeyHint="next"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Company <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Google" 
                        className="input-premium"
                        autoComplete="organization"
                        inputMode="text"
                        enterKeyHint="next"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., San Francisco, CA or Remote" 
                        className="input-premium"
                        autoComplete="country-name"
                        inputMode="text"
                        enterKeyHint="next"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Salary
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., £120,000 - £150,000" 
                        className="input-premium"
                        inputMode="text"
                        enterKeyHint="next"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    Job URL
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="url" 
                      placeholder="https://company.com/jobs/123" 
                      className="input-premium"
                      autoComplete="url"
                      inputMode="url"
                      enterKeyHint="next"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPERIENCE_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Paste the job description here..."
                      className="resize-none input-premium"
                    />
                  </FormControl>
                  <FormDescription className="text-right">
                    {(field.value || "").length}/5000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="isSponsored"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Visa Sponsorship
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isRecruitmentAgency"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Recruitment Agency
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-premium">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCES.map(source => (
                            <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
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
            onClick={form.handleSubmit(onFormSubmit)} 
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
    </div>
  );
}