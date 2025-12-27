"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Zap, Code, Users, Wrench, Star, Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ResumeData } from "./types";
import { skillCategories } from "./constants";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const skillsSchema = z.object({
  skills: z.array(z.object({
    category: z.string().min(1, "Category is required"),
    skills: z.array(z.string())
  }))
});

type SkillsValues = z.infer<typeof skillsSchema>;

interface SkillsFormProps {
  data: ResumeData['skills'];
  onChange: (data: ResumeData['skills']) => void;
}

// Popular skills suggestions by category
const skillSuggestions: Record<string, string[]> = {
  "Programming Languages": ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go", "Rust", "Ruby"],
  "Frameworks & Libraries": ["React", "Node.js", "Next.js", "Vue.js", "Angular", "Django", "Spring Boot", "Express.js"],
  "Databases": ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch", "Firebase", "DynamoDB"],
  "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "GCP", "Azure", "Jenkins"],
  "Design Tools": ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InVision"],
  "Soft Skills": ["Leadership", "Communication", "Problem-solving", "Teamwork", "Time Management", "Adaptability"],
  "Project Management": ["Agile", "Scrum", "Jira", "Confluence", "Kanban", "Risk Management"],
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Programming Languages": <Code className="h-4 w-4" />,
  "Frameworks & Libraries": <Wrench className="h-4 w-4" />,
  "Databases": <Zap className="h-4 w-4" />,
  "Cloud & DevOps": <Zap className="h-4 w-4" />,
  "Soft Skills": <Users className="h-4 w-4" />,
  "Project Management": <Star className="h-4 w-4" />,
};

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0]);
  const [skillInputs, setSkillInputs] = useState<Record<number, string>>({});

  const form = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: { skills: data },
    mode: "onChange",
  });

  const { control, watch, reset, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const values = watch();

  // Sync data from props if it changes externally
  useEffect(() => {
    reset({ skills: data });
  }, [data, reset]);

  // Sync internal form changes back to parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.skills) {
        const cleanedSkills = value.skills.map(s => ({
          category: s?.category || "",
          skills: s?.skills || []
        }));
        
        if (JSON.stringify(data) !== JSON.stringify(cleanedSkills)) {
          onChange(cleanedSkills as ResumeData['skills']);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange, data]);

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const addSkillCategory = () => {
    append({
      category: "",
      skills: []
    });
    setExpandedCategories(prev => [...prev, fields.length]);
  };

  const addSkill = (categoryIndex: number, skill?: string) => {
    const skillToAdd = skill || skillInputs[categoryIndex]?.trim();
    if (!skillToAdd) return;

    const currentSkills = values.skills[categoryIndex].skills;
    if (!currentSkills.includes(skillToAdd)) {
      setValue(`skills.${categoryIndex}.skills`, [...currentSkills, skillToAdd], { shouldDirty: true });
    }
    setSkillInputs(prev => ({ ...prev, [categoryIndex]: "" }));
  };

  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const currentSkills = values.skills[categoryIndex].skills;
    const nextSkills = currentSkills.filter((_, i) => i !== skillIndex);
    setValue(`skills.${categoryIndex}.skills`, nextSkills, { shouldDirty: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(categoryIndex);
    }
  };

  const getTotalSkills = () => values.skills?.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0) || 0;

  const getSuggestions = (category: string, currentSkills: string[]) => {
    return (skillSuggestions[category] || []).filter(s => !currentSkills.includes(s));
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Stats Header */}
        {fields.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{getTotalSkills()} Skills Added</p>
                <p className="text-sm text-muted-foreground">Across {fields.length} categories</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-medium",
                getTotalSkills() >= 10 ? "text-green-600" : getTotalSkills() >= 5 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {getTotalSkills() >= 10 ? "Great coverage!" : getTotalSkills() >= 5 ? "Good start" : "Add more skills"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {fields.length === 0 && (
          <EmptyState
            icon={Zap}
            title="Showcase Your Skills"
            description="Group your skills by category so recruiters can quickly find both your technical and soft skills."
            variant="dashed"
            actions={[{ label: "Add Your First Skill Category", onClick: addSkillCategory, icon: Plus }]}
          />
        )}

        {/* Skill Categories */}
        {fields.map((field, index) => {
          const isExpanded = expandedCategories.includes(index);
          const currentSkills = values.skills?.[index]?.skills || [];
          const category = values.skills?.[index]?.category || "";
          const suggestions = getSuggestions(category, currentSkills);
          const icon = categoryIcons[category] || <Star className="h-4 w-4" />;

          return (
            <div
              key={field.id}
              className={cn(
                "border rounded-xl overflow-hidden motion-surface",
                "hover:shadow-md hover:border-primary/20"
              )}
            >
              {/* Category Header */}
              <div
                className={cn(
                  "flex items-center justify-between px-5 py-4 cursor-pointer motion-control",
                  "bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50"
                )}
                onClick={() => toggleCategory(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {category || "Select Category"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSkills.length} skill{currentSkills.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-5 space-y-4 border-t">
                  {/* Category Selector */}
                  <FormField
                    control={control}
                    name={`skills.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          Category <span className="text-red-500">*</span>
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skillCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Skills Input */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Add Skills</div>
                    <div className="flex gap-2">
                      <Input
                        value={skillInputs[index] || ""}
                        onChange={(e) => setSkillInputs(prev => ({ ...prev, [index]: e.target.value }))}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="Type a skill and press Enter"
                        className="bg-background"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => addSkill(index)}
                        disabled={!skillInputs[index]?.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Current Skills */}
                  {currentSkills.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                        Current Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentSkills.map((skill, skillIndex) => (
                          <Badge
                            key={skillIndex}
                            variant="secondary"
                            className="px-3 py-1.5 text-sm flex items-center gap-1.5 hover:bg-destructive/10 group transition-colors"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(index, skillIndex)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {category && suggestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1 font-medium">
                        <Lightbulb className="h-3 w-3" />
                        Suggested Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 8).map((suggestion) => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors font-normal"
                            onClick={() => addSkill(index, suggestion)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {fields.length > 0 && (
          <Button
            variant="outline"
            onClick={addSkillCategory}
            className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Category
          </Button>
        )}

        {/* Tips */}
        {fields.length > 0 && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-1">
            <p className="font-medium text-foreground">Skills Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Include a mix of technical skills and soft skills</li>
              <li>List skills mentioned in job descriptions you&apos;re targeting</li>
              <li>Be honest - only include skills you can demonstrate</li>
              <li>Aim for 10-15 relevant skills total</li>
            </ul>
          </div>
        )}
      </div>
    </Form>
  );
}