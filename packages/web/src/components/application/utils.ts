// Resume scoring and utility functions
import { ResumeData, ResumeScore } from './types';

export function calculateResumeScore(resumeData: ResumeData): ResumeScore {
  // Completeness score
  const personalFields = ['fullName', 'email', 'phone', 'location', 'summary'];
  const personalCompleteness = personalFields.filter(field => 
    resumeData.personalInfo[field as keyof typeof resumeData.personalInfo]
  ).length / personalFields.length;

  const hasExperience = resumeData.experience.length > 0;
  const hasEducation = resumeData.education.length > 0;
  const hasProjects = resumeData.projects.length > 0;
  const hasCertifications = resumeData.certifications && resumeData.certifications.length > 0;

  const sectionCompleteness = (
    (hasExperience ? 1 : 0) +
    (hasEducation ? 1 : 0) +
    (hasProjects ? 1 : 0) +
    (hasCertifications ? 1 : 0)
  ) / 4;

  const skillCount = resumeData.skills.reduce((acc, skill) => acc + skill.skills.length, 0);
  const skillScore = Math.min(skillCount / 10, 1); // Max score at 10+ skills

  const completeness = Math.round(
    (personalCompleteness * 0.3 + sectionCompleteness * 0.4 + skillScore * 0.3) * 100
  );

  // ATS score
  const atsScore = calculateATSScore(resumeData);

  // Impact score
  const impactScore = calculateImpactScore(resumeData);

  // Overall score
  const overall = Math.round((completeness * 0.4 + atsScore * 0.3 + impactScore * 0.3));

  // Generate suggestions
  const suggestions = generateSuggestions(resumeData, completeness, atsScore, impactScore);

  return {
    overall,
    completeness,
    ats: atsScore,
    impact: impactScore,
    suggestions
  };
}

function calculateATSScore(resumeData: ResumeData): number {
  let score = 0;

  // Standard section headers
  const hasStandardHeaders = resumeData.experience.length > 0 || resumeData.education.length > 0;
  if (hasStandardHeaders) score += 20;

  // Contact information
  const hasContactInfo = resumeData.personalInfo.email && resumeData.personalInfo.phone;
  if (hasContactInfo) score += 20;

  // Skills section
  const hasSkills = resumeData.skills.some(skill => skill.skills.length > 0);
  if (hasSkills) score += 20;

  // Quantified achievements
  const hasQuantifiedAchievements = resumeData.experience.some(exp =>
    exp.achievements.some(achievement => /\d+/.test(achievement))
  );
  if (hasQuantifiedAchievements) score += 20;

  // Professional summary
  if (resumeData.personalInfo.summary && resumeData.personalInfo.summary.length > 50) {
    score += 20;
  }

  return Math.min(score, 100);
}

function calculateImpactScore(resumeData: ResumeData): number {
  let score = 0;

  // Quantified achievements in experience
  const quantifiedExp = resumeData.experience.filter(exp =>
    exp.achievements.some(achievement => /\d+/.test(achievement))
  ).length;
  score += Math.min((quantifiedExp / Math.max(resumeData.experience.length, 1)) * 40, 40);

  // Projects with metrics
  const projectsWithMetrics = resumeData.projects.filter(project => project.metrics).length;
  score += Math.min((projectsWithMetrics / Math.max(resumeData.projects.length, 1)) * 30, 30);

  // Action verbs in descriptions
  const actionVerbs = ['led', 'developed', 'implemented', 'created', 'managed', 'improved', 'achieved'];
  const hasActionVerbs = resumeData.experience.some(exp =>
    actionVerbs.some(verb => 
      exp.description.toLowerCase().includes(verb) ||
      exp.achievements.some(achievement => achievement.toLowerCase().includes(verb))
    )
  );
  if (hasActionVerbs) score += 30;

  return Math.min(score, 100);
}

function generateSuggestions(
  resumeData: ResumeData, 
  completeness: number, 
  atsScore: number, 
  impactScore: number
): string[] {
  const suggestions: string[] = [];

  if (completeness < 80) {
    if (!resumeData.personalInfo.summary) {
      suggestions.push("Add a professional summary to highlight your key qualifications");
    }
    if (resumeData.experience.length === 0) {
      suggestions.push("Add your work experience to show your professional background");
    }
    if (resumeData.education.length === 0) {
      suggestions.push("Include your educational background");
    }
    if (resumeData.skills.length === 0) {
      suggestions.push("List your technical and soft skills");
    }
  }

  if (atsScore < 80) {
    suggestions.push("Use standard section headers (Experience, Education, Skills)");
    suggestions.push("Include quantified achievements with numbers and metrics");
    suggestions.push("Ensure your contact information is complete");
  }

  if (impactScore < 80) {
    suggestions.push("Add specific metrics and results to your achievements");
    suggestions.push("Use strong action verbs to start bullet points");
    suggestions.push("Include project outcomes and business impact");
  }

  if (suggestions.length === 0) {
    suggestions.push("Your resume looks great! Consider getting feedback from a mentor");
  }

  return suggestions;
}

export function getKeywordSuggestions(): string[] {
  return [
    "leadership", "project management", "communication", "teamwork",
    "problem-solving", "analytical skills", "critical thinking", "creativity",
    "adaptability", "time management", "collaboration", "innovation",
    "strategic planning", "data analysis", "customer service", "attention to detail"
  ];
}

export function generateResumeId(): string {
  return `resume_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}