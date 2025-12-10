/**
 * Resume PDF Section Renderers
 * 
 * Render individual sections of a resume to PDF.
 */

import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from './types';
import { getColorScheme, applyTextColor, applyDrawColor } from './colors';

export interface RenderContext {
  pdf: jsPDF;
  opts: ResumePDFOptions;
  contentWidth: number;
  currentY: number;
  lineHeight: number;
  x?: number;
  font?: 'helvetica' | 'times' | 'courier';
}

// ============ HEADER ============

export function addHeader(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  currentY: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
  currentY += 10;

  applyDrawColor(pdf, colors.primary);
  pdf.setLineWidth(0.5);
  pdf.line(opts.margin!, currentY, opts.margin! + 50, currentY);
  currentY += 5;

  applyTextColor(pdf, colors.textLight);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const contactInfo = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location
  ].filter(Boolean);

  if (contactInfo.length > 0) {
    pdf.text(contactInfo.join('  •  '), opts.margin!, currentY);
    currentY += 6;
  }

  const socialLinks = [
    { label: 'LinkedIn', url: data.personalInfo.linkedin },
    { label: 'GitHub', url: data.personalInfo.github },
    { label: 'Website', url: data.personalInfo.website }
  ].filter(link => link.url);

  if (socialLinks.length > 0) {
    applyTextColor(pdf, colors.secondary);
    pdf.setFontSize(9);
    const linksText = socialLinks.map(link => `${link.label}: ${link.url}`).join('  |  ');
    pdf.text(linksText, opts.margin!, currentY);
    currentY += 5;
  }

  applyTextColor(pdf, colors.text);
  return currentY;
}

// ============ SECTION ============

export function addSection(
  pdf: jsPDF,
  title: string,
  content: string,
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, opts.margin!, currentY);
  currentY += lineHeight;
  
  applyDrawColor(pdf, colors.accent);
  pdf.setLineWidth(0.3);
  pdf.line(opts.margin!, currentY - lineHeight + 5, opts.margin! + 40, currentY - lineHeight + 5);

  applyTextColor(pdf, colors.text);
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

// ============ EXPERIENCE ============

export function addExperienceSection(
  pdf: jsPDF,
  experience: ResumeData['experience'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier' = 'helvetica',
  x?: number
): number {
  const xPos = x ?? opts.margin!;
  
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('PROFESSIONAL EXPERIENCE', xPos, currentY);
  currentY += lineHeight;

  experience.forEach(exp => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont(font, 'bold');
    pdf.setFontSize(11);
    pdf.text(`${exp.position} | ${exp.company}`, xPos, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(10);
    const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
    pdf.text(dateText, xPos, currentY);
    currentY += lineHeight;

    if (exp.description) {
      const descLines = pdf.splitTextToSize(exp.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, xPos, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    exp.achievements.forEach(achievement => {
      if (achievement.trim()) {
        pdf.text(`• ${achievement}`, xPos + 3, currentY);
        currentY += lineHeight * 0.8;
      }
    });

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

// ============ EDUCATION ============

export function addEducationSection(
  pdf: jsPDF,
  education: ResumeData['education'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier' = 'helvetica',
  x?: number
): number {
  const xPos = x ?? opts.margin!;
  
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('EDUCATION', xPos, currentY);
  currentY += lineHeight;

  education.forEach(edu => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont(font, 'bold');
    pdf.setFontSize(11);
    pdf.text(`${edu.degree} in ${edu.field}`, xPos, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(10);
    pdf.text(edu.institution, xPos, currentY);
    currentY += lineHeight;

    pdf.text(`Graduated: ${edu.graduationDate}`, xPos, currentY);
    currentY += lineHeight;

    if (edu.gpa) {
      pdf.text(`GPA: ${edu.gpa}`, xPos, currentY);
      currentY += lineHeight;
    }

    if (edu.honors) {
      pdf.text(edu.honors, xPos, currentY);
      currentY += lineHeight;
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

// ============ SKILLS ============

export function addSkillsSection(
  pdf: jsPDF,
  skills: ResumeData['skills'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier' = 'helvetica',
  x?: number
): number {
  const xPos = x ?? opts.margin!;
  
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('SKILLS', xPos, currentY);
  currentY += lineHeight;

  skills.forEach(skillGroup => {
    if (skillGroup.skills.length > 0) {
      pdf.setFont(font, 'bold');
      pdf.setFontSize(11);
      pdf.text(skillGroup.category, xPos, currentY);
      currentY += lineHeight;

      pdf.setFont(font, 'normal');
      pdf.setFontSize(10);
      const skillsText = skillGroup.skills.join(' | ');
      const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
      skillsLines.forEach((line: string) => {
        pdf.text(line, xPos, currentY);
        currentY += lineHeight * 0.8;
      });

      currentY += lineHeight * 0.5;
    }
  });

  return currentY;
}

// ============ PROJECTS ============

export function addProjectsSection(
  pdf: jsPDF,
  projects: ResumeData['projects'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier' = 'helvetica'
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
      pdf.text(`Technologies: ${project.technologies.join(', ')}`, opts.margin!, currentY);
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

// ============ SECTION WITH X OFFSET ============

export function addSectionWithX(
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

// ============ SECTION WITH FONT ============

export function addSectionWithFont(
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
