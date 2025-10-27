/**
 * Resume PDF Generation Utility
 * Provides functionality to generate professional PDF resumes with multiple templates
 */

import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';

export interface ResumePDFOptions {
  template?: 'modern' | 'classic' | 'creative' | 'minimal' | 'executive' | 'academic' | 'tech' | 'startup' | 'technical';
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
  font?: 'helvetica' | 'times' | 'courier';
  includePhoto?: boolean;
  colorScheme?: 'blue' | 'gray' | 'green' | 'purple' | 'orange';
}

export interface ResumeMetadata {
  candidateName: string;
  targetJobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  generatedDate: string;
}

export class ResumePDFGenerator {
  private static readonly DEFAULT_OPTIONS: ResumePDFOptions = {
    template: 'modern',
    fontSize: 11,
    lineHeight: 1.4,
    margin: 15,
    font: 'helvetica',
    includePhoto: false,
    colorScheme: 'blue'
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
        currentY = this.generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'classic':
        currentY = this.generateClassicResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'creative':
        currentY = this.generateCreativeResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'executive':
        currentY = this.generateExecutiveResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'technical':
        currentY = this.generateTechnicalResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      default:
        currentY = this.generateModernResume(pdf, resumeData, opts, pageWidth, contentWidth, currentY, lineHeight);
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
   * Modern Resume Template
   */
  private static generateModernResume(
    pdf: jsPDF,
    data: ResumeData,
    opts: ResumePDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Header with name and contact
    currentY = this.addHeader(pdf, data, opts, pageWidth, currentY);
    currentY += lineHeight * 2;

    // Summary
    if (data.personalInfo.summary) {
      currentY = this.addSection(pdf, 'PROFESSIONAL SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight);
    }

    // Experience
    if (data.experience.length > 0) {
      currentY = this.addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight);
    }

    // Education
    if (data.education.length > 0) {
      currentY = this.addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight);
    }

    // Skills
    if (data.skills.length > 0) {
      currentY = this.addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight);
    }

    // Projects
    if (data.projects.length > 0) {
      currentY = this.addProjectsSection(pdf, data.projects, opts, contentWidth, currentY, lineHeight);
    }

    return currentY;
  }

  /**
   * Classic Resume Template
   */
  private static generateClassicResume(
    pdf: jsPDF,
    data: ResumeData,
    opts: ResumePDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Classic centered header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(data.personalInfo.fullName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const contactLine = `${data.personalInfo.email} • ${data.personalInfo.phone} • ${data.personalInfo.location}`;
    pdf.text(contactLine, pageWidth / 2, currentY, { align: 'center' });
    currentY += lineHeight * 2;

    // Classic sections
    if (data.personalInfo.summary) {
      currentY = this.addSection(pdf, 'SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight);
    }

    if (data.experience.length > 0) {
      currentY = this.addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight);
    }

    if (data.education.length > 0) {
      currentY = this.addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight);
    }

    if (data.skills.length > 0) {
      currentY = this.addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight);
    }

    return currentY;
  }

  /**
   * Creative Resume Template
   */
  private static generateCreativeResume(
    pdf: jsPDF,
    data: ResumeData,
    opts: ResumePDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Creative header with side bar design
    pdf.setFillColor(147, 51, 234); // Purple
    pdf.rect(0, 0, 60, pdf.internal.pageSize.getHeight(), 'F');

    // Name in sidebar
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    const nameLines = pdf.splitTextToSize(data.personalInfo.fullName, 50);
    nameLines.forEach((line: string, index: number) => {
      pdf.text(line, 15, currentY + (index * 6));
    });
    currentY += nameLines.length * 6 + 10;

    // Contact info in sidebar
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const contactInfo = [
      data.personalInfo.email,
      data.personalInfo.phone,
      data.personalInfo.location
    ];
    contactInfo.forEach((info, index) => {
      if (info) pdf.text(info, 15, currentY + (index * 5));
    });

    // Main content
    pdf.setTextColor(0, 0, 0);
    currentY = opts.margin!;
    const mainContentX = 70;
    const mainContentWidth = pageWidth - 85;

    if (data.personalInfo.summary) {
      currentY = this.addSectionWithX(pdf, 'ABOUT ME', data.personalInfo.summary, opts, mainContentX, mainContentWidth, currentY, lineHeight);
    }

    if (data.experience.length > 0) {
      currentY = this.addExperienceSectionWithX(pdf, data.experience, opts, mainContentX, mainContentWidth, currentY, lineHeight);
    }

    if (data.education.length > 0) {
      currentY = this.addEducationSectionWithX(pdf, data.education, opts, mainContentX, mainContentWidth, currentY, lineHeight);
    }

    if (data.skills.length > 0) {
      currentY = this.addSkillsSectionWithX(pdf, data.skills, opts, mainContentX, mainContentWidth, currentY, lineHeight);
    }

    return currentY;
  }

  /**
   * Executive Resume Template
   */
  private static generateExecutiveResume(
    pdf: jsPDF,
    data: ResumeData,
    opts: ResumePDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Executive header with professional styling
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
    currentY += 10;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(data.personalInfo.email, opts.margin!, currentY);
    currentY += 5;
    pdf.text(data.personalInfo.phone, opts.margin!, currentY);
    currentY += 5;
    pdf.text(data.personalInfo.location, opts.margin!, currentY);
    currentY += lineHeight * 2;

    // Executive summary
    if (data.personalInfo.summary) {
      currentY = this.addSectionWithFont(pdf, 'EXECUTIVE SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight, 'times');
    }

    // Professional experience
    if (data.experience.length > 0) {
      currentY = this.addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'times');
    }

    // Education
    if (data.education.length > 0) {
      currentY = this.addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'times');
    }

    // Core competencies (skills)
    if (data.skills.length > 0) {
      currentY = this.addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'times');
    }

    return currentY;
  }

  /**
   * Technical Resume Template
   */
  private static generateTechnicalResume(
    pdf: jsPDF,
    data: ResumeData,
    opts: ResumePDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Technical header
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(16);
    pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
    currentY += 8;

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`, opts.margin!, currentY);
    currentY += lineHeight * 2;

    // Technical summary
    if (data.personalInfo.summary) {
      currentY = this.addSectionWithFont(pdf, 'TECHNICAL SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight, 'courier');
    }

    // Skills first for technical resume
    if (data.skills.length > 0) {
      currentY = this.addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'courier');
    }

    // Technical experience
    if (data.experience.length > 0) {
      currentY = this.addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'courier');
    }

    // Education
    if (data.education.length > 0) {
      currentY = this.addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'courier');
    }

    // Technical projects
    if (data.projects.length > 0) {
      currentY = this.addProjectsSectionWithFont(pdf, data.projects, opts, contentWidth, currentY, lineHeight, 'courier');
    }

    return currentY;
  }

  /**
   * Helper methods for adding sections
   */
  private static addHeader(pdf: jsPDF, data: ResumeData, opts: ResumePDFOptions, pageWidth: number, currentY: number): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
    currentY += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const contactInfo = [
      data.personalInfo.email,
      data.personalInfo.phone,
      data.personalInfo.location
    ];

    contactInfo.forEach(info => {
      if (info) {
        pdf.text(info, opts.margin!, currentY);
        currentY += 5;
      }
    });

    // Social links
    const socialLinks = [
      { label: 'LinkedIn', url: data.personalInfo.linkedin },
      { label: 'GitHub', url: data.personalInfo.github },
      { label: 'Website', url: data.personalInfo.website }
    ];

    const validLinks = socialLinks.filter(link => link.url);
    if (validLinks.length > 0) {
      currentY += 3;
      validLinks.forEach(link => {
        pdf.text(`${link.label}: ${link.url}`, opts.margin!, currentY);
        currentY += 5;
      });
    }

    return currentY;
  }

  private static addSection(
    pdf: jsPDF,
    title: string,
    content: string,
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(opts.fontSize!);
    
    const lines = pdf.splitTextToSize(content, contentWidth);
    lines.forEach((line: string) => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
        pdf.addPage();
        currentY = opts.margin!;
      }
      pdf.text(line, opts.margin!, currentY);
      currentY += lineHeight;
    });

    currentY += lineHeight;
    return currentY;
  }

  private static addExperienceSection(
    pdf: jsPDF,
    experience: ResumeData['experience'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('PROFESSIONAL EXPERIENCE', opts.margin!, currentY);
    currentY += lineHeight;

    experience.forEach(exp => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`${exp.position} | ${exp.company}`, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
      pdf.text(dateText, opts.margin!, currentY);
      currentY += lineHeight;

      if (exp.description) {
        const descLines = pdf.splitTextToSize(exp.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });
      }

      exp.achievements.forEach(achievement => {
        if (achievement.trim()) {
          pdf.text(`• ${achievement}`, opts.margin! + 3, currentY);
          currentY += lineHeight * 0.8;
        }
      });

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addEducationSection(
    pdf: jsPDF,
    education: ResumeData['education'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('EDUCATION', opts.margin!, currentY);
    currentY += lineHeight;

    education.forEach(edu => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`${edu.degree} in ${edu.field}`, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(edu.institution, opts.margin!, currentY);
      currentY += lineHeight;

      const dateText = `Graduated: ${edu.graduationDate}`;
      pdf.text(dateText, opts.margin!, currentY);
      currentY += lineHeight;

      if (edu.gpa) {
        pdf.text(`GPA: ${edu.gpa}`, opts.margin!, currentY);
        currentY += lineHeight;
      }

      if (edu.honors) {
        pdf.text(edu.honors, opts.margin!, currentY);
        currentY += lineHeight;
      }

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addSkillsSection(
    pdf: jsPDF,
    skills: ResumeData['skills'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SKILLS', opts.margin!, currentY);
    currentY += lineHeight;

    skills.forEach(skillGroup => {
      if (skillGroup.skills.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(skillGroup.category, opts.margin!, currentY);
        currentY += lineHeight;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const skillsText = skillGroup.skills.join(' | ');
        const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
        skillsLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });

        currentY += lineHeight * 0.5;
      }
    });

    return currentY;
  }

  private static addProjectsSection(
    pdf: jsPDF,
    projects: ResumeData['projects'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('PROJECTS', opts.margin!, currentY);
    currentY += lineHeight;

    projects.forEach(project => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(project.name, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      if (project.technologies.length > 0) {
        const techText = `Technologies: ${project.technologies.join(', ')}`;
        pdf.text(techText, opts.margin!, currentY);
        currentY += lineHeight;
      }

      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });
      }

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  // Additional helper methods for different templates
  private static addSectionWithX(
    pdf: jsPDF,
    title: string,
    content: string,
    opts: ResumePDFOptions,
    x: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, x, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(opts.fontSize!);
    
    const lines = pdf.splitTextToSize(content, contentWidth);
    lines.forEach((line: string) => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
        pdf.addPage();
        currentY = opts.margin!;
      }
      pdf.text(line, x, currentY);
      currentY += lineHeight;
    });

    currentY += lineHeight;
    return currentY;
  }

  private static addSectionWithFont(
    pdf: jsPDF,
    title: string,
    content: string,
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number,
    font: 'helvetica' | 'times' | 'courier'
  ): number {
    pdf.setFont(font, 'bold');
    pdf.setFontSize(12);
    pdf.text(title, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(opts.fontSize!);
    
    const lines = pdf.splitTextToSize(content, contentWidth);
    lines.forEach((line: string) => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
        pdf.addPage();
        currentY = opts.margin!;
      }
      pdf.text(line, opts.margin!, currentY);
      currentY += lineHeight;
    });

    currentY += lineHeight;
    return currentY;
  }

  private static addExperienceSectionWithX(
    pdf: jsPDF,
    experience: ResumeData['experience'],
    opts: ResumePDFOptions,
    x: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('PROFESSIONAL EXPERIENCE', x, currentY);
    currentY += lineHeight;

    experience.forEach(exp => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`${exp.position} | ${exp.company}`, x, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
      pdf.text(dateText, x, currentY);
      currentY += lineHeight;

      if (exp.description) {
        const descLines = pdf.splitTextToSize(exp.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, x, currentY);
          currentY += lineHeight * 0.8;
        });
      }

      exp.achievements.forEach(achievement => {
        if (achievement.trim()) {
          pdf.text(`• ${achievement}`, x + 3, currentY);
          currentY += lineHeight * 0.8;
        }
      });

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addExperienceSectionWithFont(
    pdf: jsPDF,
    experience: ResumeData['experience'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number,
    font: 'helvetica' | 'times' | 'courier'
  ): number {
    pdf.setFont(font, 'bold');
    pdf.setFontSize(12);
    pdf.text('PROFESSIONAL EXPERIENCE', opts.margin!, currentY);
    currentY += lineHeight;

    experience.forEach(exp => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont(font, 'bold');
      pdf.setFontSize(11);
      pdf.text(`${exp.position} | ${exp.company}`, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont(font, 'normal');
      pdf.setFontSize(10);
      const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
      pdf.text(dateText, opts.margin!, currentY);
      currentY += lineHeight;

      if (exp.description) {
        const descLines = pdf.splitTextToSize(exp.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });
      }

      exp.achievements.forEach(achievement => {
        if (achievement.trim()) {
          pdf.text(`• ${achievement}`, opts.margin! + 3, currentY);
          currentY += lineHeight * 0.8;
        }
      });

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addEducationSectionWithX(
    pdf: jsPDF,
    education: ResumeData['education'],
    opts: ResumePDFOptions,
    x: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('EDUCATION', x, currentY);
    currentY += lineHeight;

    education.forEach(edu => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`${edu.degree} in ${edu.field}`, x, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(edu.institution, x, currentY);
      currentY += lineHeight;

      const dateText = `Graduated: ${edu.graduationDate}`;
      pdf.text(dateText, x, currentY);
      currentY += lineHeight;

      if (edu.gpa) {
        pdf.text(`GPA: ${edu.gpa}`, x, currentY);
        currentY += lineHeight;
      }

      if (edu.honors) {
        pdf.text(edu.honors, x, currentY);
        currentY += lineHeight;
      }

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addEducationSectionWithFont(
    pdf: jsPDF,
    education: ResumeData['education'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number,
    font: 'helvetica' | 'times' | 'courier'
  ): number {
    pdf.setFont(font, 'bold');
    pdf.setFontSize(12);
    pdf.text('EDUCATION', opts.margin!, currentY);
    currentY += lineHeight;

    education.forEach(edu => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont(font, 'bold');
      pdf.setFontSize(11);
      pdf.text(`${edu.degree} in ${edu.field}`, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont(font, 'normal');
      pdf.setFontSize(10);
      pdf.text(edu.institution, opts.margin!, currentY);
      currentY += lineHeight;

      const dateText = `Graduated: ${edu.graduationDate}`;
      pdf.text(dateText, opts.margin!, currentY);
      currentY += lineHeight;

      if (edu.gpa) {
        pdf.text(`GPA: ${edu.gpa}`, opts.margin!, currentY);
        currentY += lineHeight;
      }

      if (edu.honors) {
        pdf.text(edu.honors, opts.margin!, currentY);
        currentY += lineHeight;
      }

      currentY += lineHeight * 0.5;
    });

    return currentY;
  }

  private static addSkillsSectionWithX(
    pdf: jsPDF,
    skills: ResumeData['skills'],
    opts: ResumePDFOptions,
    x: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SKILLS', x, currentY);
    currentY += lineHeight;

    skills.forEach(skillGroup => {
      if (skillGroup.skills.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(skillGroup.category, x, currentY);
        currentY += lineHeight;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const skillsText = skillGroup.skills.join(' | ');
        const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
        skillsLines.forEach((line: string) => {
          pdf.text(line, x, currentY);
          currentY += lineHeight * 0.8;
        });

        currentY += lineHeight * 0.5;
      }
    });

    return currentY;
  }

  private static addSkillsSectionWithFont(
    pdf: jsPDF,
    skills: ResumeData['skills'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number,
    font: 'helvetica' | 'times' | 'courier'
  ): number {
    pdf.setFont(font, 'bold');
    pdf.setFontSize(12);
    pdf.text('SKILLS', opts.margin!, currentY);
    currentY += lineHeight;

    skills.forEach(skillGroup => {
      if (skillGroup.skills.length > 0) {
        pdf.setFont(font, 'bold');
        pdf.setFontSize(11);
        pdf.text(skillGroup.category, opts.margin!, currentY);
        currentY += lineHeight;

        pdf.setFont(font, 'normal');
        pdf.setFontSize(10);
        const skillsText = skillGroup.skills.join(' | ');
        const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
        skillsLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });

        currentY += lineHeight * 0.5;
      }
    });

    return currentY;
  }

  private static addProjectsSectionWithFont(
    pdf: jsPDF,
    projects: ResumeData['projects'],
    opts: ResumePDFOptions,
    contentWidth: number,
    currentY: number,
    lineHeight: number,
    font: 'helvetica' | 'times' | 'courier'
  ): number {
    pdf.setFont(font, 'bold');
    pdf.setFontSize(12);
    pdf.text('PROJECTS', opts.margin!, currentY);
    currentY += lineHeight;

    projects.forEach(project => {
      if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
        pdf.addPage();
        currentY = opts.margin!;
      }

      pdf.setFont(font, 'bold');
      pdf.setFontSize(11);
      pdf.text(project.name, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont(font, 'normal');
      pdf.setFontSize(10);
      
      if (project.technologies.length > 0) {
        const techText = `Technologies: ${project.technologies.join(', ')}`;
        pdf.text(techText, opts.margin!, currentY);
        currentY += lineHeight;
      }

      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, opts.margin!, currentY);
          currentY += lineHeight * 0.8;
        });
      }

      currentY += lineHeight * 0.5;
    });

    return currentY;
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
    // Rough estimate based on content length
    let contentLength = 0;
    
    contentLength += resumeData.personalInfo.fullName.length;
    contentLength += resumeData.personalInfo.summary?.length || 0;
    contentLength += resumeData.experience.reduce((acc, exp) => 
      acc + exp.position.length + exp.company.length + exp.description?.length || 0 + 
      exp.achievements.reduce((a, ach) => a + ach.length, 0), 0);
    contentLength += resumeData.education.reduce((acc, edu) => 
      acc + edu.degree.length + edu.field.length + edu.institution.length, 0);
    contentLength += resumeData.skills.reduce((acc, skill) => 
      acc + skill.category.length + skill.skills.reduce((a, s) => a + s.length, 0), 0);
    contentLength += resumeData.projects.reduce((acc, proj) => 
      acc + proj.name.length + proj.description?.length || 0 + 
      proj.technologies.reduce((a, t) => a + t.length, 0), 0);
    
    // Estimate: ~3KB per page + content size
    const estimatedPages = Math.ceil(contentLength / 3000);
    return estimatedPages * 3072 + contentLength;
  }
}

export default ResumePDFGenerator;
