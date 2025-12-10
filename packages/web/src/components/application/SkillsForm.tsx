"use client";

import React, { useState } from "react";
import { Plus, Trash2, Zap, Code, Users, Wrench, Star, Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResumeData } from "./types";
import { skillCategories } from "./constants";
import { cn } from "@/lib/utils";

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

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const addSkillCategory = () => {
    const newCategory = {
      category: "",
      skills: []
    };
    onChange([...data, newCategory]);
    setExpandedCategories(prev => [...prev, data.length]);
  };

  const updateCategory = (index: number, field: 'category' | 'skills', value: any) => {
    const updated = [...data];
    if (field === 'category') {
      updated[index] = { ...updated[index], category: value };
    } else {
      updated[index] = { ...updated[index], skills: value };
    }
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const addSkill = (categoryIndex: number, skill?: string) => {
    const skillToAdd = skill || skillInputs[categoryIndex]?.trim();
    if (!skillToAdd) return;

    const updated = [...data];
    if (!updated[categoryIndex].skills.includes(skillToAdd)) {
      updated[categoryIndex].skills.push(skillToAdd);
      onChange(updated);
    }
    setSkillInputs(prev => ({ ...prev, [categoryIndex]: "" }));
  };

  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const updated = [...data];
    updated[categoryIndex].skills = updated[categoryIndex].skills.filter((_, i) => i !== skillIndex);
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(categoryIndex);
    }
  };

  const getTotalSkills = () => data.reduce((sum, cat) => sum + cat.skills.length, 0);

  const getSuggestions = (category: string) => {
    return skillSuggestions[category] || [];
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {data.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{getTotalSkills()} Skills Added</p>
              <p className="text-sm text-muted-foreground">Across {data.length} categories</p>
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
      {data.length === 0 && (
        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-xl text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Showcase Your Skills</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Group your skills by category to help recruiters quickly find what they&apos;re looking for. Include both technical and soft skills.
          </p>
          <Button onClick={addSkillCategory} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Skill Category
          </Button>
        </div>
      )}

      {/* Skill Categories */}
      {data.map((category, index) => {
        const isExpanded = expandedCategories.includes(index);
        const suggestions = getSuggestions(category.category).filter(s => !category.skills.includes(s));
        const icon = categoryIcons[category.category] || <Star className="h-4 w-4" />;

        return (
          <div
            key={index}
            className={cn(
              "border rounded-xl overflow-hidden transition-all duration-200",
              "hover:shadow-md hover:border-primary/20"
            )}
          >
            {/* Category Header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4 cursor-pointer transition-colors",
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
                    {category.category || "Select Category"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.skills.length} skill{category.skills.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(index);
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
                <div className="space-y-2">
                  <Label htmlFor={`category-${index}`} className="flex items-center gap-2">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={category.category}
                    onValueChange={(value) => updateCategory(index, 'category', value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Input */}
                <div className="space-y-2">
                  <Label>Add Skills</Label>
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
                {category.skills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Current Skills
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill, skillIndex) => (
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
                {category.category && suggestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Suggested Skills
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 8).map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
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

      {data.length > 0 && (
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
      {data.length > 0 && (
        <div className="text-xs text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-1">
          <p className="font-medium text-foreground">💡 Skills Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Include a mix of technical skills and soft skills</li>
            <li>List skills mentioned in job descriptions you&apos;re targeting</li>
            <li>Be honest - only include skills you can demonstrate</li>
            <li>Aim for 10-15 relevant skills total</li>
          </ul>
        </div>
      )}
    </div>
  );
}