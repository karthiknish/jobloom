"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ResumeData } from '@/types/resume';
import { calculateResumeScore, calculateATSScore, suggestKeywords, getImprovementSuggestions, validateResume } from '@/lib/resumeMetrics';
import { showError, showSuccess } from '@/components/ui/Toast';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';

export interface ResumeBuilderContextValue {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  updatePersonalInfo: (field: string, value: string) => void;
  addExperience: () => void;
  updateExperience: (index: number, updates: any) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (index: number, updates: any) => void;
  removeEducation: (id: string) => void;
  updateSkills: (categoryIndex: number, skills: string) => void;
  addProject: () => void;
  updateProject: (index: number, updates: any) => void;
  removeProject: (id: string) => void;
  saveResume: () => Promise<void>;
  loading: boolean;
  saving: boolean;
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  resumeScore: number;
  atsScore: number;
  keywordSuggestions: string[];
  improvementSuggestions: string[];
  validationIssues: ReturnType<typeof validateResume>;
  generateSummarySuggestion: () => Promise<void>;
}

const ResumeBuilderContext = createContext<ResumeBuilderContextValue | undefined>(undefined);

export const ResumeBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', summary: '' },
    experience: [],
    education: [],
    skills: [
      { category: 'Technical', skills: [] },
      { category: 'Soft Skills', skills: [] },
      { category: 'Languages', skills: [] },
    ],
    projects: [],
    certifications: [],
    languages: [],
  });

  const resumeScore = calculateResumeScore(resumeData);
  const atsScore = calculateATSScore(resumeData);
  const keywordSuggestions = suggestKeywords(resumeData);
  const improvementSuggestions = getImprovementSuggestions(resumeData);
  const validationIssues = validateResume(resumeData);

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };
  const addExperience = () => {
    setResumeData(prev => ({ ...prev, experience: [...prev.experience, { id: Date.now().toString(), company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '', achievements: [''] }] }));
  };
  const updateExperience = (index: number, updates: any) => {
    setResumeData(prev => ({ ...prev, experience: prev.experience.map((e,i)=> i===index? { ...e, ...updates }: e ) }));
  };
  const removeExperience = (id: string) => {
    setResumeData(prev => ({ ...prev, experience: prev.experience.filter(e=> e.id!==id) }));
  };
  const addEducation = () => {
    setResumeData(prev => ({ ...prev, education: [...prev.education, { id: Date.now().toString(), institution: '', degree: '', field: '', graduationDate: '', gpa: '', honors: '' }] }));
  };
  const updateEducation = (index: number, updates: any) => {
    setResumeData(prev => ({ ...prev, education: prev.education.map((e,i)=> i===index? { ...e, ...updates }: e ) }));
  };
  const removeEducation = (id: string) => {
    setResumeData(prev => ({ ...prev, education: prev.education.filter(e=> e.id!==id) }));
  };
  const updateSkills = (categoryIndex: number, skills: string) => {
    const skillArray = skills.split(',').map(s=>s.trim()).filter(Boolean);
    setResumeData(prev => ({ ...prev, skills: prev.skills.map((s,i)=> i===categoryIndex? { ...s, skills: skillArray }: s ) }));
  };
  const addProject = () => {
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, { id: Date.now().toString(), name: '', description: '', technologies: [], link: '', github: '' }] }));
  };
  const updateProject = (index: number, updates: any) => {
    setResumeData(prev => ({ ...prev, projects: prev.projects.map((p,i)=> i===index? { ...p, ...updates }: p ) }));
  };
  const removeProject = (id: string) => {
    setResumeData(prev => ({ ...prev, projects: prev.projects.filter(p=> p.id!==id) }));
  };

  // Autosave local
  const lastSavedRef = useRef<number>(Date.now());
  useEffect(()=>{
    const t = setTimeout(()=>{
      try {
        const payload = { updated: Date.now(), data: resumeData, template: selectedTemplate };
        localStorage.setItem('resume:draft', JSON.stringify(payload));
        lastSavedRef.current = payload.updated;
      } catch {}
    }, 1200);
    return ()=> clearTimeout(t);
  }, [resumeData, selectedTemplate]);

  const fetchResume = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/portfolio/resume', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        const serverTime = data.version || 0;
        try {
          const draftRaw = localStorage.getItem('resume:draft');
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft.updated && draft.updated > serverTime) {
              setResumeData(draft.data);
              if (draft.template) setSelectedTemplate(draft.template);
              return;
            }
          }
        } catch {}
        setResumeData(data.resumeData);
        if (data.templateId) setSelectedTemplate(data.templateId);
      }
    } catch (e:any) {
      console.error('Failed to load resume', e);
      showError('Unable to load resume data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(()=>{ fetchResume(); }, [fetchResume]);

  const saveResume = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/portfolio/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId: selectedTemplate, resumeData, version: Date.now() })
      });
      if (!res.ok) throw new Error('Failed to save resume');
      showSuccess('Resume saved successfully!');
    } catch (e:any) {
      showError(e.message || 'Unable to save resume');
    } finally {
      setSaving(false);
    }
  };

  const generateSummarySuggestion = async () => {
    if (resumeData.experience.length === 0 && resumeData.skills.every(s=> s.skills.length===0)) {
      showError('Add some experience and skills first to generate a personalized summary');
      return;
    }
    try {
      const experienceText = resumeData.experience[0] ? `with ${resumeData.experience[0].position} experience at ${resumeData.experience[0].company}`: '';
      const skillsText = resumeData.skills.filter(s=> s.skills.length>0).map(s=> s.skills.slice(0,3).join(', ')).join(' and ');
      const suggestedSummary = `Experienced professional ${experienceText} skilled in ${skillsText}. Passionate about delivering high-quality solutions and driving innovation in dynamic environments.`;
      updatePersonalInfo('summary', suggestedSummary);
      showSuccess('Summary suggestion generated!');
    } catch {
      showError('Failed to generate summary suggestion');
    }
  };

  const value: ResumeBuilderContextValue = {
    resumeData,
    setResumeData,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addProject,
    updateProject,
    removeProject,
    saveResume,
    loading,
    saving,
    selectedTemplate,
    setSelectedTemplate,
    resumeScore,
    atsScore,
    keywordSuggestions,
    improvementSuggestions,
    validationIssues,
    generateSummarySuggestion,
  };

  return <ResumeBuilderContext.Provider value={value}>{children}</ResumeBuilderContext.Provider>;
};

export function useResumeBuilder() {
  const ctx = useContext(ResumeBuilderContext);
  if (!ctx) throw new Error('useResumeBuilder must be used within ResumeBuilderProvider');
  return ctx;
}
