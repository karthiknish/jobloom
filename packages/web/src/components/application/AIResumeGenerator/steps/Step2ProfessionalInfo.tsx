import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Layers, GraduationCap, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResumeGeneratorFormData } from '../types';
import { industryOptions } from '../constants';

interface Step2ProfessionalInfoProps {
  formData: ResumeGeneratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<ResumeGeneratorFormData>>;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
}

export const Step2ProfessionalInfo: React.FC<Step2ProfessionalInfoProps> = ({ 
  formData, 
  setFormData, 
  addSkill, 
  removeSkill 
}) => {
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      addSkill(skillInput.trim());
      setSkillInput("");
    }
  };

  return (
    <motion.div 
      key="step-2"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            Target Job Title *
          </Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Senior Software Engineer"
            value={formData.jobTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
            className="h-11 shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry" className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Industry
          </Label>
          <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
            <SelectTrigger className="h-11 bg-background shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map(industry => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Your Experience *</Label>
        <Textarea
          id="experience"
          placeholder="Describe your relevant experience, achievements, and responsibilities..."
          value={formData.experience}
          onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
          rows={5}
          className="bg-background resize-none shadow-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="education" className="flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
          Education
        </Label>
        <Textarea
          id="education"
          placeholder="Your educational background, degrees, certifications..."
          value={formData.education}
          onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
          rows={2}
          className="bg-background resize-none shadow-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>Key Skills</Label>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Add a skill..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            className="h-11 bg-background shadow-sm"
          />
          <Button type="button" onClick={handleAddSkill} size="sm" variant="secondary" className="px-6 h-11">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[3.5rem] p-3 bg-muted/20 rounded-xl border border-dashed">
          {formData.skills.length === 0 && (
            <span className="text-sm text-muted-foreground italic p-1">No skills added yet</span>
          )}
          {formData.skills.map(skill => (
            <Badge 
              key={skill} 
              variant="secondary" 
              className="pl-3 pr-2 py-1.5 flex items-center gap-1.5 bg-background shadow-sm border border-muted"
            >
              {skill}
              <button 
                type="button" 
                onClick={() => removeSkill(skill)}
                className="hover:bg-muted p-0.5 rounded-full transition-colors"
                title="Remove skill"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
