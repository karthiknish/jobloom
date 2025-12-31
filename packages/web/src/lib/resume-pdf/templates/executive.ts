import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addSectionWithFont, 
  addExperienceSectionWithFont, 
  addEducationSectionWithFont, 
  addSkillsSectionWithFont 
} from '../core/helpers';

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
    currentY = addExperienceSectionWithFont(pdf, data.experience, opts, contentWidth, currentY, lineHeight, 'times');
  }

  if (data.education.length > 0) {
    currentY = addEducationSectionWithFont(pdf, data.education, opts, contentWidth, currentY, lineHeight, 'times');
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSectionWithFont(pdf, data.skills, opts, contentWidth, currentY, lineHeight, 'times');
  }

  return currentY;
}
