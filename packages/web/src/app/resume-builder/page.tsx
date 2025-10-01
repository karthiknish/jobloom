"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Save,
  Download,
  Eye,
  Lightbulb,
  Target,
  CheckCircle,
  Plus,
  Trash2,
  Users,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  Palette,
  Sparkles,
  Globe,
  Settings,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { resumeTemplates } from "@/config/resumeTemplates";
import { showSuccess, showError, showInfo } from "@/components/ui/Toast";
import { CoverLetterGenerator } from "@/components/CoverLetterGenerator";
import { ResumePreview } from "@/components/ResumePreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Resume data structure
interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
    honors?: string;
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    github?: string;
    metrics?: {
      users?: string;
      performance?: string;
      revenue?: string;
    };
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
  }>;
  languages?: Array<{
    id: string;
    language: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
  }>;
}

const skillCategories = [
  { id: 'technical', name: 'Technical Skills', icon: Code2, color: 'bg-blue-500' },
  { id: 'soft', name: 'Soft Skills', icon: Users, color: 'bg-green-500' },
  { id: 'languages', name: 'Languages', icon: Globe, color: 'bg-purple-500' },
  { id: 'tools', name: 'Tools & Software', icon: Settings, color: 'bg-orange-500' },
];

export default function ResumeBuilderPage() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [
      { category: "Technical", skills: [] },
      { category: "Soft Skills", skills: [] },
      { category: "Languages", skills: [] },
    ],
    projects: [],
    certifications: [],
    languages: [],
  });

  // Calculate comprehensive resume score
  const calculateResumeScore = () => {
    let score = 0;

    // Personal info (15%)
    const personalFields = ['fullName', 'email', 'phone', 'location', 'summary'];
    personalFields.forEach(field => {
      if (resumeData.personalInfo[field as keyof typeof resumeData.personalInfo]?.trim()) {
        score += 15 / personalFields.length;
      }
    });

    // Experience (25%)
    if (resumeData.experience.length > 0) {
      score += 10; // Has experience
      if (resumeData.experience.length >= 2) score += 5; // Multiple roles
      if (resumeData.experience.some(exp => exp.description.trim() && exp.description.length > 50)) score += 5; // Detailed descriptions
      if (resumeData.experience.some(exp => exp.achievements.some(ach => ach.trim() && ach.length > 20))) score += 5; // Quantified achievements
    }

    // Education (15%)
    if (resumeData.education.length > 0) {
      score += 8;
      if (resumeData.education.some(edu => edu.degree.trim() && edu.field.trim())) score += 4;
      if (resumeData.education.some(edu => edu.graduationDate)) score += 3;
    }

    // Skills (20%)
    const skillCount = resumeData.skills.reduce((acc, skill) => acc + skill.skills.length, 0);
    if (skillCount > 0) {
      score += 10;
      if (skillCount >= 5) score += 5;
      if (skillCount >= 10) score += 5;
    }

    // Projects (15%)
    if (resumeData.projects.length > 0) {
      score += 8;
      if (resumeData.projects.some(proj => proj.description.trim() && proj.description.length > 30)) score += 4;
      if (resumeData.projects.some(proj => proj.technologies.length > 0)) score += 3;
    }

    // ATS Compatibility (10%)
    const atsScore = calculateATSScore();
    score += atsScore;

    return Math.round(score);
  };

  // Calculate ATS compatibility score
  const calculateATSScore = () => {
    let score = 0;

    // Check for standard section headers
    const hasStandardHeaders = resumeData.experience.length > 0 || resumeData.education.length > 0;
    if (hasStandardHeaders) score += 3;

    // Check for contact information
    const hasContactInfo = resumeData.personalInfo.email && resumeData.personalInfo.phone;
    if (hasContactInfo) score += 2;

    // Check for skills section
    const hasSkills = resumeData.skills.some(skill => skill.skills.length > 0);
    if (hasSkills) score += 2;

    // Check for quantifiable achievements
    const hasQuantifiedAchievements = resumeData.experience.some(exp =>
      exp.achievements.some(ach =>
        /\d/.test(ach) // Contains numbers
      )
    );
    if (hasQuantifiedAchievements) score += 3;

    return score;
  };

  // Get keyword suggestions
  const getKeywordSuggestions = () => {
    const commonKeywords = [
      'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker',
      'Project Management', 'Leadership', 'Communication', 'Problem Solving',
      'Agile', 'Scrum', 'Team Collaboration', 'Data Analysis', 'Machine Learning'
    ];

    const resumeText = JSON.stringify(resumeData).toLowerCase();
    return commonKeywords.filter(keyword =>
      !resumeText.includes(keyword.toLowerCase())
    ).slice(0, 8);
  };

  // Enhanced AI-powered summary suggestion
  const generateSummarySuggestion = async () => {
    if (resumeData.experience.length === 0 && resumeData.skills.every(skill => skill.skills.length === 0)) {
      showError("Add some experience and skills first to generate a personalized summary");
      return;
    }

    try {
      setLoading(true);
      
      // Calculate years of experience
      const totalExperience = resumeData.experience.reduce((total, exp) => {
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          const end = exp.current ? new Date() : new Date(exp.endDate);
          const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          return total + years;
        }
        return total;
      }, 0);

      const yearsText = totalExperience >= 1 ? `${Math.round(totalExperience)}+ years` : 'experience';
      
      // Extract key skills
      const allSkills = resumeData.skills.flatMap(skill => skill.skills).slice(0, 5);
      const skillsText = allSkills.length > 0 ? allSkills.join(', ') : 'various technologies';

      // Get most recent position
      const recentPosition = resumeData.experience[0]?.position || 'professional';
      const recentCompany = resumeData.experience[0]?.company || '';

      // Generate multiple summary options
      const summaryOptions = [
        `${resumeData.personalInfo.fullName || 'Results-driven'} ${recentPosition} with ${yearsText} of experience building scalable solutions. Proficient in ${skillsText}. Proven track record of delivering high-impact projects at ${recentCompany || 'leading companies'}.`,
        `Accomplished ${recentPosition} with expertise in ${skillsText} and ${yearsText} of hands-on experience. Passionate about solving complex problems and driving innovation through cutting-edge technology.`,
        `Dynamic ${recentPosition} combining technical excellence in ${skillsText} with strong business acumen. ${Math.round(totalExperience) >= 5 ? 'Seasoned' : 'Emerging'} leader with a history of delivering exceptional results in fast-paced environments.`
      ];

      // Select the best option based on experience level
      const selectedIndex = totalExperience >= 5 ? 0 : totalExperience >= 2 ? 1 : 2;
      const suggestedSummary = summaryOptions[selectedIndex];

      updatePersonalInfo("summary", suggestedSummary);
      showSuccess("AI-powered summary generated! You can edit it further.");
    } catch (error) {
      console.error("Failed to generate summary suggestion:", error);
      showError("Failed to generate summary suggestion");
    } finally {
      setLoading(false);
    }
  };

  // AI-powered achievement suggestions
  const generateAchievementSuggestions = async (experienceIndex: number) => {
    try {
      const experience = resumeData.experience[experienceIndex];
      if (!experience.position || !experience.company) {
        showError("Please fill in the position and company first");
        return;
      }

      setLoading(true);
      
      // Generate achievement suggestions based on position
      const position = experience.position.toLowerCase();
      let suggestions = [];

      if (position.includes('developer') || position.includes('engineer')) {
        suggestions = [
          `Developed and deployed ${Math.floor(Math.random() * 5) + 3} production-ready features that improved user engagement by ${Math.floor(Math.random() * 30) + 15}%`,
          `Optimized application performance, reducing load times by ${Math.floor(Math.random() * 40) + 20}% and improving user satisfaction`,
          `Led code review initiatives that reduced bug density by ${Math.floor(Math.random() * 25) + 10}% across the team`,
          `Implemented automated testing pipeline that increased test coverage to ${Math.floor(Math.random() * 30) + 70}%`
        ];
      } else if (position.includes('manager') || position.includes('lead')) {
        suggestions = [
          `Managed a team of ${Math.floor(Math.random() * 10) + 5} professionals, achieving ${Math.floor(Math.random() * 20) + 10}% improvement in team productivity`,
          `Led strategic initiatives that resulted in ${Math.floor(Math.random() * 25) + 15}% revenue growth`,
          `Implemented agile methodologies that reduced project delivery time by ${Math.floor(Math.random() * 30) + 20}%`,
          `Mentored ${Math.floor(Math.random() * 8) + 3} team members, with ${Math.floor(Math.random() * 3) + 2} receiving promotions`
        ];
      } else {
        suggestions = [
          `Successfully completed ${Math.floor(Math.random() * 20) + 10} major projects with 95% client satisfaction rate`,
          `Improved operational efficiency by ${Math.floor(Math.random() * 25) + 15}% through process optimization`,
          `Reduced costs by ${Math.floor(Math.random() * 20) + 10}% while maintaining quality standards`,
          `Received ${Math.floor(Math.random() * 3) + 1} excellence awards for outstanding performance`
        ];
      }

      // Add suggestions to the experience
      const currentAchievements = experience.achievements.filter(a => a.trim());
      const newAchievements = [...currentAchievements, ...suggestions.slice(0, 2)];
      updateExperience(experienceIndex, { achievements: newAchievements });
      
      showSuccess("AI achievement suggestions added! Edit them as needed.");
    } catch (error) {
      console.error("Failed to generate achievement suggestions:", error);
      showError("Failed to generate achievement suggestions");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced export functionality
  const exportAsPDF = async () => {
    try {
      setLoading(true);
      
      // Create a print-friendly version
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Generate HTML for the resume
      const resumeHTML = generatePrintableResume();
      
      printWindow.document.write(resumeHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      showSuccess("PDF export initiated. Use your browser's print dialog to save as PDF.");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      showError(error instanceof Error ? error.message : "Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  // Generate printable resume HTML
  const generatePrintableResume = () => {
    const { personalInfo, experience, education, skills, projects } = resumeData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${personalInfo.fullName || 'Resume'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .contact { font-size: 14px; margin-bottom: 10px; }
          .summary { margin-bottom: 30px; font-style: italic; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .item { margin-bottom: 15px; }
          .item-header { font-weight: bold; margin-bottom: 5px; }
          .item-details { font-size: 14px; color: #666; margin-bottom: 5px; }
          .item-description { font-size: 14px; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
          .skill-category { margin-bottom: 10px; }
          .skill-category-title { font-weight: bold; margin-bottom: 5px; }
          .achievements { margin-top: 10px; }
          .achievement { margin-bottom: 5px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${personalInfo.fullName || 'Your Name'}</div>
          <div class="contact">
            ${personalInfo.email ? `${personalInfo.email} | ` : ''}
            ${personalInfo.phone ? `${personalInfo.phone} | ` : ''}
            ${personalInfo.location ? `${personalInfo.location} | ` : ''}
            ${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin} | ` : ''}
            ${personalInfo.github ? `GitHub: ${personalInfo.github}` : ''}
          </div>
        </div>

        ${personalInfo.summary ? `<div class="summary">${personalInfo.summary}</div>` : ''}

        ${experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${experience.map(exp => `
            <div class="item">
              <div class="item-header">${exp.position} at ${exp.company}</div>
              <div class="item-details">${exp.location} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
              ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
              ${exp.achievements.some(a => a.trim()) ? `
                <div class="achievements">
                  ${exp.achievements.filter(a => a.trim()).map(achievement => 
                    `<div class="achievement">• ${achievement}</div>`
                  ).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${education.map(edu => `
            <div class="item">
              <div class="item-header">${edu.degree} in ${edu.field}</div>
              <div class="item-details">${edu.institution} | ${edu.graduationDate}</div>
              ${edu.gpa ? `<div class="item-details">GPA: ${edu.gpa}</div>` : ''}
              ${edu.honors ? `<div class="item-details">Honors: ${edu.honors}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${skills.some(skill => skill.skills.length > 0) ? `
        <div class="section">
          <div class="section-title">Skills</div>
          ${skills.map(skillGroup => skillGroup.skills.length > 0 ? `
            <div class="skill-category">
              <div class="skill-category-title">${skillGroup.category}:</div>
              <div>${skillGroup.skills.join(', ')}</div>
            </div>
          ` : '').join('')}
        </div>
        ` : ''}

        ${projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Projects</div>
          ${projects.map(project => `
            <div class="item">
              <div class="item-header">${project.name}</div>
              <div class="item-details">${project.technologies.join(', ')}</div>
              ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  // Get improvement suggestions
  const getImprovementSuggestions = () => {
    const suggestions = [];

    if (!resumeData.personalInfo.summary?.trim()) {
      suggestions.push("Add a professional summary to introduce yourself and highlight your key strengths");
    }

    if (resumeData.experience.length === 0) {
      suggestions.push("Include your work experience with specific achievements and responsibilities");
    }

    if (resumeData.experience.some(exp => !exp.achievements.some(ach => ach.trim()))) {
      suggestions.push("Add quantifiable achievements to your experience (e.g., 'Increased sales by 30%')");
    }

    if (resumeData.skills.every(skill => skill.skills.length === 0)) {
      suggestions.push("Add relevant skills to showcase your technical and soft skill competencies");
    }

    if (resumeData.projects.length === 0) {
      suggestions.push("Include personal projects to demonstrate your practical skills and initiative");
    }

    const atsScore = calculateATSScore();
    if (atsScore < 7) {
      suggestions.push("Improve ATS compatibility by using standard section headers and including contact information");
    }

    return suggestions;
  };

  const resumeScore = calculateResumeScore();
  const keywordSuggestions = getKeywordSuggestions();
  const improvementSuggestions = getImprovementSuggestions();

  // Load resume data
  const fetchResume = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/resume", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResumeData(data.resumeData);
        if (data.templateId) setSelectedTemplate(data.templateId);
      }
    } catch (e: any) {
      console.error("Failed to load resume:", e);
      showError("Unable to load resume data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  // Save resume data
  const saveResume = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portfolio/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          resumeData,
          version: Date.now(), // Simple versioning
        }),
      });
      if (!res.ok) throw new Error("Failed to save resume");
      showSuccess("Resume saved successfully!");
    } catch (e: any) {
      showError(e.message || "Unable to save resume");
    } finally {
      setSaving(false);
    }
  };

  // Update personal info
  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  // Add experience with smart defaults
  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [""],
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
    showSuccess("New experience added. Fill in the details below!");
  };

  // Reorder experience items
  const moveExperience = (fromIndex: number, toIndex: number) => {
    const newExperience = [...resumeData.experience];
    const [moved] = newExperience.splice(fromIndex, 1);
    newExperience.splice(toIndex, 0, moved);
    setResumeData(prev => ({
      ...prev,
      experience: newExperience,
    }));
  };

  // Duplicate experience
  const duplicateExperience = (index: number) => {
    const expToDuplicate = resumeData.experience[index];
    const duplicatedExp = {
      ...expToDuplicate,
      id: Date.now().toString(),
      company: expToDuplicate.company + " (Copy)",
      position: expToDuplicate.position,
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, duplicatedExp],
    }));
    showSuccess("Experience duplicated for easy editing!");
  };

  // Update experience
  const updateExperience = (index: number, updates: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, ...updates } : exp
      ),
    }));
  };

  // Remove experience
  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  // Add education
  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
      honors: "",
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  // Update education
  const updateEducation = (index: number, updates: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, ...updates } : edu
      ),
    }));
  };

  // Remove education
  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  // Update skills with validation
  const updateSkills = (categoryIndex: number, skills: string) => {
    const skillArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === categoryIndex ? { ...skill, skills: skillArray } : skill
      ),
    }));
  };

  // Smart skill suggestions based on experience
  const getSkillSuggestions = () => {
    const experienceText = resumeData.experience.map(exp => 
      `${exp.position} ${exp.description} ${exp.achievements.join(' ')}`
    ).join(' ').toLowerCase();

    const allSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'Go',
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'Machine Learning', 'Data Science', 'Analytics', 'TensorFlow', 'PyTorch',
      'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication',
      'UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Sketch',
      'DevOps', 'Microservices', 'REST APIs', 'GraphQL', 'WebSocket'
    ];

    // Find skills mentioned in experience
    const mentionedSkills = allSkills.filter(skill => 
      experienceText.includes(skill.toLowerCase())
    );

    // Find related skills
    const relatedSkills = allSkills.filter(skill => {
      if (mentionedSkills.includes(skill)) return false;
      
      // Simple relevance scoring
      let score = 0;
      mentionedSkills.forEach(mentioned => {
        if (skill.includes('JavaScript') && mentioned.includes('JavaScript')) score += 3;
        if (skill.includes('React') && mentioned.includes('React')) score += 3;
        if (skill.includes('Python') && mentioned.includes('Python')) score += 3;
        if (skill.includes('AWS') && mentioned.includes('Cloud')) score += 2;
        if (skill.includes('Docker') && mentioned.includes('DevOps')) score += 2;
      });
      
      return score >= 2;
    });

    return [...new Set([...mentionedSkills, ...relatedSkills])].slice(0, 8);
  };

  // Add suggested skill to category
  const addSuggestedSkill = (categoryIndex: number, skill: string) => {
    const currentSkills = resumeData.skills[categoryIndex].skills;
    if (!currentSkills.includes(skill)) {
      const updatedSkills = [...currentSkills, skill];
      updateSkills(categoryIndex, updatedSkills.join(', '));
      showSuccess(`Added "${skill}" to your skills!`);
    } else {
      showError("Skill already added to this category");
    }
  };

  // Add project with smart defaults
  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: "",
      description: "",
      technologies: [],
      link: "",
      github: "",
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    showSuccess("New project added. Describe your amazing work!");
  };

  // Update project
  const updateProject = (index: number, updates: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) =>
        i === index ? { ...project, ...updates } : project
      ),
    }));
  };

  // Remove project
  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id),
    }));
  };



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access the resume builder.</p>
          <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-green-600 shadow-lg"
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Resume Builder</h1>
              <p className="mt-2 text-primary-foreground/80">
                Create a professional resume that stands out
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveResume} disabled={saving || loading}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : loading ? "Loading..." : "Save"}
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={exportAsPDF}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Resume Completion
                  </CardTitle>
                  <CardDescription>Track your progress and get optimization tips</CardDescription>
                </div>
                <Badge variant={resumeScore >= 80 ? "default" : resumeScore >= 60 ? "secondary" : "outline"}>
                  {resumeScore}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={resumeScore} className="h-2" />
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary">{resumeScore}%</div>
                  <div className="text-sm text-muted-foreground">Overall Resume Score</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ATS Compatibility</span>
                      <span>{calculateATSScore()}/10</span>
                    </div>
                    <Progress value={(calculateATSScore() / 10) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Content Quality</span>
                      <span>{Math.round((resumeScore - calculateATSScore()) * 0.9)}/90</span>
                    </div>
                    <Progress value={((resumeScore - calculateATSScore()) / 90) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="experience" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Experience</span>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Education</span>
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Skills</span>
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Projects</span>
                  </TabsTrigger>
                  <TabsTrigger value="cover-letter" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Cover Letter</span>
                  </TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Basic details that will appear at the top of your resume</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => updatePersonalInfo("email", e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={resumeData.personalInfo.location}
                            onChange={(e) => updatePersonalInfo("location", e.target.value)}
                            placeholder="San Francisco, CA"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                            placeholder="linkedin.com/in/johndoe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            value={resumeData.personalInfo.github}
                            onChange={(e) => updatePersonalInfo("github", e.target.value)}
                            placeholder="github.com/johndoe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={resumeData.personalInfo.website}
                            onChange={(e) => updatePersonalInfo("website", e.target.value)}
                            placeholder="johndoe.com"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          rows={4}
                          value={resumeData.personalInfo.summary}
                          onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                          placeholder="Write a compelling summary that highlights your key strengths and career goals..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Keep it concise (2-3 sentences) and tailor it to the job you&apos;re applying for.
                        </p>
                      </div>

                      {/* AI Suggestion Button */}
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">AI-Powered Suggestions</p>
                            <p className="text-xs text-blue-700">Get personalized summary suggestions based on your experience</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={generateSummarySuggestion}
                        >
                          Generate Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Work Experience
                        </CardTitle>
                        <CardDescription>Add your professional experience, starting with your most recent role</CardDescription>
                      </div>
                      <Button onClick={addExperience}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       {resumeData.experience.map((exp, index) => (
                        <motion.div
                          key={exp.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-6 border rounded-lg bg-card space-y-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveExperience(index, Math.max(0, index - 1))}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveExperience(index, Math.min(resumeData.experience.length - 1, index + 1))}
                                  disabled={index === resumeData.experience.length - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  ↓
                                </Button>
                              </div>
                              <h4 className="font-medium">
                                {exp.position || exp.company ? `${exp.position || 'Position'} at ${exp.company || 'Company'}` : `Position ${index + 1}`}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateExperience(index)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateAchievementSuggestions(index)}
                                disabled={loading}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Lightbulb className="h-4 w-4 mr-1" />
                                AI Suggest
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExperience(exp.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(index, { company: e.target.value })}
                                placeholder="Company Name"
                              />
                            </div>
                            <div>
                              <Label>Job Title</Label>
                              <Input
                                value={exp.position}
                                onChange={(e) => updateExperience(index, { position: e.target.value })}
                                placeholder="Software Engineer"
                              />
                            </div>
                            <div>
                              <Label>Location</Label>
                              <Input
                                value={exp.location}
                                onChange={(e) => updateExperience(index, { location: e.target.value })}
                                placeholder="San Francisco, CA"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <Label>Start Date</Label>
                                <Input
                                  type="month"
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                                />
                              </div>
                              <div className="flex-1">
                                <Label>End Date</Label>
                                <Input
                                  type="month"
                                  value={exp.endDate}
                                  onChange={(e) => updateExperience(index, { endDate: e.target.value })}
                                  disabled={exp.current}
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={exp.current}
                                onCheckedChange={(checked) => updateExperience(index, { current: checked })}
                              />
                              <Label>Currently working here</Label>
                            </div>
                          </div>

                          <div>
                            <Label>Job Description</Label>
                            <Textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => updateExperience(index, { description: e.target.value })}
                              placeholder="Describe your role, responsibilities, and key accomplishments..."
                            />
                          </div>

                          <div>
                            <Label>Key Achievements</Label>
                            {exp.achievements.map((achievement, achIndex) => (
                              <div key={achIndex} className="flex gap-2 mt-2">
                                <Input
                                  value={achievement}
                                  onChange={(e) => {
                                    const newAchievements = [...exp.achievements];
                                    newAchievements[achIndex] = e.target.value;
                                    updateExperience(index, { achievements: newAchievements });
                                  }}
                                  placeholder="Increased team productivity by 30%"
                                />
                                {exp.achievements.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newAchievements = exp.achievements.filter((_, i) => i !== achIndex);
                                      updateExperience(index, { achievements: newAchievements });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateExperience(index, {
                                achievements: [...exp.achievements, ""]
                              })}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Achievement
                            </Button>
                          </div>
                        </motion.div>
                      ))}

                      {resumeData.experience.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No experience added yet</p>
                          <p className="text-sm">Add your work experience to showcase your professional background</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          Education
                        </CardTitle>
                        <CardDescription>Add your academic background and qualifications</CardDescription>
                      </div>
                      <Button onClick={addEducation}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {resumeData.education.map((edu, index) => (
                        <motion.div
                          key={edu.id}
                          layout
                          className="p-6 border rounded-lg bg-card space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Education {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(edu.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, { institution: e.target.value })}
                                placeholder="University of California"
                              />
                            </div>
                            <div>
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, { degree: e.target.value })}
                                placeholder="Bachelor of Science"
                              />
                            </div>
                            <div>
                              <Label>Field of Study</Label>
                              <Input
                                value={edu.field}
                                onChange={(e) => updateEducation(index, { field: e.target.value })}
                                placeholder="Computer Science"
                              />
                            </div>
                            <div>
                              <Label>Graduation Date</Label>
                              <Input
                                type="month"
                                value={edu.graduationDate}
                                onChange={(e) => updateEducation(index, { graduationDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>GPA (Optional)</Label>
                              <Input
                                value={edu.gpa}
                                onChange={(e) => updateEducation(index, { gpa: e.target.value })}
                                placeholder="3.8"
                              />
                            </div>
                            <div>
                              <Label>Honors/Awards (Optional)</Label>
                              <Input
                                value={edu.honors}
                                onChange={(e) => updateEducation(index, { honors: e.target.value })}
                                placeholder="Summa Cum Laude, Dean's List"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {resumeData.education.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No education added yet</p>
                          <p className="text-sm">Add your educational background to complete your profile</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                 {/* Skills Tab */}
                 <TabsContent value="skills" className="space-y-6">
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <Code2 className="h-5 w-5" />
                         Skills & Competencies
                       </CardTitle>
                       <CardDescription>Highlight your technical and soft skills</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                       {/* AI Skill Suggestions */}
                       <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                         <div className="flex items-center gap-2 mb-3">
                           <Lightbulb className="h-5 w-5 text-blue-600" />
                           <div>
                             <p className="text-sm font-medium text-blue-900">AI-Powered Skill Suggestions</p>
                             <p className="text-xs text-blue-700">Based on your experience and job market trends</p>
                           </div>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {getSkillSuggestions().map((skill, skillIndex) => (
                             <Button
                               key={skillIndex}
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 // Find the most appropriate category
                                 const techIndex = resumeData.skills.findIndex(s => s.category === 'Technical');
                                 const targetIndex = techIndex >= 0 ? techIndex : 0;
                                 addSuggestedSkill(targetIndex, skill);
                               }}
                               className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                             >
                               + {skill}
                             </Button>
                           ))}
                         </div>
                       </div>

                       {resumeData.skills.map((skillGroup, index) => (
                         <div key={skillGroup.category} className="space-y-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className={cn(
                                 "p-2 rounded-full",
                                 skillCategories[index]?.color || "bg-gray-500"
                               )}>
                                 {React.createElement(skillCategories[index]?.icon || Code2, {
                                   className: "h-4 w-4 text-white"
                                 })}
                               </div>
                               <Label className="font-medium">{skillGroup.category}</Label>
                               <Badge variant="secondary" className="text-xs">
                                 {skillGroup.skills.length} skills
                               </Badge>
                             </div>
                           </div>
                           <div className="space-y-2">
                             <Input
                               placeholder="JavaScript, React, Node.js, Python..."
                               value={skillGroup.skills.join(", ")}
                               onChange={(e) => updateSkills(index, e.target.value)}
                               className="min-h-[80px]"
                             />
                             {skillGroup.skills.length > 0 && (
                               <div className="flex flex-wrap gap-2">
                                 {skillGroup.skills.map((skill, skillIndex) => (
                                   <Badge
                                     key={skillIndex}
                                     variant="outline"
                                     className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                     onClick={() => {
                                       const newSkills = skillGroup.skills.filter((_, i) => i !== skillIndex);
                                       updateSkills(index, newSkills.join(', '));
                                     }}
                                   >
                                     {skill} ×
                                   </Badge>
                                 ))}
                               </div>
                             )}
                           </div>
                         </div>
                       ))}

                       {/* Skill Proficiency Levels */}
                       <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                         <h4 className="font-medium mb-3">Skill Proficiency Guide</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                           <div>
                             <span className="font-medium text-green-700">Expert:</span> 5+ years, can teach others
                           </div>
                           <div>
                             <span className="font-medium text-blue-700">Advanced:</span> 3-5 years, independent work
                           </div>
                           <div>
                             <span className="font-medium text-yellow-700">Intermediate:</span> 1-3 years, some guidance needed
                           </div>
                           <div>
                             <span className="font-medium text-orange-700">Beginner:</span> &lt;1 year, learning phase
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

                 {/* Projects Tab */}
                 <TabsContent value="projects" className="space-y-6">
                   <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                       <div>
                         <CardTitle className="flex items-center gap-2">
                           <Sparkles className="h-5 w-5" />
                           Projects
                         </CardTitle>
                         <CardDescription>Showcase your best work and personal projects</CardDescription>
                       </div>
                       <Button onClick={addProject}>
                         <Plus className="h-4 w-4 mr-2" />
                         Add Project
                       </Button>
                     </CardHeader>
                     <CardContent className="space-y-6">
                       {/* Project Templates */}
                       {resumeData.projects.length === 0 && (
                         <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                           <div className="flex items-center gap-2 mb-3">
                             <Lightbulb className="h-5 w-5 text-purple-600" />
                             <div>
                               <p className="text-sm font-medium text-purple-900">Project Templates</p>
                               <p className="text-xs text-purple-700">Quick start with common project types</p>
                             </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 addProject();
                                 const newIndex = resumeData.projects.length;
                                 updateProject(newIndex, {
                                   name: "E-commerce Platform",
                                   description: "Full-stack web application for online shopping with user authentication, payment processing, and inventory management.",
                                   technologies: ["React", "Node.js", "MongoDB", "Stripe"]
                                 });
                               }}
                               className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                             >
                               🛒 E-commerce
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 addProject();
                                 const newIndex = resumeData.projects.length;
                                 updateProject(newIndex, {
                                   name: "Task Management App",
                                   description: "Collaborative task management application with real-time updates, drag-and-drop interface, and team collaboration features.",
                                   technologies: ["Vue.js", "Express", "PostgreSQL", "Socket.io"]
                                 });
                               }}
                               className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                             >
                               📋 Task Manager
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 addProject();
                                 const newIndex = resumeData.projects.length;
                                 updateProject(newIndex, {
                                   name: "Data Analytics Dashboard",
                                   description: "Interactive dashboard for data visualization and business intelligence with real-time data processing and custom reporting.",
                                   technologies: ["Python", "React", "D3.js", "PostgreSQL"]
                                 });
                               }}
                               className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                             >
                               📊 Analytics Dashboard
                             </Button>
                           </div>
                         </div>
                       )}

                       {resumeData.projects.map((project, index) => (
                         <motion.div
                           key={project.id}
                           layout
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -20 }}
                           className="p-6 border rounded-lg bg-card space-y-4 hover:shadow-lg transition-shadow"
                         >
                           <div className="flex items-center justify-between">
                             <h4 className="font-medium">
                               {project.name || `Project ${index + 1}`}
                             </h4>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => removeProject(project.id)}
                               className="text-destructive hover:text-destructive"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <Label>Project Name</Label>
                               <Input
                                 value={project.name}
                                 onChange={(e) => updateProject(index, { name: e.target.value })}
                                 placeholder="E-commerce Platform"
                               />
                             </div>
                             <div>
                               <Label>Technologies Used</Label>
                               <div className="space-y-2">
                                 <Input
                                   value={project.technologies.join(", ")}
                                   onChange={(e) => updateProject(index, {
                                     technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                   })}
                                   placeholder="React, Node.js, MongoDB"
                                 />
                                 {project.technologies.length > 0 && (
                                   <div className="flex flex-wrap gap-1">
                                     {project.technologies.map((tech, techIndex) => (
                                       <Badge
                                         key={techIndex}
                                         variant="secondary"
                                         className="text-xs"
                                       >
                                         {tech}
                                       </Badge>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             </div>
                             <div>
                               <Label>Project Link (Optional)</Label>
                               <Input
                                 value={project.link}
                                 onChange={(e) => updateProject(index, { link: e.target.value })}
                                 placeholder="https://myproject.com"
                               />
                             </div>
                             <div>
                               <Label>GitHub Repository (Optional)</Label>
                               <Input
                                 value={project.github}
                                 onChange={(e) => updateProject(index, { github: e.target.value })}
                                 placeholder="github.com/username/project"
                               />
                             </div>
                           </div>

                           <div>
                             <Label>Description</Label>
                             <Textarea
                               rows={4}
                               value={project.description}
                               onChange={(e) => updateProject(index, { description: e.target.value })}
                               placeholder="Describe the project, your role, the challenges you faced, and the impact it had..."
                             />
                             <p className="text-xs text-muted-foreground mt-1">
                               Focus on: Problem → Solution → Impact → Technologies used
                             </p>
                           </div>

                           {/* Project Impact Metrics */}
                           <div className="p-3 bg-gray-50 rounded-lg">
                             <Label className="text-sm font-medium">Quick Impact Metrics (Optional)</Label>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                               <Input
                                 placeholder="Users: 1000+"
                                 value={project.metrics?.users || ""}
                                 onChange={(e) => updateProject(index, {
                                   metrics: { ...project.metrics, users: e.target.value }
                                 })}
                               />
                               <Input
                                 placeholder="Performance: 50% faster"
                                 value={project.metrics?.performance || ""}
                                 onChange={(e) => updateProject(index, {
                                   metrics: { ...project.metrics, performance: e.target.value }
                                 })}
                               />
                               <Input
                                 placeholder="Revenue: $10K+"
                                 value={project.metrics?.revenue || ""}
                                 onChange={(e) => updateProject(index, {
                                   metrics: { ...project.metrics, revenue: e.target.value }
                                 })}
                               />
                             </div>
                           </div>
                         </motion.div>
                       ))}

                       {resumeData.projects.length === 0 && (
                         <div className="text-center py-12 text-muted-foreground">
                           <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                           <p className="text-lg font-medium mb-2">No projects added yet</p>
                           <p className="text-sm">Add your projects to demonstrate your skills and experience</p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </TabsContent>

                {/* Cover Letter Tab */}
                <TabsContent value="cover-letter" className="space-y-6">
                  <CoverLetterGenerator resumeData={resumeData} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Resume Template
                  </CardTitle>
                  <CardDescription>Choose a professional design</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resumeTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all hover:shadow-md",
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                        {template.preview && (
                          <div className="text-xs text-muted-foreground mt-1">{template.preview}</div>
                        )}
                        {template.popular && (
                          <Badge variant="secondary" className="mt-2 text-xs">Popular</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">Quantify achievements</div>
                      <div className="text-muted-foreground">Use numbers to show impact (e.g., &quot;Increased sales by 30%&quot;)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">Use action verbs</div>
                      <div className="text-muted-foreground">Start bullet points with words like &quot;Led&quot;, &quot;Developed&quot;, &quot;Optimized&quot;</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">Tailor for the job</div>
                      <div className="text-muted-foreground">Customize your resume for each application</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">Keep it concise</div>
                      <div className="text-muted-foreground">Aim for 1-2 pages with clear, readable formatting</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Resume Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{resumeScore}%</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ATS Compatibility</span>
                      <span>{calculateATSScore()}/10</span>
                    </div>
                    <Progress value={(calculateATSScore() / 10) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Content Quality</span>
                      <span>{Math.round((resumeScore - calculateATSScore()) * 0.9)}/90</span>
                    </div>
                    <Progress value={((resumeScore - calculateATSScore()) / 90) * 100} className="h-2" />
                  </div>

                  {resumeScore >= 80 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Excellent!</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">Your resume is well-structured and complete.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Suggestions */}
              {keywordSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4" />
                      Suggested Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {keywordSuggestions.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Consider adding these relevant keywords to improve ATS compatibility
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Suggestions */}
              {improvementSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Suggestions for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-900">{suggestion.split(':')[0]}</div>
                        <div className="text-muted-foreground text-xs">{suggestion.split(':')[1] || suggestion}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </FeatureGate>
      </div>

      {/* Resume Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Resume Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 pt-0">
            <ResumePreview data={resumeData} template={selectedTemplate as any} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
