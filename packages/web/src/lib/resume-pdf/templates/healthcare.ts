import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  getColorScheme, 
  applyTextColor, 
  addEducationSection, 
  addCertificationsSection, 
  addExperienceSection 
} from '../core/helpers';

export function generateHealthcareResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme('green'); // Default to medical green
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  applyTextColor(pdf, colors.text);
  pdf.text(`${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`, opts.margin!, currentY);
  currentY += 10;

  if (data.education.length > 0) {
    currentY = addEducationSection(pdf, data.education, opts, contentWidth, currentY, lineHeight);
  }

  if (data.certifications && data.certifications.length > 0) {
    currentY = addCertificationsSection(pdf, data.certifications, opts, contentWidth, currentY, lineHeight);
  }

  if (data.experience.length > 0) {
    currentY = addExperienceSection(pdf, data.experience, opts, contentWidth, currentY, lineHeight);
  }

  return currentY;
}
