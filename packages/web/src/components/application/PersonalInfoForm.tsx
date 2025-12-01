"use client";

import React from "react";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ResumeData } from "./types";
import { cn } from "@/lib/utils";

interface PersonalInfoFormProps {
  data: ResumeData['personalInfo'];
  onChange: (data: ResumeData['personalInfo']) => void;
}

export function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const handleChange = (field: keyof ResumeData['personalInfo'], value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Calculate completion percentage
  const requiredFields = ['fullName', 'email', 'phone', 'location', 'summary'];
  const optionalFields = ['linkedin', 'github', 'website'];
  const filledRequired = requiredFields.filter(f => data[f as keyof typeof data]?.toString().trim()).length;
  const filledOptional = optionalFields.filter(f => data[f as keyof typeof data]?.toString().trim()).length;
  const completionPercent = Math.round(((filledRequired / requiredFields.length) * 80) + ((filledOptional / optionalFields.length) * 20));

  const getFieldStatus = (value: string | undefined) => {
    return value && value.trim().length > 0;
  };

  return (
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
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
                <span className="text-red-500">*</span>
              </span>
              {getFieldStatus(data.fullName) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="John Doe"
              className={cn(
                "bg-background transition-all",
                getFieldStatus(data.fullName) && "border-green-200 focus:border-green-400"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
                <span className="text-red-500">*</span>
              </span>
              {getFieldStatus(data.email) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              className={cn(
                "bg-background transition-all",
                getFieldStatus(data.email) && "border-green-200 focus:border-green-400"
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone
                <span className="text-red-500">*</span>
              </span>
              {getFieldStatus(data.phone) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={cn(
                "bg-background transition-all",
                getFieldStatus(data.phone) && "border-green-200 focus:border-green-400"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Location
                <span className="text-red-500">*</span>
              </span>
              {getFieldStatus(data.location) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="San Francisco, CA"
              className={cn(
                "bg-background transition-all",
                getFieldStatus(data.location) && "border-green-200 focus:border-green-400"
              )}
            />
          </div>
        </div>
      </div>

      {/* Online Presence Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Online Presence
          <span className="text-xs font-normal">(Optional but recommended)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-3.5 w-3.5 text-[#0077B5]" />
              LinkedIn
            </Label>
            <div className="relative">
              <Input
                id="linkedin"
                value={data.linkedin || ''}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/johndoe"
                className="bg-background pl-3"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5" />
              GitHub
            </Label>
            <Input
              id="github"
              value={data.github || ''}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="github.com/johndoe"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Website
            </Label>
            <Input
              id="website"
              value={data.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="johndoe.com"
              className="bg-background"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
          💡 <strong>Tip:</strong> Adding LinkedIn and GitHub profiles can increase your callback rate by up to 40%
        </p>
      </div>

      {/* Professional Summary Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Professional Summary
        </h3>
        <div className="space-y-2">
          <Label htmlFor="summary" className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Summary Statement
              <span className="text-red-500">*</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {data.summary?.length || 0} / 500 characters
            </span>
          </Label>
          <Textarea
            id="summary"
            value={data.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            placeholder="Results-driven professional with 5+ years of experience in... Proven track record of... Passionate about..."
            rows={5}
            maxLength={500}
            className={cn(
              "bg-background resize-none transition-all",
              getFieldStatus(data.summary) && data.summary.length >= 100 && "border-green-200 focus:border-green-400"
            )}
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Best Practice</span>
            <span>Write 3-4 impactful sentences highlighting your years of experience, key achievements, and what makes you unique. Use action verbs and include metrics when possible.</span>
          </div>
        </div>
      </div>
    </div>
  );
}