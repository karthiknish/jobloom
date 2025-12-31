import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addEducationSectionWithFont, 
  addSectionWithFont, 
  addExperienceSectionWithFont, 
  addProjectsSectionWithFont, 
  addCertificationsSection, 
  addSkillsSectionWithFont 
} from '../core/helpers';

export function generateAcademicResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const font = 'times';
  pdf.setFont(font, 'bold');
  pdf.setFontSize(20);
  pdf.text(data.personalInfo.fullName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  pdf.setFont(font, 'normal');
  pdf.setFontSize(10);
  const contactLine = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.website
  ].filter(Boolean).join('  |  ');
  pdf.text(contactLine, pageWidth / 2, currentY, { align: 'center' });
  currentY += lineHeight * 2;

  if (data.education.length > 0) {
    currentY = addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.personalInfo.summary) {
    currentY = addSectionWithFont(pdf, 'RESEARCH INTERESTS', data.personalInfo.summary, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.projects.length > 0) {
    currentY = addProjectsSectionWithFont(pdf, data.projects, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.certifications && data.certifications.length > 0) {
    currentY = addCertificationsSection(pdf, data.certifications, opts, contentWidth, currentY, lineHeight);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, font);
  }

  return currentY;
}
