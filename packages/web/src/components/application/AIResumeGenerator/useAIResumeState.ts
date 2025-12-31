import { useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';
import { ResumeGeneratorFormData, GeneratedResume } from './types';

export const useAIResumeState = () => {
  const { user } = useFirebaseAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<ResumeGeneratorFormData>({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    jobTitle: "",
    experience: "",
    skills: [],
    education: "",
    industry: "Technology",
    level: "mid",
    style: "modern",
    includeObjective: true,
  });

  useState(() => {
    if (user && !formData.fullName) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || "",
        email: user.email || ""
      }));
    }
  });

  const [resumeOptions, setResumeOptions] = useState<{
    template: 'modern' | 'classic' | 'creative' | 'executive' | 'technical' | 'academic' | 'startup' | 'designer' | 'healthcare' | 'legal';
    colorScheme: 'hireall' | 'blue' | 'gray' | 'green' | 'purple' | 'orange';
    fontSize: number;
    font: 'helvetica' | 'times' | 'courier';
  }>({
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 11,
    font: 'helvetica'
  });

  const nextStep = useCallback(() => setStep(s => Math.min(s + 1, 4)), []);
  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 1)), []);

  const addSkill = useCallback((skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  }, [formData.skills]);

  const removeSkill = useCallback((skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  }, []);

  return {
    step,
    setStep,
    isGenerating,
    setIsGenerating,
    generatedResume,
    setGeneratedResume,
    formData,
    setFormData,
    resumeOptions,
    setResumeOptions,
    nextStep,
    prevStep,
    addSkill,
    removeSkill,
    editedContent,
    setEditedContent,
    isEditing,
    setIsEditing
  };
};
