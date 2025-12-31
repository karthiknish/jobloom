import { ResumeData } from '@/types/resume';

export interface ThemeColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorScheme {
  primary: ThemeColor;
  secondary: ThemeColor;
  accent: ThemeColor;
  text: ThemeColor;
  textLight: ThemeColor;
  background: ThemeColor;
  border: ThemeColor;
}

export interface ResumePDFOptions {
  template?: 'modern' | 'classic' | 'creative' | 'executive' | 'technical' | 'academic' | 'startup' | 'designer' | 'healthcare' | 'legal';
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
  font?: 'helvetica' | 'times' | 'courier';
  includePhoto?: boolean;
  colorScheme?: 'hireall' | 'blue' | 'gray' | 'green' | 'purple' | 'orange';
}

export interface ResumeMetadata {
  candidateName: string;
  targetJobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  generatedDate: string;
}
