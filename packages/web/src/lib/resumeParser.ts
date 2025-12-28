/**
 * Resume Text Parser
 * 
 * Extracts structured data from resume text for ATS analysis.
 * Robust parsing that handles various resume formats.
 */

import { ResumeData } from '@/types/resume';

// Section headers we look for
const SECTION_PATTERNS: Record<string, RegExp[]> = {
  contact: [
    /^(?:contact|contact\s*info(?:rmation)?|personal\s*(?:info|details))?\s*$/i,
  ],
  summary: [
    /^(?:summary|profile|professional\s*summary|career\s*(?:summary|objective)|objective|about(?:\s*me)?|executive\s*summary)$/i,
  ],
  experience: [
    /^(?:experience|work\s*(?:experience|history)|professional\s*(?:experience|background)|employment(?:\s*history)?|career\s*(?:history|experience))$/i,
  ],
  education: [
    /^(?:education|academic\s*(?:background|qualifications|history)|qualifications|educational\s*background|schooling|degrees?)$/i,
  ],
  skills: [
    /^(?:skills?|technical\s*skills?|core\s*competenc(?:y|ies)|competenc(?:y|ies)|key\s*skills?|professional\s*skills?|areas?\s*of\s*expertise)$/i,
  ],
  projects: [
    /^(?:projects?|key\s*projects?|personal\s*projects?|portfolio|notable\s*projects?)$/i,
  ],
  certifications: [
    /^(?:certifications?|certificates?|professional\s*certifications?|licenses?(?:\s*&\s*certifications?)?)$/i,
  ],
  awards: [
    /^(?:awards?|honors?|achievements?|accomplishments?|recognition)$/i,
  ],
  publications: [
    /^(?:publications?|papers?|research|published\s*works?)$/i,
  ],
  languages: [
    /^(?:languages?|language\s*skills?|spoken\s*languages?)$/i,
  ],
  interests: [
    /^(?:interests?|hobbies?|extracurricular(?:\s*activities)?|activities)$/i,
  ],
  references: [
    /^(?:references?|referees?)$/i,
  ],
};

// Date patterns
const DATE_PATTERNS = [
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*['']?\s*(\d{2,4})\b/gi,
  /\b(\d{1,2})[\/\-](\d{4})\b/g,
  /\b(\d{4})\s*[-–]\s*(present|current|now|ongoing)\b/gi,
  /\b(\d{4})\s*[-–]\s*(\d{4})\b/g,
];

// Contact info patterns
const CONTACT_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,7}/g,
  linkedin: /(?:linkedin\.com\/in\/|@)([a-zA-Z0-9_-]+)/gi,
  github: /(?:github\.com\/|@)([a-zA-Z0-9_-]+)/gi,
  website: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9_-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi,
  location: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/g,
};

// Skill extraction patterns
const SKILL_KEYWORDS = {
  programming: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab'],
  frontend: ['react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'webpack', 'vite'],
  backend: ['node.js', 'express', 'django', 'flask', 'spring', 'rails', '.net', 'fastapi', 'graphql', 'rest'],
  database: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'oracle', 'sqlite', 'cassandra'],
  cloud: ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'vercel', 'netlify'],
  devops: ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'github actions', 'gitlab ci'],
  datascience: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp', 'computer vision'],
  tools: ['git', 'jira', 'confluence', 'slack', 'figma', 'sketch', 'adobe', 'postman', 'vs code'],
  soft: ['leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'project management', 'agile', 'scrum'],
};

export interface ParsedSection {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  confidence: number;
}

export interface ParsedExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface ResumeParseResult {
  contact: ParsedContact;
  summary?: string;
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: { category: string; items: string[] }[];
  certifications: string[];
  projects: { name: string; description: string; technologies?: string[] }[];
  sections: ParsedSection[];
  rawText: string;
  wordCount: number;
  parseConfidence: number;
}

/**
 * Parse resume text into structured data
 */
export function parseResumeText(text: string): ResumeParseResult {
  const lines = text.split('\n');
  const sections = identifySections(lines);
  
  // Extract contact info (usually from first few lines)
  const contact = extractContactInfo(text.slice(0, 1000));
  
  // Extract summary
  const summarySection = sections.find(s => s.name === 'summary');
  const summary = summarySection?.content.trim() || undefined;
  
  // Extract experience
  const experienceSection = sections.find(s => s.name === 'experience');
  const experience = experienceSection ? parseExperienceSection(experienceSection.content) : [];
  
  // Extract education
  const educationSection = sections.find(s => s.name === 'education');
  const education = educationSection ? parseEducationSection(educationSection.content) : [];
  
  // Extract skills
  const skillsSection = sections.find(s => s.name === 'skills');
  const skills = skillsSection ? parseSkillsSection(skillsSection.content) : extractSkillsFromText(text);
  
  // Extract certifications
  const certSection = sections.find(s => s.name === 'certifications');
  const certifications = certSection ? parseCertifications(certSection.content) : [];
  
  // Extract projects
  const projectSection = sections.find(s => s.name === 'projects');
  const projects = projectSection ? parseProjects(projectSection.content) : [];
  
  // Calculate parse confidence
  const parseConfidence = calculateParseConfidence(sections, contact, experience, education);
  
  return {
    contact,
    summary,
    experience,
    education,
    skills,
    certifications,
    projects,
    sections,
    rawText: text,
    wordCount: text.split(/\s+/).filter(w => w.length > 1).length,
    parseConfidence,
  };
}

/**
 * Identify sections in resume text
 */
function identifySections(lines: string[]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Check if this line is a section header
    for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(trimmedLine)) {
          // Close previous section
          if (currentSection) {
            currentSection.endLine = index - 1;
            sections.push(currentSection);
          }
          
          // Start new section
          currentSection = {
            name: sectionName,
            startLine: index,
            endLine: lines.length - 1,
            content: '',
            confidence: 0.9,
          };
          break;
        }
      }
    }
    
    // Also check for all-caps headers or lines with special formatting
    if (trimmedLine.length > 0 && trimmedLine.length < 50) {
      const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && /[A-Z]/.test(trimmedLine);
      const hasColonEnd = trimmedLine.endsWith(':');
      const isShortBoldLike = trimmedLine.length < 30 && !trimmedLine.includes(' ') === false;
      
      if (isAllCaps || hasColonEnd) {
        const sectionName = guessSectionFromHeader(trimmedLine);
        if (sectionName && (!currentSection || currentSection.name !== sectionName)) {
          if (currentSection) {
            currentSection.endLine = index - 1;
            sections.push(currentSection);
          }
          
          currentSection = {
            name: sectionName,
            startLine: index,
            endLine: lines.length - 1,
            content: '',
            confidence: 0.7,
          };
        }
      }
    }
    
    // Add content to current section
    if (currentSection && index > currentSection.startLine) {
      currentSection.content += line + '\n';
    }
  });
  
  // Close final section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Guess section from non-standard header
 */
function guessSectionFromHeader(header: string): string | null {
  const lowerHeader = header.toLowerCase().replace(/[:\s]+$/, '').trim();
  
  for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerHeader)) {
        return sectionName;
      }
    }
  }
  
  // Fuzzy matching for common variations
  if (/work|job|career|employ/.test(lowerHeader)) return 'experience';
  if (/school|degree|university|college/.test(lowerHeader)) return 'education';
  if (/skill|competenc|expert|proficien/.test(lowerHeader)) return 'skills';
  if (/cert|license|credential/.test(lowerHeader)) return 'certifications';
  if (/project|portfolio/.test(lowerHeader)) return 'projects';
  if (/award|honor|achieve|accomplishment/.test(lowerHeader)) return 'awards';
  
  return null;
}

/**
 * Extract contact information
 */
function extractContactInfo(text: string): ParsedContact {
  const contact: ParsedContact = {};
  
  // Extract email
  const emails = text.match(CONTACT_PATTERNS.email);
  if (emails) contact.email = emails[0];
  
  // Extract phone
  const phones = text.match(CONTACT_PATTERNS.phone);
  if (phones) contact.phone = phones[0];
  
  // Extract LinkedIn
  const linkedinMatch = CONTACT_PATTERNS.linkedin.exec(text);
  if (linkedinMatch) contact.linkedin = linkedinMatch[1];
  
  // Extract GitHub
  const githubMatch = CONTACT_PATTERNS.github.exec(text);
  if (githubMatch) contact.github = githubMatch[1];
  
  // Extract name (usually the first non-empty line)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Name is typically 2-4 words, each capitalized
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(firstLine)) {
      contact.name = firstLine;
    }
  }
  
  // Extract location
  const locationMatch = CONTACT_PATTERNS.location.exec(text);
  if (locationMatch) contact.location = `${locationMatch[1]}, ${locationMatch[2]}`;
  
  return contact;
}

/**
 * Parse experience section
 */
function parseExperienceSection(content: string): ParsedExperience[] {
  const experiences: ParsedExperience[] = [];
  const blocks = content.split(/\n\s*\n/).filter(b => b.trim());
  
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 2) continue;
    
    const experience: ParsedExperience = {
      company: '',
      title: '',
      current: false,
      description: '',
      achievements: [],
    };
    
    // First line usually has title and company
    const firstLine = lines[0].trim();
    
    // Check if both company and title are in the first line (e.g., Company | Title)
    const separators = /[|•●]| - /;
    if (separators.test(firstLine)) {
      const parts = firstLine.split(separators).map(p => p.trim());
      // Date usually at the end of the line
      const cleanParts = parts.map(p => p.replace(DATE_PATTERNS[3], '').replace(DATE_PATTERNS[2], '').trim()).filter(p => p);
      
      if (cleanParts.length >= 2) {
        // Heuristic: identify company based on common suffixes or position
        const companySuffixes = ['inc', 'corp', 'llc', 'ltd', 'company', 'solutions', 'systems', 'tech', 'technologies'];
        const p0Lower = cleanParts[0].toLowerCase();
        const p1Lower = cleanParts[1].toLowerCase();
        
        const isP0Company = companySuffixes.some(s => p0Lower.includes(s));
        const isP1Company = companySuffixes.some(s => p1Lower.includes(s));

        if (isP0Company && !isP1Company) {
          experience.company = cleanParts[0];
          experience.title = cleanParts[1];
        } else if (isP1Company && !isP0Company) {
          experience.company = cleanParts[1];
          experience.title = cleanParts[0];
        } else {
          // Default to Title | Company as it's more common in resumes
          experience.title = cleanParts[0];
          experience.company = cleanParts[1];
        }
      } else {
        experience.title = cleanParts[0] || '';
      }
    } else {
      const secondLine = lines[1]?.trim() || '';
      // Check for date to identify format
      const hasDateInFirst = DATE_PATTERNS.some(p => p.test(firstLine));
      
      if (hasDateInFirst) {
        // Date in first line, company/title might be second or also in first
        experience.company = firstLine.replace(/\d{4}.*$/, '').trim();
        experience.title = secondLine;
      } else {
        experience.title = firstLine;
        experience.company = secondLine;
      }
    }
    
    // Safety check: if title or company looks like a bullet point, it's probably not a title/company
    if (experience.title.startsWith('-') || experience.title.startsWith('•')) {
      experience.title = firstLine; // Fallback
    }
    
    // Check for current position
    if (/present|current|now|ongoing/i.test(block)) {
      experience.current = true;
    }
    
    // Extract achievements (lines starting with bullets or dashes)
    const achievementLines = lines.filter(l => 
      /^[\s]*[-•●○◦▪▫■□◆◇*→→]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l)
    );
    
    experience.achievements = achievementLines.map(l => 
      l.replace(/^[\s]*[-•●○◦▪▫■□◆◇*→→\d.)\s]+/, '').trim()
    ).filter(a => a.length > 10);
    
    // Remaining content is description
    const nonAchievementLines = lines.slice(2).filter(l => 
      !achievementLines.includes(l)
    );
    experience.description = nonAchievementLines.join(' ').trim();
    
    if (experience.title || experience.company) {
      experiences.push(experience);
    }
  }
  
  return experiences;
}

/**
 * Parse education section
 */
function parseEducationSection(content: string): ParsedEducation[] {
  const educations: ParsedEducation[] = [];
  const blocks = content.split(/\n\s*\n/).filter(b => b.trim());
  
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 1) continue;
    
    const education: ParsedEducation = {
      institution: lines[0]?.trim() || '',
      degree: '',
    };
    
    // Look for degree information
    const degreePatterns = [
      /\b(bachelor|master|phd|doctorate|associate|mba|bs|ba|ms|ma|m\.s\.|b\.s\.|b\.a\.|m\.a\.)\b/gi,
      /\b(computer science|engineering|business|arts|science|mathematics|physics|chemistry)\b/gi,
    ];
    
    for (const line of lines) {
      const degreeMatch = degreePatterns[0].exec(line);
      if (degreeMatch) {
        education.degree = line.trim();
        break;
      }
    }
    
    // Extract GPA
    const gpaMatch = block.match(/\bgpa[:\s]*(\d+\.?\d*)/i);
    if (gpaMatch) education.gpa = gpaMatch[1];
    
    if (education.institution) {
      educations.push(education);
    }
  }
  
  return educations;
}

/**
 * Parse skills section
 */
function parseSkillsSection(content: string): { category: string; items: string[] }[] {
  const skills: { category: string; items: string[] }[] = [];
  const lines = content.split('\n').filter(l => l.trim());
  
  // Look for category headers or comma-separated lists
  for (const line of lines) {
    // Check for "Category: skill1, skill2, skill3" format
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      const category = colonMatch[1].trim();
      const items = colonMatch[2].split(/[,;|]/).map(s => s.trim()).filter(s => s);
      if (items.length > 0) {
        skills.push({ category, items });
      }
    } else {
      // Plain list of skills
      const items = line.split(/[,;|•●○◦▪▫]/).map(s => s.trim()).filter(s => s && s.length > 1);
      if (items.length > 0) {
        skills.push({ category: 'General', items });
      }
    }
  }
  
  return skills;
}

/**
 * Extract skills from full text when no skills section found
 */
function extractSkillsFromText(text: string): { category: string; items: string[] }[] {
  const lowerText = text.toLowerCase();
  const found: { category: string; items: string[] }[] = [];
  
  for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      found.push({ category, items: matches });
    }
  }
  
  return found;
}

/**
 * Parse certifications
 */
function parseCertifications(content: string): string[] {
  return content
    .split('\n')
    .map(l => l.replace(/^[\s]*[-•●○◦▪▫■□◆◇*→→\d.)\s]+/, '').trim())
    .filter(l => l.length > 5);
}

/**
 * Parse projects
 */
function parseProjects(content: string): { name: string; description: string; technologies?: string[] }[] {
  const projects: { name: string; description: string; technologies?: string[] }[] = [];
  const blocks = content.split(/\n\s*\n/).filter(b => b.trim());
  
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 1) continue;
    
    const project = {
      name: lines[0].trim(),
      description: lines.slice(1).join(' ').trim(),
      technologies: [] as string[],
    };
    
    // Extract technologies mentioned
    const techMatch = block.match(/(?:technologies|tech\s*stack|built\s*with|using)[:\s]*([^.]+)/i);
    if (techMatch) {
      project.technologies = techMatch[1].split(/[,;|]/).map(t => t.trim()).filter(t => t);
    }
    
    if (project.name) {
      projects.push(project);
    }
  }
  
  return projects;
}

/**
 * Calculate parse confidence score
 */
function calculateParseConfidence(
  sections: ParsedSection[],
  contact: ParsedContact,
  experience: ParsedExperience[],
  education: ParsedEducation[]
): number {
  let score = 50; // Base score
  
  // Contact info bonus
  if (contact.email) score += 10;
  if (contact.phone) score += 5;
  if (contact.name) score += 5;
  
  // Sections found bonus
  if (sections.find(s => s.name === 'experience')) score += 10;
  if (sections.find(s => s.name === 'education')) score += 10;
  if (sections.find(s => s.name === 'skills')) score += 5;
  
  // Content quality bonus
  if (experience.length > 0) score += 5;
  if (experience.some(e => e.achievements.length > 0)) score += 5;
  if (education.length > 0) score += 5;
  
  return Math.min(100, score);
}

/**
 * Convert parsed resume to ResumeData format
 */
export function toResumeData(parsed: ResumeParseResult): ResumeData {
  return {
    personalInfo: {
      fullName: parsed.contact.name || '',
      email: parsed.contact.email || '',
      phone: parsed.contact.phone || '',
      location: parsed.contact.location || '',
      linkedin: parsed.contact.linkedin || '',
      github: parsed.contact.github || '',
      website: parsed.contact.website || '',
      summary: parsed.summary || '',
    },
    experience: parsed.experience.map((exp, idx) => ({
      id: `exp-${idx}`,
      company: exp.company,
      position: exp.title,
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current,
      description: exp.description,
      achievements: exp.achievements,
    })),
    education: parsed.education.map((edu, idx) => ({
      id: `edu-${idx}`,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field || '',
      graduationDate: edu.endDate || '',
      gpa: edu.gpa || '',
      honors: edu.honors?.join(', ') || '',
    })),
    skills: parsed.skills.map(cat => ({
      category: cat.category,
      skills: cat.items,
    })),
    projects: parsed.projects.map((proj, idx) => ({
      id: `proj-${idx}`,
      name: proj.name,
      description: proj.description,
      technologies: proj.technologies || [],
      link: '',
      github: '',
    })),
    certifications: parsed.certifications.map((cert, idx) => ({
      id: `cert-${idx}`,
      name: cert,
      issuer: '',
      date: '',
      credentialId: '',
    })),
  };
}
