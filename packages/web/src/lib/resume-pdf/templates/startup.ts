import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  getColorScheme, 
  applyFillColor, 
  applyTextColor 
} from '../core/colors';

export function generateStartupResume(
  pdf: jsPDF,
  data: ResumeData,
  opts: ResumePDFOptions,
  pageWidth: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const sidebarWidth = 65;
  const colors = getColorScheme(opts.colorScheme);

  applyFillColor(pdf, colors.background);
  pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.getHeight(), 'F');

  let sidebarY = opts.margin!;
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const nameLines = pdf.splitTextToSize(data.personalInfo.fullName, sidebarWidth - 15);
  nameLines.forEach((line: string) => {
    pdf.text(line, 10, sidebarY);
    sidebarY += 6;
  });
  sidebarY += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  applyTextColor(pdf, colors.text);
  const contacts = [
    { prefix: 'E: ', val: data.personalInfo.email },
    { prefix: 'P: ', val: data.personalInfo.phone },
    { prefix: 'L: ', val: data.personalInfo.location }
  ];
  contacts.forEach(c => {
    if (c.val) {
      pdf.text(`${c.prefix}${c.val}`, 10, sidebarY);
      sidebarY += 5;
    }
  });
  sidebarY += 10;

  if (data.skills.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    applyTextColor(pdf, colors.primary);
    pdf.text('CORE SKILLS', 10, sidebarY);
    sidebarY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    applyTextColor(pdf, colors.text);
    data.skills.forEach(group => {
      group.skills.forEach(skill => {
        if (sidebarY < pdf.internal.pageSize.getHeight() - 10) {
          pdf.text(`• ${skill}`, 12, sidebarY);
          sidebarY += 4;
        }
      });
    });
  }

  let mainY = opts.margin!;
  const mainX = sidebarWidth + 10;
  const mainWidth = pageWidth - sidebarWidth - 20;

  if (data.personalInfo.summary) {
    applyTextColor(pdf, colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('SUMMARY', mainX, mainY);
    mainY += 6;
    applyTextColor(pdf, colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const summaryLines = pdf.splitTextToSize(data.personalInfo.summary, mainWidth);
    summaryLines.forEach((line: string) => {
       pdf.text(line, mainX, mainY);
       mainY += 4.5;
    });
    mainY += 8;
  }

  if (data.experience.length > 0) {
    applyTextColor(pdf, colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('EXPERIENCE', mainX, mainY);
    mainY += 6;
    data.experience.forEach(exp => {
      if (mainY > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        mainY = opts.margin!;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      applyTextColor(pdf, colors.text);
      pdf.text(`${exp.position}`, mainX, mainY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`${exp.company}`, pageWidth - 10, mainY, { align: 'right' });
      mainY += 5;
      applyTextColor(pdf, colors.textLight);
      pdf.text(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, mainX, mainY);
      mainY += 5;
      applyTextColor(pdf, colors.text);
      if (exp.description) {
         const lines = pdf.splitTextToSize(exp.description, mainWidth);
         lines.forEach((line: string) => {
           pdf.text(line, mainX, mainY);
           mainY += 4;
         });
      }
      exp.achievements.forEach(ach => {
        const lines = pdf.splitTextToSize(`• ${ach}`, mainWidth - 4);
        lines.forEach((line: string) => {
          pdf.text(line, mainX + 2, mainY);
          mainY += 4;
        });
      });
      mainY += 4;
    });
  }

  if (data.education.length > 0) {
    applyTextColor(pdf, colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('EDUCATION', mainX, mainY);
    mainY += 6;
    data.education.forEach(edu => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      applyTextColor(pdf, colors.text);
      pdf.text(`${edu.degree}`, mainX, mainY);
      mainY += 4.5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${edu.institution}`, mainX, mainY);
      mainY += 4.5;
    });
  }

  return Math.max(sidebarY, mainY);
}
