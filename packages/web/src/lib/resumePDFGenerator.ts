/**
 * Resume PDF Generation Utility
 * Provides functionality to generate professional PDF resumes with multiple templates
 * Uses Hireall brand colors for consistent theming
 */

import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions, ResumeMetadata } from './resume-pdf/core/types';
import { getColorScheme, applyTextColor } from './resume-pdf/core/colors';
import * as templates from './resume-pdf/templates';

export class ResumePDFGenerator {
  private static readonly DEFAULT_OPTIONS: ResumePDFOptions = {
    template: 'modern',
    fontSize: 11,
    lineHeight: 1.4,
    margin: 15,
    font: 'helvetica',
    includePhoto: false,
    colorScheme: 'hireall'
  };

  /**
   * Generate a professional PDF resume from resume data
   */
  static async generateResumePDF(
    resumeData: ResumeData,
    options: ResumePDFOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (opts.margin! * 2);
    const lineHeight = opts.fontSize! * opts.lineHeight! * 0.3527; // Convert to mm

    // Set font
    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(opts.fontSize!);

    let currentY = opts.margin!;

    // Generate resume based on template
    switch (opts.template) {
      case 'modern':
        currentY = templates.generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'classic':
        currentY = templates.generateClassicResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'creative':
        currentY = templates.generateCreativeResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'executive':
        currentY = templates.generateExecutiveResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'technical':
        currentY = templates.generateTechnicalResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'academic':
        currentY = templates.generateAcademicResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'startup':
        currentY = templates.generateStartupResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'designer':
        currentY = templates.generateDesignerResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'healthcare':
        currentY = templates.generateHealthcareResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'legal':
        currentY = templates.generateLegalResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      default:
        currentY = templates.generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Download the generated resume PDF
   */
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

  /**
   * Generate and download resume PDF in one step
   */
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

  /**
   * Preview resume PDF in new tab
   */
  static async previewResumePDF(resumeData: ResumeData, options?: ResumePDFOptions): Promise<void> {
    try {
      const pdfBlob = await this.generateResumePDF(resumeData, options);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000); // Revoke after 1 minute
    } catch (error) {
      console.error('Resume PDF preview failed:', error);
      throw new Error('Failed to generate resume PDF preview');
    }
  }

  /**
   * Generate a resume PDF from raw text (used for edited resumes)
   */
  static async generateRawResumePDF(
    content: string,
    metadata: ResumeMetadata,
    options: ResumePDFOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (opts.margin! * 2);
    const lineHeight = opts.fontSize! * opts.lineHeight! * 0.3527;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(opts.fontSize!);

    let currentY = opts.margin!;

    const colors = getColorScheme(opts.colorScheme);
    applyTextColor(pdf, colors.primary);
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(22);
    pdf.text(metadata.candidateName, opts.margin!, currentY);
    currentY += 12;

    applyTextColor(pdf, colors.text);
    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(opts.fontSize!);

    const paragraphs = content.split('\n');
    
    for (const line of paragraphs) {
      if (!line.trim() && line !== '') {
        currentY += lineHeight * 0.5;
        continue;
      }

      const wrappedLines = pdf.splitTextToSize(line, contentWidth);
      
      for (const wrappedLine of wrappedLines) {
        if (currentY > pageHeight - opts.margin! - 10) {
          pdf.addPage();
          currentY = opts.margin!;
        }
        pdf.text(wrappedLine, opts.margin!, currentY);
        currentY += lineHeight;
      }
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Generate and download raw resume PDF
   */
  static async generateAndDownloadRawResume(
    content: string,
    metadata: ResumeMetadata,
    options?: ResumePDFOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateRawResumePDF(content, metadata, options);
      const filename = `${metadata.candidateName.replace(/\s+/g, '_')}_Resume_Edited_${new Date().toISOString().split('T')[0]}.pdf`;
      this.downloadResumePDF(pdfBlob, filename);
    } catch (error) {
      console.error('Raw Resume PDF generation failed:', error);
      throw new Error('Failed to generate raw resume PDF');
    }
  }

  /**
   * Preview raw resume PDF
   */
  static async previewRawResumePDF(
    content: string,
    metadata: ResumeMetadata,
    options?: ResumePDFOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateRawResumePDF(content, metadata, options);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Raw Resume PDF preview failed:', error);
      throw new Error('Failed to generate raw resume PDF preview');
    }
  }

  /**
   * Validate resume data for PDF generation
   */
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
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get estimated PDF file size before generation
   */
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
export * from './resume-pdf/core/types';
