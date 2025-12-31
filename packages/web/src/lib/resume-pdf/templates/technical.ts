import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addSectionWithFont, 
  addSkillsSectionWithFont, 
  addExperienceSectionWithFont, 
  addEducationSectionWithFont, 
  addProjectsSectionWithFont 
} from '../core/helpers';

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

  if (data.skills.length > 0) {
    currentY = addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.education.length > 0) {
    currentY = addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  if (data.projects.length > 0) {
    currentY = addProjectsSectionWithFont(pdf, data.projects, opts, contentWidth, currentY, lineHeight, 'courier');
  }

  return currentY;
}
