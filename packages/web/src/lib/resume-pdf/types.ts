/**
 * Resume PDF Types
 */

export interface ResumePDFOptions {
  template?: 'modern' | 'classic' | 'creative' | 'minimal' | 'executive' | 'academic' | 'tech' | 'startup' | 'technical';
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

export const DEFAULT_OPTIONS: ResumePDFOptions = {
  template: 'modern',
  fontSize: 11,
  lineHeight: 1.4,
  margin: 15,
  font: 'helvetica',
  includePhoto: false,
  colorScheme: 'hireall'
};
