// Shared resume-related domain types
export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string; // YYYY-MM format
  endDate: string;   // YYYY-MM format or '' if current
  current: boolean;
  description: string;
  achievements: string[]; // bullet points
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string; // YYYY-MM
  gpa?: string;
  honors?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string; // YYYY-MM-DD
  credentialId?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications?: CertificationItem[];
  languages?: LanguageItem[];
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
