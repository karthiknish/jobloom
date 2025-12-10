/**
 * Resume PDF Templates
 * 
 * Template layouts for different resume styles.
 */

import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from './types';
import {
  addHeader,
  addSection,
  addExperienceSection,
  addEducationSection,
  addSkillsSection,
  addProjectsSection,
  addSectionWithX,
  addSectionWithFont,
} from './renderers';

// ============ MODERN ============

export function generateModernResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  currentY = addHeader(pdf, data, opts, pageWidth, currentY);
  currentY += lineHeight * 2;

  if (data.personalInfo.summary) {
    currentY = addSection(pdf, 'PROFESSIONAL SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight);
  }

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight);
  }

  if (data.projects.length > 0) {
    currentY = addProjectsSection(pdf, data.projects, opts, contentWidth, currentY, lineHeight);
  }

  return currentY;
}

// ============ CLASSIC ============

export function generateClassicResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(data.personalInfo.fullName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const contactLine = `${data.personalInfo.email} • ${data.personalInfo.phone} • ${data.personalInfo.location}`;
  pdf.text(contactLine, pageWidth / 2, currentY, { align: 'center' });
  currentY += lineHeight * 2;

  if (data.personalInfo.summary) {
    currentY = addSection(pdf, 'SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight);
  }

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight);
  }

  return currentY;
}

// ============ CREATIVE ============

export function generateCreativeResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  // Sidebar design
  pdf.setFillColor(147, 51, 234);
  pdf.rect(0, 0, 60, pdf.internal.pageSize.getHeight(), 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const nameLines = pdf.splitTextToSize(data.personalInfo.fullName, 50);
  nameLines.forEach((line: string, index: number) => {
    pdf.text(line, 15, currentY + (index * 6));
  });
  currentY += nameLines.length * 6 + 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const contactInfo = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location];
  contactInfo.forEach((info, index) => {
    if (info) pdf.text(info, 15, currentY + (index * 5));
  });

  pdf.setTextColor(0, 0, 0);
  currentY = opts.margin!;
  const mainContentX = 70;
  const mainContentWidth = pageWidth - 85;

  if (data.personalInfo.summary) {
    currentY = addSectionWithX(pdf, 'ABOUT ME', data.personalInfo.summary, opts, mainContentX, mainContentWidth, currentY, lineHeight);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, mainContentWidth, currentY, lineHeight, 'helvetica', mainContentX);
  }

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, mainContentWidth, currentY, lineHeight, 'helvetica', mainContentX);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSection(pdf, data.skills, opts, mainContentWidth, currentY, lineHeight, 'helvetica', mainContentX);
  }

  return currentY;
}

// ============ EXECUTIVE ============

export function generateExecutiveResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
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

  if (data.personalInfo.summary) {
    currentY = addSectionWithFont(pdf, 'EXECUTIVE SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight, 'times');
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'times');
  }

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'times');
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'times');
  }

  return currentY;
}

// ============ TECHNICAL ============

export function generateTechnicalResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(16);
  pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
  currentY += 8;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(10);
  pdf.text(`${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`, opts.margin!, currentY);
  currentY += lineHeight * 2;

  if (data.personalInfo.summary) {
    currentY = addSectionWithFont(pdf, 'TECHNICAL SUMMARY', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  // Skills first for technical resume
  if (data.skills.length > 0) {
    currentY = addSkillsSection(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.projects.length > 0) {
    currentY = addProjectsSection(pdf, data.projects, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  return currentY;
}
