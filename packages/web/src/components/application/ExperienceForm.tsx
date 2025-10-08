"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ResumeData } from "./types";
import { generateResumeId } from "./utils";

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

  return (
    <div className="space-y-6">
      {data.map((exp, index) => (
        <div key={exp.id} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">Experience {index + 1}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeExperience(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`position-${index}`}>Position *</Label>
              <Input
                id={`position-${index}`}
                value={exp.position}
                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor={`company-${index}`}>Company *</Label>
              <Input
                id={`company-${index}`}
                value={exp.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                placeholder="Tech Company"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`location-${index}`}>Location</Label>
              <Input
                id={`location-${index}`}
                value={exp.location}
                onChange={(e) => updateExperience(index, 'location', e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor={`startDate-${index}`}>Start Date *</Label>
              <Input
                id={`startDate-${index}`}
                value={exp.startDate}
                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                placeholder="Jan 2020"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`endDate-${index}`}>End Date</Label>
              <Input
                id={`endDate-${index}`}
                value={exp.endDate}
                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                placeholder="Dec 2022"
                disabled={exp.current}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`current-${index}`}
                checked={exp.current}
                onCheckedChange={(checked) => updateExperience(index, 'current', checked)}
              />
              <Label htmlFor={`current-${index}`}>Currently working here</Label>
            </div>
          </div>

          <div>
            <Label htmlFor={`description-${index}`}>Job Description</Label>
            <Textarea
              id={`description-${index}`}
              value={exp.description}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              placeholder="Describe your role and responsibilities..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Key Achievements</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addAchievement(index)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Achievement
              </Button>
            </div>
            {exp.achievements.map((achievement, achIndex) => (
              <div key={achIndex} className="flex gap-2 mb-2">
                <Input
                  value={achievement}
                  onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                  placeholder="Increased team productivity by 30%..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAchievement(index, achIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Use action verbs and include metrics when possible (e.g., &quot;Increased revenue by 25%&quot;)
            </p>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={addExperience}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}