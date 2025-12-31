import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';
import { ResumePDFOptions } from './types';
import { getColorScheme, applyTextColor, applyDrawColor, applyFillColor } from './colors';
export { getColorScheme, applyTextColor, applyFillColor, applyDrawColor };

export function addHeader(pdf: jsPDF, data: ResumeData, opts: ResumePDFOptions, pageWidth: number, currentY: number): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text(data.personalInfo.fullName, opts.margin!, currentY);
  currentY += 10;

  applyDrawColor(pdf, colors.primary);
  pdf.setLineWidth(0.5);
  pdf.line(opts.margin!, currentY, opts.margin! + 50, currentY);
  currentY += 5;

  applyTextColor(pdf, colors.textLight);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const contactInfo = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location
  ].filter(Boolean);

  if (contactInfo.length > 0) {
    pdf.text(contactInfo.join('  •  '), opts.margin!, currentY);
    currentY += 6;
  }

  const socialLinks = [
    { label: 'LinkedIn', url: data.personalInfo.linkedin },
    { label: 'GitHub', url: data.personalInfo.github },
    { label: 'Website', url: data.personalInfo.website }
  ].filter(link => link.url);

  if (socialLinks.length > 0) {
    applyTextColor(pdf, colors.secondary);
    pdf.setFontSize(9);
    const linksText = socialLinks.map(link => `${link.label}: ${link.url}`).join('  |  ');
    pdf.text(linksText, opts.margin!, currentY);
    currentY += 5;
  }

  applyTextColor(pdf, colors.text);
  return currentY;
}

export function addSection(
  pdf: jsPDF,
  title: string,
  content: string,
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, opts.margin!, currentY);
  currentY += lineHeight;
  
  applyDrawColor(pdf, colors.accent);
  pdf.setLineWidth(0.3);
  pdf.line(opts.margin!, currentY - lineHeight + 5, opts.margin! + 40, currentY - lineHeight + 5);

  applyTextColor(pdf, colors.text);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(opts.fontSize!);
  
  const lines = pdf.splitTextToSize(content, contentWidth);
  lines.forEach((line: string) => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
      pdf.addPage();
      currentY = opts.margin!;
    }
    pdf.text(line, opts.margin!, currentY);
    currentY += lineHeight;
  });

  currentY += lineHeight;
  return currentY;
}

export function addSectionWithX(
  pdf: jsPDF,
  title: string,
  content: string,
  opts: ResumePDFOptions,
  x: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, x, currentY);
  currentY += lineHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(opts.fontSize!);
  
  const lines = pdf.splitTextToSize(content, contentWidth);
  lines.forEach((line: string) => {
    if (currentY > pdf.internal.pageSize.getHeight() - pdf.internal.pageSize.getHeight() * 0.1) {
      pdf.addPage();
      currentY = opts.margin!;
    }
    pdf.text(line, x, currentY);
    currentY += lineHeight;
  });

  currentY += lineHeight;
  return currentY;
}

export function addSectionWithFont(
  pdf: jsPDF,
  title: string,
  content: string,
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier'
): number {
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text(title, opts.margin!, currentY);
  currentY += lineHeight;

  pdf.setFont(font, 'normal');
  pdf.setFontSize(opts.fontSize!);
  
  const lines = pdf.splitTextToSize(content, contentWidth);
  lines.forEach((line: string) => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
      pdf.addPage();
      currentY = opts.margin!;
    }
    pdf.text(line, opts.margin!, currentY);
    currentY += lineHeight;
  });

  currentY += lineHeight;
  return currentY;
}

export function addExperienceSection(
  pdf: jsPDF,
  experience: ResumeData['experience'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('PROFESSIONAL EXPERIENCE', opts.margin!, currentY);
  currentY += lineHeight;

  experience.forEach(exp => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${exp.position} | ${exp.company}`, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
    pdf.text(dateText, opts.margin!, currentY);
    currentY += lineHeight;

    if (exp.description) {
      const descLines = pdf.splitTextToSize(exp.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    exp.achievements.forEach(achievement => {
      if (achievement.trim()) {
        pdf.text(`• ${achievement}`, opts.margin! + 3, currentY);
        currentY += lineHeight * 0.8;
      }
    });

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addExperienceSectionWithX(
  pdf: jsPDF,
  experience: ResumeData['experience'],
  opts: ResumePDFOptions,
  x: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('PROFESSIONAL EXPERIENCE', x, currentY);
  currentY += lineHeight;

  experience.forEach(exp => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${exp.position} | ${exp.company}`, x, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
    pdf.text(dateText, x, currentY);
    currentY += lineHeight;

    if (exp.description) {
      const descLines = pdf.splitTextToSize(exp.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, x, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    exp.achievements.forEach(achievement => {
      if (achievement.trim()) {
        pdf.text(`• ${achievement}`, x + 3, currentY);
        currentY += lineHeight * 0.8;
      }
    });

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addExperienceSectionWithFont(
  pdf: jsPDF,
  experience: ResumeData['experience'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier'
): number {
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('PROFESSIONAL EXPERIENCE', opts.margin!, currentY);
  currentY += lineHeight;

  experience.forEach(exp => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 40) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont(font, 'bold');
    pdf.setFontSize(11);
    pdf.text(`${exp.position} | ${exp.company}`, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(10);
    const dateText = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
    pdf.text(dateText, opts.margin!, currentY);
    currentY += lineHeight;

    if (exp.description) {
      const descLines = pdf.splitTextToSize(exp.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    exp.achievements.forEach(achievement => {
      if (achievement.trim()) {
        pdf.text(`• ${achievement}`, opts.margin! + 3, currentY);
        currentY += lineHeight * 0.8;
      }
    });

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addEducationSection(
  pdf: jsPDF,
  education: ResumeData['education'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('EDUCATION', opts.margin!, currentY);
  currentY += lineHeight;

  education.forEach(edu => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${edu.degree} in ${edu.field}`, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(edu.institution, opts.margin!, currentY);
    currentY += lineHeight;

    const dateText = `Graduated: ${edu.graduationDate}`;
    pdf.text(dateText, opts.margin!, currentY);
    currentY += lineHeight;

    if (edu.gpa) {
      pdf.text(`GPA: ${edu.gpa}`, opts.margin!, currentY);
      currentY += lineHeight;
    }

    if (edu.honors) {
      pdf.text(edu.honors, opts.margin!, currentY);
      currentY += lineHeight;
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addEducationSectionWithX(
  pdf: jsPDF,
  education: ResumeData['education'],
  opts: ResumePDFOptions,
  x: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('EDUCATION', x, currentY);
  currentY += lineHeight;

  education.forEach(edu => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${edu.degree} in ${edu.field}`, x, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(edu.institution, x, currentY);
    currentY += lineHeight;

    const dateText = `Graduated: ${edu.graduationDate}`;
    pdf.text(dateText, x, currentY);
    currentY += lineHeight;

    if (edu.gpa) {
      pdf.text(`GPA: ${edu.gpa}`, x, currentY);
      currentY += lineHeight;
    }

    if (edu.honors) {
      pdf.text(edu.honors, x, currentY);
      currentY += lineHeight;
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addEducationSectionWithFont(
  pdf: jsPDF,
  education: ResumeData['education'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier'
): number {
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('EDUCATION', opts.margin!, currentY);
  currentY += lineHeight;

  education.forEach(edu => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont(font, 'bold');
    pdf.setFontSize(11);
    pdf.text(`${edu.degree} in ${edu.field}`, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(10);
    pdf.text(edu.institution, opts.margin!, currentY);
    currentY += lineHeight;

    const dateText = `Graduated: ${edu.graduationDate}`;
    pdf.text(dateText, opts.margin!, currentY);
    currentY += lineHeight;

    if (edu.gpa) {
      pdf.text(`GPA: ${edu.gpa}`, opts.margin!, currentY);
      currentY += lineHeight;
    }

    if (edu.honors) {
      pdf.text(edu.honors, opts.margin!, currentY);
      currentY += lineHeight;
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addSkillsSection(
  pdf: jsPDF,
  skills: ResumeData['skills'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('SKILLS', opts.margin!, currentY);
  currentY += lineHeight;

  skills.forEach(skillGroup => {
    if (skillGroup.skills.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(skillGroup.category, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const skillsText = skillGroup.skills.join(' | ');
      const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
      skillsLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });

      currentY += lineHeight * 0.5;
    }
  });

  return currentY;
}

export function addSkillsSectionWithX(
  pdf: jsPDF,
  skills: ResumeData['skills'],
  opts: ResumePDFOptions,
  x: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('SKILLS', x, currentY);
  currentY += lineHeight;

  skills.forEach(skillGroup => {
    if (skillGroup.skills.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(skillGroup.category, x, currentY);
      currentY += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const skillsText = skillGroup.skills.join(' | ');
      const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
      skillsLines.forEach((line: string) => {
        pdf.text(line, x, currentY);
        currentY += lineHeight * 0.8;
      });

      currentY += lineHeight * 0.5;
    }
  });

  return currentY;
}

export function addSkillsSectionWithFont(
  pdf: jsPDF,
  skills: ResumeData['skills'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier'
): number {
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('SKILLS', opts.margin!, currentY);
  currentY += lineHeight;

  skills.forEach(skillGroup => {
    if (skillGroup.skills.length > 0) {
      pdf.setFont(font, 'bold');
      pdf.setFontSize(11);
      pdf.text(skillGroup.category, opts.margin!, currentY);
      currentY += lineHeight;

      pdf.setFont(font, 'normal');
      pdf.setFontSize(10);
      const skillsText = skillGroup.skills.join(' | ');
      const skillsLines = pdf.splitTextToSize(skillsText, contentWidth);
      skillsLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });

      currentY += lineHeight * 0.5;
    }
  });

  return currentY;
}

export function addProjectsSection(
  pdf: jsPDF,
  projects: ResumeData['projects'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('PROJECTS', opts.margin!, currentY);
  currentY += lineHeight;

  projects.forEach(project => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(project.name, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    if (project.technologies.length > 0) {
      const techText = `Technologies: ${project.technologies.join(', ')}`;
      pdf.text(techText, opts.margin!, currentY);
      currentY += lineHeight;
    }

    if (project.description) {
      const descLines = pdf.splitTextToSize(project.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    const links: string[] = [];
    if (project.link) links.push(`Link: ${project.link}`);
    if (project.github) links.push(`GitHub: ${project.github}`);
    if (links.length > 0) {
      pdf.setFontSize(9);
      applyTextColor(pdf, { r: 107, g: 114, b: 128 });
      pdf.text(links.join('  •  '), opts.margin!, currentY);
      currentY += lineHeight;
      applyTextColor(pdf, { r: 31, g: 41, b: 55 });
      pdf.setFontSize(10);
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addProjectsSectionWithX(
  pdf: jsPDF,
  projects: ResumeData['projects'],
  opts: ResumePDFOptions,
  x: number,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  const colors = getColorScheme(opts.colorScheme);
  applyTextColor(pdf, colors.primary);
  pdf.text('PROJECTS', x, currentY);
  currentY += lineHeight;

  projects.forEach(project => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    applyTextColor(pdf, colors.text);
    pdf.text(project.name, x, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    if (project.technologies.length > 0) {
      const techText = `Tech: ${project.technologies.join(', ')}`;
      pdf.text(techText, x, currentY);
      currentY += lineHeight;
    }

    if (project.description) {
      const descLines = pdf.splitTextToSize(project.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, x, currentY);
        currentY += lineHeight * 0.8;
      });
    }
    currentY += lineHeight * 0.4;
  });

  return currentY;
}

export function addProjectsSectionWithFont(
  pdf: jsPDF,
  projects: ResumeData['projects'],
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number,
  font: 'helvetica' | 'times' | 'courier'
): number {
  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('PROJECTS', opts.margin!, currentY);
  currentY += lineHeight;

  projects.forEach(project => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 30) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont(font, 'bold');
    pdf.setFontSize(11);
    pdf.text(project.name, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont(font, 'normal');
    pdf.setFontSize(10);
    
    if (project.technologies.length > 0) {
      const techText = `Technologies: ${project.technologies.join(', ')}`;
      pdf.text(techText, opts.margin!, currentY);
      currentY += lineHeight;
    }

    if (project.description) {
      const descLines = pdf.splitTextToSize(project.description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, opts.margin!, currentY);
        currentY += lineHeight * 0.8;
      });
    }

    currentY += lineHeight * 0.5;
  });

  return currentY;
}

export function addCertificationsSection(
  pdf: jsPDF,
  certifications: NonNullable<ResumeData['certifications']>,
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('CERTIFICATIONS', opts.margin!, currentY);
  currentY += lineHeight;
  
  applyDrawColor(pdf, colors.accent);
  pdf.setLineWidth(0.3);
  pdf.line(opts.margin!, currentY - lineHeight + 5, opts.margin! + 40, currentY - lineHeight + 5);

  applyTextColor(pdf, colors.text);
  certifications.forEach(cert => {
    if (currentY > pdf.internal.pageSize.getHeight() - opts.margin! - 20) {
      pdf.addPage();
      currentY = opts.margin!;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(cert.name, opts.margin!, currentY);
    currentY += lineHeight;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    applyTextColor(pdf, colors.textLight);
    pdf.text(`${cert.issuer} • ${cert.date}`, opts.margin!, currentY);
    currentY += lineHeight;

    if (cert.credentialId) {
      pdf.text(`Credential ID: ${cert.credentialId}`, opts.margin!, currentY);
      currentY += lineHeight;
    }

    applyTextColor(pdf, colors.text);
    currentY += lineHeight * 0.3;
  });

  currentY += lineHeight * 0.5;
  return currentY;
}

export function addLanguagesSection(
  pdf: jsPDF,
  languages: NonNullable<ResumeData['languages']>,
  opts: ResumePDFOptions,
  contentWidth: number,
  currentY: number,
  lineHeight: number
): number {
  const colors = getColorScheme(opts.colorScheme);
  
  applyTextColor(pdf, colors.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('LANGUAGES', opts.margin!, currentY);
  currentY += lineHeight;
  
  applyDrawColor(pdf, colors.accent);
  pdf.setLineWidth(0.3);
  pdf.line(opts.margin!, currentY - lineHeight + 5, opts.margin! + 40, currentY - lineHeight + 5);

  applyTextColor(pdf, colors.text);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  const languageText = languages.map(lang => `${lang.language} (${lang.proficiency})`).join('  •  ');
  const langLines = pdf.splitTextToSize(languageText, contentWidth);
  langLines.forEach((line: string) => {
    pdf.text(line, opts.margin!, currentY);
    currentY += lineHeight;
  });

  currentY += lineHeight * 0.5;
  return currentY;
}
