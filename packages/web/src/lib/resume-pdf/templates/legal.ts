import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addEducationSectionWithFont, 
  addExperienceSectionWithFont, 
  addSkillsSectionWithFont 
} from '../core/helpers';

export function generateLegalResume(
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
  pdf.setFontSize(14);
  pdf.text(data.personalInfo.fullName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFont(font, 'normal');
  pdf.setFontSize(10);
  pdf.text(`${data.personalInfo.location} | ${data.personalInfo.phone} | ${data.personalInfo.email}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;

  if (data.education.length > 0) {
    currentY = addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, font);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, font);
  }

  return currentY;
}
