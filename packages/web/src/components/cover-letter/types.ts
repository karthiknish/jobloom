import type { ResumeData } from "@/types/resume";

export type CoverLetterTone = "professional" | "enthusiastic" | "formal" | "casual";
export type CoverLetterTemplate = "modern" | "classic" | "creative" | "executive";

export interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  hiringManager: string;
  jobDescription: string;
  keyRequirements: string[];
  companyValues: string[];
  applicationDate: string;
  customOpening?: string;
  customBody?: string;
  customClosing?: string;
  tone: CoverLetterTone;
  template: CoverLetterTemplate;
  colorScheme: "hireall" | "blue" | "gray" | "green" | "purple";
}

export interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
  onGenerate?: (letter: string) => void;
}
