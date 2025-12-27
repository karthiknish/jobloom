"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CoverLetterData } from "./types";

interface CoverLetterFormProps {
  formData: CoverLetterData;
  onUpdateField: (field: keyof CoverLetterData, value: string) => void;
  onUpdateArrayField: (field: "keyRequirements" | "companyValues", index: number, value: string) => void;
  onAddArrayItem: (field: "keyRequirements" | "companyValues") => void;
  onRemoveArrayItem: (field: "keyRequirements" | "companyValues", index: number) => void;
}

export function CoverLetterForm({
  formData,
  onUpdateField,
  onUpdateArrayField,
  onAddArrayItem,
  onRemoveArrayItem,
}: CoverLetterFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      {/* Basic Job Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
            Job Title *
          </Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => onUpdateField("jobTitle", e.target.value)}
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
            onChange={(e) => onUpdateField("companyName", e.target.value)}
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
            onChange={(e) => onUpdateField("companyLocation", e.target.value)}
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
            onChange={(e) => onUpdateField("hiringManager", e.target.value)}
            placeholder="Optional - e.g. Sarah Johnson"
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription" className="text-sm font-medium text-gray-700">
          Job Description (Snippet)
        </Label>
        <Textarea
          id="jobDescription"
          value={formData.jobDescription}
          onChange={(e) => onUpdateField("jobDescription", e.target.value)}
          rows={3}
          placeholder="Paste the first paragraph or key responsibilities..."
          className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Key Requirements Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Key Requirements from Job Description</Label>
          <Button variant="ghost" size="sm" onClick={() => onAddArrayItem("keyRequirements")} className="h-8 text-xs text-primary">
            <Plus className="h-3 w-3 mr-1" /> Add Requirement
          </Button>
        </div>
        <div className="space-y-2">
          {formData.keyRequirements.map((req, i) => (
            <div key={i} className="flex gap-2 group">
              <Input
                value={req}
                onChange={(e) => onUpdateArrayField("keyRequirements", i, e.target.value)}
                placeholder="e.g. 5+ years React experience"
                className="text-sm flex-1"
              />
              {formData.keyRequirements.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveArrayItem("keyRequirements", i)}
                  className="h-10 w-10 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="pt-4 border-t border-dashed">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
      </div>

      {showAdvanced && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Company Values */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Company Values & Culture</Label>
              <Button variant="ghost" size="sm" onClick={() => onAddArrayItem("companyValues")} className="h-8 text-xs text-primary">
                <Plus className="h-3 w-3 mr-1" /> Add Value
              </Button>
            </div>
            <div className="space-y-2">
              {formData.companyValues.map((val, i) => (
                <div key={i} className="flex gap-2 group">
                  <Input
                    value={val}
                    onChange={(e) => onUpdateArrayField("companyValues", i, e.target.value)}
                    placeholder="e.g. Innovation, Teamwork"
                    className="text-sm flex-1"
                  />
                  {formData.companyValues.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveArrayItem("companyValues", i)}
                      className="h-10 w-10 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Content Overrides */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Custom Opening</Label>
              <Textarea
                value={formData.customOpening || ""}
                onChange={(e) => onUpdateField("customOpening", e.target.value)}
                rows={3}
                placeholder="Override default opening..."
                className="text-xs resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Custom Body</Label>
              <Textarea
                value={formData.customBody || ""}
                onChange={(e) => onUpdateField("customBody", e.target.value)}
                rows={3}
                placeholder="Emphasize specific points..."
                className="text-xs resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Custom Closing</Label>
              <Textarea
                value={formData.customClosing || ""}
                onChange={(e) => onUpdateField("customClosing", e.target.value)}
                rows={3}
                placeholder="Custom closing statement..."
                className="text-xs resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
