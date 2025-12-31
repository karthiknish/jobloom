export interface ResumeGeneratorFormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: "entry" | "mid" | "senior" | "executive";
  style: string;
  includeObjective: boolean;
}

export interface GeneratedResume {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  summary?: string;
  experience?: string;
  skills?: string;
  education?: string;
  atsScore: number;
  keywords: string[];
  suggestions: string[];
  wordCount: number;
  source?: 'gemini' | 'fallback' | 'mock';
}
