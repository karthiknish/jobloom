import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  getColorScheme, 
  applyFillColor, 
  applyTextColor, 
  addExperienceSectionWithX 
} from '../core/helpers';

export function generateDesignerResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyFillColor(pdf, colors.primary);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text(data.personalInfo.fullName, opts.margin!, 25);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.personalInfo.email + ' | ' + data.personalInfo.phone, opts.margin!, 32);
  
  currentY = 55;
  applyTextColor(pdf, colors.text);

  const col1Width = contentWidth * 0.35;
  const col2X = opts.margin! + col1Width + 10;
  const col2Width = contentWidth - col1Width - 10;

  let col1Y = currentY;
  let col2Y = currentY;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  applyTextColor(pdf, colors.primary);
  pdf.text('SKILLS', opts.margin!, col1Y);
  col1Y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  applyTextColor(pdf, colors.text);
  data.skills.forEach(group => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(group.category, opts.margin!, col1Y);
    col1Y += 5;
    pdf.setFont('helvetica', 'normal');
    group.skills.forEach(s => {
      pdf.text(`• ${s}`, opts.margin! + 2, col1Y);
      col1Y += 4;
    });
    col1Y += 3;
  });

  if (data.education.length > 0) {
    col1Y += 5;
    pdf.setFont('helvetica', 'bold');
    applyTextColor(pdf, colors.primary);
    pdf.text('EDUCATION', opts.margin!, col1Y);
    col1Y += 6;
    applyTextColor(pdf, colors.text);
    data.education.forEach(edu => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(edu.degree, opts.margin!, col1Y);
      col1Y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.text(edu.institution, opts.margin!, col1Y);
      col1Y += 5;
    });
  }

  if (data.personalInfo.summary) {
     pdf.setFont('helvetica', 'bold');
     pdf.setFontSize(11);
     applyTextColor(pdf, colors.primary);
     pdf.text('SUMMARY', col2X, col2Y);
     col2Y += 6;
     applyTextColor(pdf, colors.text);
     pdf.setFont('helvetica', 'normal');
     pdf.setFontSize(9);
     const lines = pdf.splitTextToSize(data.personalInfo.summary, col2Width);
     lines.forEach((line: string) => {
       pdf.text(line, col2X, col2Y);
       col2Y += 4.5;
     });
     col2Y += 5;
  }

  if (data.experience.length > 0) {
    col2Y = addExperienceSectionWithX(pdf, data.experience, opts, col2X, col2Width, col2Y, lineHeight);
  }

  return Math.max(col1Y, col2Y);
}
