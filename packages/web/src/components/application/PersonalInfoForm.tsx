"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ResumeData } from "./types";
import { cn } from "@/lib/utils";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is too short"),
  location: z.string().min(2, "Location is required"),
  linkedin: z.string().optional().or(z.literal("")),
  github: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  summary: z.string().min(50, "Summary should be at least 50 characters").max(500, "Summary must be less than 500 characters"),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  data: ResumeData['personalInfo'];
  onChange: (data: ResumeData['personalInfo']) => void;
}

export function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
    mode: "onChange",
  });

  const { control, reset } = form;
  const values = useWatch({ control });

  const normalize = useCallback(
    (value: Partial<PersonalInfoValues> | undefined): ResumeData["personalInfo"] => ({
      fullName: value?.fullName || "",
      email: value?.email || "",
      phone: value?.phone || "",
      location: value?.location || "",
      linkedin: value?.linkedin || "",
      github: value?.github || "",
      website: value?.website || "",
      summary: value?.summary || "",
    }),
    []
  );

  const isSamePersonalInfo = useCallback(
    (a: ResumeData["personalInfo"], b: ResumeData["personalInfo"]) =>
      a.fullName === b.fullName &&
      a.email === b.email &&
      a.phone === b.phone &&
      a.location === b.location &&
      a.linkedin === b.linkedin &&
      a.github === b.github &&
      a.website === b.website &&
      a.summary === b.summary,
    []
  );

  const debounceMs = 150;
  const changeTimeoutRef = useRef<number | null>(null);
  const emitChange = useCallback(
    (next: ResumeData["personalInfo"]) => {
      if (changeTimeoutRef.current) window.clearTimeout(changeTimeoutRef.current);
      changeTimeoutRef.current = window.setTimeout(() => {
        onChange(next);
      }, debounceMs);
    },
    [onChange]
  );

  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) window.clearTimeout(changeTimeoutRef.current);
    };
  }, []);

  // Sync data from props if it changes externally (avoid resetting on every keystroke)
  useEffect(() => {
    const current = normalize(form.getValues());
    if (!isSamePersonalInfo(current, data)) {
      reset(data);
    }
  }, [data, form, isSamePersonalInfo, normalize, reset]);

  // Sync internal form changes back to parent (debounced to keep typing snappy)
  useEffect(() => {
    const cleanedValue = normalize(values);
    if (!isSamePersonalInfo(cleanedValue, data)) {
      emitChange(cleanedValue);
    }
  }, [data, emitChange, isSamePersonalInfo, normalize, values]);

  // Calculate completion percentage using values from react-hook-form
  const requiredFields = ['fullName', 'email', 'phone', 'location', 'summary'] as const;
  const optionalFields = ['linkedin', 'github', 'website'] as const;
  
  const filledRequired = requiredFields.filter(f => values?.[f]?.toString().trim()).length;
  const filledOptional = optionalFields.filter(f => values?.[f]?.toString().trim()).length;
  const completionPercent = Math.round(((filledRequired / requiredFields.length) * 80) + ((filledOptional / optionalFields.length) * 20));

  const getFieldStatus = (name: keyof PersonalInfoValues) => {
    const value = values?.[name];
    const error = form.getFieldState(name).error;
    return value && value.toString().trim().length > 0 && !error;
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Completion Progress */}
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Section Completion</span>
            <span className={cn(
              "text-sm font-bold",
              completionPercent >= 80 ? "text-green-600" : completionPercent >= 50 ? "text-amber-600" : "text-muted-foreground"
            )}>
              {completionPercent}%
            </span>
          </div>
          <Progress value={completionPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionPercent < 80 ? "Fill in required fields to improve your resume score" : "Great job! Your personal info is complete"}
          </p>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Full Name
                      <span className="text-red-500">*</span>
                    </span>
                    {getFieldStatus('fullName') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      className={cn(
                        "bg-background transition-all",
                        getFieldStatus('fullName') && "border-green-200 focus:border-green-400"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                      <span className="text-red-500">*</span>
                    </span>
                    {getFieldStatus('email') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      className={cn(
                        "bg-background transition-all",
                        getFieldStatus('email') && "border-green-200 focus:border-green-400"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone
                      <span className="text-red-500">*</span>
                    </span>
                    {getFieldStatus('phone') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="+1 (555) 123-4567"
                      className={cn(
                        "bg-background transition-all",
                        getFieldStatus('phone') && "border-green-200 focus:border-green-400"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="location"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Location
                      <span className="text-red-500">*</span>
                    </span>
                    {getFieldStatus('location') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="San Francisco, CA"
                      className={cn(
                        "bg-background transition-all",
                        getFieldStatus('location') && "border-green-200 focus:border-green-400"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Online Presence Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Online Presence
            <span className="text-xs font-normal">(Optional but recommended)</span>
          </h3>
          <div className="space-y-4">
            <FormField
              control={control}
              name="linkedin"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Linkedin className="h-3.5 w-3.5 text-[#0077B5]" />
                    LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="linkedin.com/in/johndoe"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="github"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="github.com/johndoe"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="website"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="johndoe.com"
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-100">
            <strong>Tip:</strong> Adding LinkedIn and GitHub profiles can increase your callback rate by up to 40%
          </p>
        </div>

        {/* Professional Summary Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Professional Summary
          </h3>
          <FormField
            control={control}
            name="summary"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Summary Statement
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0} / 500 characters
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Results-driven professional with 5+ years of experience in... Proven track record of... Passionate about..."
                    rows={5}
                    maxLength={500}
                    className={cn(
                      "bg-background resize-none transition-all",
                      getFieldStatus('summary') && field.value && field.value.length >= 100 && "border-green-200 focus:border-green-400"
                    )}
                  />
                </FormControl>
                <FormMessage />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Best Practice</span>
                  <span>Write 3-4 impactful sentences highlighting your years of experience, key achievements, and what makes you unique. Use action verbs and include metrics when possible.</span>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}