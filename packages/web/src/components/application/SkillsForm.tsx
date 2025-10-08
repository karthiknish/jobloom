"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResumeData } from "./types";
import { skillCategories } from "./constants";

interface SkillsFormProps {
  data: ResumeData['skills'];
  onChange: (data: ResumeData['skills']) => void;
}

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const addSkillCategory = () => {
    const newCategory = {
      category: "",
      skills: [""]
    };
    onChange([...data, newCategory]);
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

  const addSkill = (categoryIndex: number) => {
    const updated = [...data];
    updated[categoryIndex].skills.push("");
    onChange(updated);
  };

  const updateSkill = (categoryIndex: number, skillIndex: number, value: string) => {
    const updated = [...data];
    updated[categoryIndex].skills[skillIndex] = value;
    onChange(updated);
  };

  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const updated = [...data];
    updated[categoryIndex].skills = updated[categoryIndex].skills.filter((_, i) => i !== skillIndex);
    onChange(updated);
  };

  const getAvailableCategories = () => {
    const usedCategories = data.map(cat => cat.category).filter(Boolean);
    return skillCategories.filter(cat => !usedCategories.includes(cat));
  };

  return (
    <div className="space-y-6">
      {data.map((category, index) => (
        <div key={index} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Label htmlFor={`category-${index}`}>Skill Category *</Label>
              <Select
                value={category.category}
                onValueChange={(value) => updateCategory(index, 'category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or type a category" />
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeCategory(index)}
              className="text-destructive hover:text-destructive ml-4 mt-6"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Skills</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSkill(index)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Skill
              </Button>
            </div>
            {category.skills.map((skill, skillIndex) => (
              <div key={skillIndex} className="flex gap-2 mb-2">
                <Input
                  value={skill}
                  onChange={(e) => updateSkill(index, skillIndex, e.target.value)}
                  placeholder="e.g., JavaScript, Project Management, Data Analysis"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSkill(index, skillIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Add specific skills relevant to this category. Include both technical and soft skills.
            </p>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={addSkillCategory}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Skill Category
      </Button>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No skills added yet. Add your first skill category to get started.</p>
        </div>
      )}
    </div>
  );
}