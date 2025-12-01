"use client";

import React from "react";
import { Plus, Trash2, Briefcase, Building2, MapPin, Calendar, Award, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ResumeData } from "./types";
import { generateResumeId } from "./utils";
import { cn } from "@/lib/utils";

interface ExperienceFormProps {
  data: ResumeData['experience'];
  onChange: (data: ResumeData['experience']) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    const newExperience = {
      id: generateResumeId(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [""]
    };
    onChange([...data, newExperience]);
  };

  const updateExperience = (index: number, field: any, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const addAchievement = (expIndex: number) => {
    const updated = [...data];
    updated[expIndex].achievements.push("");
    onChange(updated);
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const updated = [...data];
    updated[expIndex].achievements[achIndex] = value;
    onChange(updated);
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updated = [...data];
    updated[expIndex].achievements = updated[expIndex].achievements.filter((_, i) => i !== achIndex);
    onChange(updated);
  };

  // Calculate experience completeness
  const getExperienceCompleteness = (exp: ResumeData['experience'][0]) => {
    const fields = [exp.position, exp.company, exp.startDate, exp.description];
    const filledFields = fields.filter(f => f && f.trim().length > 0).length;
    const hasAchievements = exp.achievements.some(a => a.trim().length > 0);
    return Math.round(((filledFields / fields.length) * 80) + (hasAchievements ? 20 : 0));
  };

  return (
    <div className="space-y-6">
      {/* Header with tips */}
      {data.length === 0 && (
        <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Add Your Work Experience</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start with your most recent position. Include key achievements with measurable results to stand out.
          </p>
          <Button onClick={addExperience} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Experience
          </Button>
        </div>
      )}

      {data.map((exp, index) => {
        const completeness = getExperienceCompleteness(exp);
        return (
          <div
            key={exp.id}
            className={cn(
              "relative border rounded-xl overflow-hidden transition-all duration-200",
              "hover:shadow-md hover:border-primary/20",
              exp.current && "ring-2 ring-primary/20 border-primary/30"
            )}
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {exp.position || "New Position"}
                      {exp.current && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {exp.company || "Company Name"} {exp.location && `• ${exp.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <span className={cn(
                      "text-xs font-medium",
                      completeness >= 80 ? "text-green-600" : completeness >= 50 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {completeness}% complete
                    </span>
                    <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          completeness >= 80 ? "bg-green-500" : completeness >= 50 ? "bg-amber-500" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-5">
              {/* Position & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`position-${index}`} className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Position <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`position-${index}`}
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    placeholder="Software Engineer"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`company-${index}`} className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Company <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`company-${index}`}
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="Tech Company Inc."
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Location & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`location-${index}`} className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Location
                  </Label>
                  <Input
                    id={`location-${index}`}
                    value={exp.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`startDate-${index}`} className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`startDate-${index}`}
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    placeholder="Jan 2020"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`endDate-${index}`} className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    End Date
                  </Label>
                  <Input
                    id={`endDate-${index}`}
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    placeholder={exp.current ? "Present" : "Dec 2022"}
                    disabled={exp.current}
                    className={cn("bg-background", exp.current && "opacity-50")}
                  />
                </div>
              </div>

              {/* Current Position Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border">
                <Switch
                  id={`current-${index}`}
                  checked={exp.current}
                  onCheckedChange={(checked) => updateExperience(index, 'current', checked)}
                />
                <Label htmlFor={`current-${index}`} className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-primary" />
                  I currently work here
                </Label>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Job Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  placeholder="Describe your role, responsibilities, and the impact you made..."
                  rows={3}
                  className="bg-background resize-none"
                />
              </div>

              {/* Key Achievements */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    Key Achievements
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAchievement(index)}
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Achievement
                  </Button>
                </div>

                <div className="space-y-2">
                  {exp.achievements.map((achievement, achIndex) => (
                    <div key={achIndex} className="flex gap-2 items-start">
                      <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5">
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          {achIndex + 1}
                        </span>
                      </div>
                      <Input
                        value={achievement}
                        onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                        placeholder="Increased team productivity by 30% by implementing..."
                        className="flex-1 bg-background"
                      />
                      {exp.achievements.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAchievement(index, achIndex)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
                  💡 <strong>Pro tip:</strong> Use the STAR method (Situation, Task, Action, Result) and include specific numbers. Example: &ldquo;Reduced page load time by 40%, improving user retention by 15%&rdquo;
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {data.length > 0 && (
        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Experience
        </Button>
      )}

      {data.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          List experiences in reverse chronological order (most recent first)
        </p>
      )}
    </div>
  );
}