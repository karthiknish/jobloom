/**
 * Resume PDF Generator
 * 
 * Main module for generating professional PDF resumes.
 */

import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions, ResumeMetadata, DEFAULT_OPTIONS } from './types';
import {
  generateModernResume,
  generateClassicResume,
  generateCreativeResume,
  generateExecutiveResume,
  generateTechnicalResume,
} from './templates';

export type { ResumePDFOptions, ResumeMetadata } from './types';
export type { ColorScheme, ThemeColor } from './colors';
export { getColorScheme, COLOR_SCHEMES } from './colors';

export class ResumePDFGenerator {

  static async generateResumePDF(
    resumeData: ResumeData,
    options: ResumePDFOptions = {}
  ): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (opts.margin! * 2);
    const lineHeight = opts.fontSize! * opts.lineHeight! * 0.3527;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(opts.fontSize!);

    let currentY = opts.margin!;

    switch (opts.template) {
      case 'modern':
        currentY = generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'classic':
        currentY = generateClassicResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'creative':
        currentY = generateCreativeResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'executive':
        currentY = generateExecutiveResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'technical':
        currentY = generateTechnicalResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      default:
        currentY = generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  static downloadResumePDF(pdfBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async generateAndDownloadResume(
    resumeData: ResumeData,
    filename?: string,
    options?: ResumePDFOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateResumePDF(resumeData, options);
      const candidateName = resumeData.personalInfo.fullName.replace(/\s+/g, '_');
      const defaultFilename = `${candidateName}_Resume_${new Date().toISOString().split('T')[0]}.pdf`;
      this.downloadResumePDF(pdfBlob, filename || defaultFilename);
    } catch (error) {
      console.error('Resume PDF generation failed:', error);
      throw new Error('Failed to generate resume PDF');
    }
  }

  static async previewResumePDF(resumeData: ResumeData, options?: ResumePDFOptions): Promise<void> {
    try {
      const pdfBlob = await this.generateResumePDF(resumeData, options);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Resume PDF preview failed:', error);
      throw new Error('Failed to generate resume PDF preview');
    }
  }

  static validateResumeData(resumeData: ResumeData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!resumeData.personalInfo.fullName || resumeData.personalInfo.fullName.trim().length === 0) {
      errors.push('Full name is required');
    }
    
    if (!resumeData.personalInfo.email || resumeData.personalInfo.email.trim().length === 0) {
      errors.push('Email is required');
    }
    
    if (!resumeData.experience || resumeData.experience.length === 0) {
      errors.push('At least one experience entry is required');
    }
    
    if (!resumeData.education || resumeData.education.length === 0) {
      errors.push('At least one education entry is required');
    }
    
    if (!resumeData.skills || resumeData.skills.length === 0) {
      errors.push('At least one skills category is required');
    }
    
    return { valid: errors.length === 0, errors };
  }

  static estimateFileSize(resumeData: ResumeData): number {
    let contentLength = 0;
    
    contentLength += resumeData.personalInfo.fullName.length;
    contentLength += resumeData.personalInfo.summary?.length || 0;
    contentLength += resumeData.experience.reduce((acc, exp) => 
      acc + exp.position.length + exp.company.length + (exp.description?.length || 0) + 
      exp.achievements.reduce((a, ach) => a + ach.length, 0), 0);
    contentLength += resumeData.education.reduce((acc, edu) => 
      acc + edu.degree.length + edu.field.length + edu.institution.length, 0);
    contentLength += resumeData.skills.reduce((acc, skill) => 
      acc + skill.category.length + skill.skills.reduce((a, s) => a + s.length, 0), 0);
    contentLength += resumeData.projects.reduce((acc, proj) => 
      acc + proj.name.length + (proj.description?.length || 0) + 
      proj.technologies.reduce((a, t) => a + t.length, 0), 0);
    
    const estimatedPages = Math.ceil(contentLength / 3000);
    return estimatedPages * 3072 + contentLength;
  }
}

export default ResumePDFGenerator;
