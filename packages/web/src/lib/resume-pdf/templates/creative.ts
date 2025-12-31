import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addSectionWithX, 
  addExperienceSectionWithX, 
  addEducationSectionWithX, 
  addSkillsSectionWithX 
} from '../core/helpers';

export function generateCreativeResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFillColor(147, 51, 234); // Purple
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
  const contactInfo = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location
  ];
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
    currentY = addExperienceSectionWithX(pdf, data.experience, opts, mainContentX, mainContentWidth, currentY, lineHeight);
  }

  if (data.education.length > 0) {
    currentY = addEducationSectionWithX(pdf, data.education, opts, mainContentX, mainContentWidth, currentY, lineHeight);
  }

  if (data.skills.length > 0) {
    currentY = addSkillsSectionWithX(pdf, data.skills, opts, mainContentX, mainContentWidth, currentY, lineHeight);
  }

  return currentY;
}
