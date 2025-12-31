import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from '../core/types';
import { 
  addHeader, 
  addSection, 
  addExperienceSection, 
  addEducationSection, 
  addSkillsSection, 
  addProjectsSection, 
  addCertificationsSection, 
  addLanguagesSection 
} from '../core/helpers';

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

  if (data.certifications && data.certifications.length > 0) {
    currentY = addCertificationsSection(pdf, data.certifications, opts, contentWidth, currentY, lineHeight);
  }

  if (data.languages && data.languages.length > 0) {
    currentY = addLanguagesSection(pdf, data.languages, opts, contentWidth, currentY, lineHeight);
  }

  return currentY;
}
