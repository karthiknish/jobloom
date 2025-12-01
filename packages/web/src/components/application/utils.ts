// Resume scoring and utility functions
import { ResumeData, ResumeScore } from './types';

// Comprehensive keyword libraries for ATS matching
const ATS_KEYWORDS = {
  actionVerbs: [
    'led', 'developed', 'implemented', 'created', 'managed', 'improved', 'achieved',
    'designed', 'built', 'launched', 'delivered', 'optimized', 'streamlined', 'established',
    'spearheaded', 'orchestrated', 'pioneered', 'transformed', 'executed', 'generated',
    'accelerated', 'championed', 'collaborated', 'demonstrated', 'directed', 'drove',
    'enhanced', 'exceeded', 'expanded', 'facilitated', 'guided', 'initiated', 'innovated',
    'integrated', 'maximized', 'mentored', 'negotiated', 'overhauled', 'produced',
    'reduced', 'resolved', 'secured', 'simplified', 'standardized', 'strengthened'
  ],
  softSkills: [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
    'critical thinking', 'adaptability', 'creativity', 'collaboration', 'organization',
    'time management', 'strategic planning', 'decision making', 'conflict resolution',
    'mentoring', 'negotiation', 'presentation', 'customer service', 'interpersonal'
  ],
  technicalIndicators: [
    'api', 'database', 'cloud', 'software', 'system', 'platform', 'framework',
    'architecture', 'infrastructure', 'automation', 'integration', 'deployment',
    'testing', 'debugging', 'optimization', 'scalability', 'security', 'analytics'
  ],
  quantifiers: [
    /%/, /\$\d+/, /\d+[kmb]\b/i, /\d+\s*(users|customers|clients|projects|team)/i,
    /\d+%?\s*(increase|decrease|growth|reduction|improvement)/i,
    /\d+\s*(hours|days|weeks|months)\s*(saved|reduced)/i
  ]
};

// Contact info patterns
const CONTACT_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  linkedin: /linkedin\.com|linkedin/i,
  github: /github\.com|github/i,
  website: /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+/
};

export function calculateResumeScore(resumeData: ResumeData): ResumeScore {
  // Completeness score with weighted fields
  const personalFieldWeights = {
    fullName: 15,
    email: 15,
    phone: 10,
    location: 10,
    summary: 25,
    linkedin: 10,
    github: 5,
    website: 5
  };

  let personalWeightedScore = 0;
  let totalPersonalWeight = 0;

  for (const [field, weight] of Object.entries(personalFieldWeights)) {
    totalPersonalWeight += weight;
    const value = resumeData.personalInfo[field as keyof typeof resumeData.personalInfo];
    if (value && String(value).trim().length > 0) {
      // Bonus for quality content
      if (field === 'summary' && String(value).length >= 100) {
        personalWeightedScore += weight * 1.2; // 20% bonus for good summary
      } else if (field === 'summary' && String(value).length >= 50) {
        personalWeightedScore += weight;
      } else if (field === 'summary') {
        personalWeightedScore += weight * 0.5; // Partial credit for short summary
      } else {
        personalWeightedScore += weight;
      }
    }
  }
  const personalCompleteness = Math.min(personalWeightedScore / totalPersonalWeight, 1);

  // Section completeness with quality assessment
  const experienceQuality = calculateExperienceQuality(resumeData.experience);
  const educationQuality = resumeData.education.length > 0 ? 
    Math.min(resumeData.education.length * 0.5, 1) : 0;
  const projectQuality = resumeData.projects.length > 0 ?
    calculateProjectQuality(resumeData.projects) : 0;
  const certificationBonus = resumeData.certifications && resumeData.certifications.length > 0 ? 0.15 : 0;

  const sectionCompleteness = Math.min(
    (experienceQuality * 0.45) + 
    (educationQuality * 0.25) + 
    (projectQuality * 0.20) +
    certificationBonus,
    1
  );

  // Skill score with diversity assessment
  const skillCategories = resumeData.skills.length;
  const totalSkills = resumeData.skills.reduce((acc, skill) => acc + skill.skills.length, 0);
  const skillDiversity = Math.min(skillCategories / 4, 1); // Bonus for categorized skills
  const skillDepth = Math.min(totalSkills / 12, 1); // Optimal around 12+ skills
  const skillScore = (skillDiversity * 0.4 + skillDepth * 0.6);

  const completeness = Math.round(
    (personalCompleteness * 0.3 + sectionCompleteness * 0.4 + skillScore * 0.3) * 100
  );

  // ATS score with enhanced analysis
  const atsScore = calculateATSScore(resumeData);

  // Impact score
  const impactScore = calculateImpactScore(resumeData);

  // Overall score with balanced weighting
  const overall = Math.round(
    (completeness * 0.35 + atsScore * 0.35 + impactScore * 0.30)
  );

  // Generate prioritized suggestions
  const suggestions = generateSuggestions(resumeData, completeness, atsScore, impactScore);

  return {
    overall,
    completeness,
    ats: atsScore,
    impact: impactScore,
    suggestions
  };
}

function calculateExperienceQuality(experience: ResumeData['experience']): number {
  if (experience.length === 0) return 0;

  let qualityScore = 0;
  const maxExperiences = Math.min(experience.length, 5); // Focus on top 5

  for (let i = 0; i < maxExperiences; i++) {
    const exp = experience[i];
    let expScore = 0;

    // Basic fields
    if (exp.position) expScore += 0.15;
    if (exp.company) expScore += 0.15;
    if (exp.startDate) expScore += 0.10;
    if (exp.description && exp.description.length > 50) expScore += 0.20;
    
    // Achievements quality
    const validAchievements = exp.achievements.filter(a => a.trim().length > 10);
    expScore += Math.min(validAchievements.length * 0.10, 0.40);

    qualityScore += expScore;
  }

  return Math.min(qualityScore / maxExperiences, 1);
}

function calculateProjectQuality(projects: ResumeData['projects']): number {
  if (projects.length === 0) return 0;

  let qualityScore = 0;
  const maxProjects = Math.min(projects.length, 3);

  for (let i = 0; i < maxProjects; i++) {
    const project = projects[i];
    let projScore = 0;

    if (project.name) projScore += 0.20;
    if (project.description && project.description.length > 30) projScore += 0.30;
    if (project.technologies && project.technologies.length > 0) projScore += 0.30;
    if (project.link || project.github) projScore += 0.20;

    qualityScore += projScore;
  }

  return Math.min(qualityScore / maxProjects, 1);
}

function calculateATSScore(resumeData: ResumeData): number {
  let score = 0;
  const fullText = extractFullText(resumeData).toLowerCase();
  const words = fullText.split(/\s+/);
  const wordCount = words.length;

  // 1. Contact Information (20 points max)
  let contactScore = 0;
  if (resumeData.personalInfo.email && CONTACT_PATTERNS.email.test(resumeData.personalInfo.email)) {
    contactScore += 6;
  }
  if (resumeData.personalInfo.phone && resumeData.personalInfo.phone.replace(/\D/g, '').length >= 10) {
    contactScore += 6;
  }
  if (resumeData.personalInfo.location) contactScore += 4;
  if (resumeData.personalInfo.linkedin) contactScore += 2;
  if (resumeData.personalInfo.github || resumeData.personalInfo.website) contactScore += 2;
  score += Math.min(contactScore, 20);

  // 2. Section Structure (15 points max)
  let structureScore = 0;
  if (resumeData.personalInfo.summary && resumeData.personalInfo.summary.length >= 50) structureScore += 4;
  if (resumeData.experience.length > 0) structureScore += 4;
  if (resumeData.education.length > 0) structureScore += 3;
  if (resumeData.skills.some(skill => skill.skills.length > 0)) structureScore += 4;
  score += Math.min(structureScore, 15);

  // 3. Action Verb Usage (20 points max)
  const actionVerbCount = ATS_KEYWORDS.actionVerbs.filter(verb => 
    fullText.includes(verb)
  ).length;
  const actionVerbScore = Math.min((actionVerbCount / 15) * 20, 20);
  score += actionVerbScore;

  // 4. Quantified Achievements (20 points max)
  let quantScore = 0;
  const allAchievements = resumeData.experience.flatMap(exp => exp.achievements).join(' ');
  const descriptions = resumeData.experience.map(exp => exp.description).join(' ');
  const combinedContent = allAchievements + ' ' + descriptions;

  // Check for various quantifier patterns
  for (const pattern of ATS_KEYWORDS.quantifiers) {
    if (pattern.test(combinedContent)) {
      quantScore += 4;
    }
  }
  score += Math.min(quantScore, 20);

  // 5. Professional Summary Quality (10 points max)
  let summaryScore = 0;
  const summary = resumeData.personalInfo.summary || '';
  if (summary.length >= 100 && summary.length <= 400) {
    summaryScore += 5; // Good length
  } else if (summary.length >= 50) {
    summaryScore += 3;
  }
  // Check for professional language in summary
  const professionalTerms = ['experience', 'professional', 'skilled', 'expertise', 'background'];
  const hasProTerms = professionalTerms.some(term => summary.toLowerCase().includes(term));
  if (hasProTerms) summaryScore += 5;
  score += Math.min(summaryScore, 10);

  // 6. Keyword Density & Relevance (15 points max)
  let keywordScore = 0;
  const softSkillMatches = ATS_KEYWORDS.softSkills.filter(skill => 
    fullText.includes(skill.toLowerCase())
  ).length;
  keywordScore += Math.min(softSkillMatches * 1.5, 8);

  const techMatches = ATS_KEYWORDS.technicalIndicators.filter(term =>
    fullText.includes(term.toLowerCase())
  ).length;
  keywordScore += Math.min(techMatches * 1, 7);
  score += Math.min(keywordScore, 15);

  // Apply penalties for common ATS issues
  let penalties = 0;

  // Penalty for very short resume
  if (wordCount < 150) {
    penalties += 10;
  } else if (wordCount < 250) {
    penalties += 5;
  }

  // Penalty for very long resume (ATS may truncate)
  if (wordCount > 1200) {
    penalties += 5;
  }

  // Penalty for missing critical sections
  if (!resumeData.personalInfo.summary) penalties += 5;
  if (resumeData.experience.length === 0) penalties += 10;

  return Math.max(Math.min(Math.round(score - penalties), 100), 0);
}

function calculateImpactScore(resumeData: ResumeData): number {
  let score = 0;
  const fullText = extractFullText(resumeData).toLowerCase();

  // 1. Quantified achievements in experience (35 points max)
  let quantifiedCount = 0;
  resumeData.experience.forEach(exp => {
    exp.achievements.forEach(achievement => {
      // Check for numbers, percentages, dollar amounts
      if (/\d+/.test(achievement) || /\$/.test(achievement) || /%/.test(achievement)) {
        quantifiedCount++;
      }
    });
    // Also check description
    if (/\d+/.test(exp.description)) {
      quantifiedCount++;
    }
  });
  score += Math.min(quantifiedCount * 5, 35);

  // 2. Action verbs usage quality (25 points max)
  const uniqueActionVerbs = new Set<string>();
  ATS_KEYWORDS.actionVerbs.forEach(verb => {
    if (fullText.includes(verb)) {
      uniqueActionVerbs.add(verb);
    }
  });
  const verbDiversity = uniqueActionVerbs.size;
  score += Math.min(verbDiversity * 2, 25);

  // 3. Projects with demonstrable outcomes (20 points max)
  let projectImpact = 0;
  resumeData.projects.forEach(project => {
    if (project.description && project.description.length > 50) projectImpact += 3;
    if (project.technologies && project.technologies.length >= 3) projectImpact += 2;
    if (project.metrics) projectImpact += 5;
    if (project.link || project.github) projectImpact += 2;
  });
  score += Math.min(projectImpact, 20);

  // 4. Leadership and growth indicators (10 points max)
  const leadershipTerms = ['led', 'managed', 'supervised', 'mentored', 'directed', 'coordinated', 'team lead'];
  const leadershipMatches = leadershipTerms.filter(term => fullText.includes(term)).length;
  score += Math.min(leadershipMatches * 2, 10);

  // 5. Growth trajectory indicators (10 points max)
  const growthTerms = ['promoted', 'advanced', 'grew', 'increased', 'expanded', 'scaled'];
  const growthMatches = growthTerms.filter(term => fullText.includes(term)).length;
  score += Math.min(growthMatches * 2, 10);

  return Math.min(score, 100);
}

function extractFullText(resumeData: ResumeData): string {
  const sections: string[] = [];

  // Personal info
  sections.push(Object.values(resumeData.personalInfo).filter(Boolean).join(' '));

  // Experience
  resumeData.experience.forEach(exp => {
    sections.push([
      exp.position,
      exp.company,
      exp.description,
      ...exp.achievements
    ].filter(Boolean).join(' '));
  });

  // Education
  resumeData.education.forEach(edu => {
    sections.push([
      edu.degree,
      edu.field,
      edu.institution
    ].filter(Boolean).join(' '));
  });

  // Skills
  resumeData.skills.forEach(skillGroup => {
    sections.push(skillGroup.skills.join(' '));
  });

  // Projects
  resumeData.projects.forEach(project => {
    sections.push([
      project.name,
      project.description,
      ...(project.technologies || [])
    ].filter(Boolean).join(' '));
  });

  return sections.join(' ');
}

function generateSuggestions(
  resumeData: ResumeData, 
  completeness: number, 
  atsScore: number, 
  impactScore: number
): string[] {
  const suggestions: string[] = [];
  const fullText = extractFullText(resumeData).toLowerCase();

  // Critical issues first (high priority)
  if (!resumeData.personalInfo.summary) {
    suggestions.push("🔴 Add a professional summary (3-4 sentences) highlighting your key qualifications and career focus");
  } else if (resumeData.personalInfo.summary.length < 50) {
    suggestions.push("🔴 Expand your professional summary to 100-300 characters for better ATS matching");
  }

  if (resumeData.experience.length === 0) {
    suggestions.push("🔴 Add your work experience - this is critical for ATS systems and recruiters");
  }

  if (!resumeData.personalInfo.email || !resumeData.personalInfo.phone) {
    suggestions.push("🔴 Include both email and phone number for recruiters to contact you");
  }

  // Medium priority improvements
  if (completeness < 75) {
    if (resumeData.skills.length === 0) {
      suggestions.push("🟡 Add a skills section with both technical and soft skills");
    }
    if (resumeData.education.length === 0) {
      suggestions.push("🟡 Include your educational background");
    }
  }

  if (atsScore < 70) {
    // Check for action verbs
    const actionVerbCount = ATS_KEYWORDS.actionVerbs.filter(verb => 
      fullText.includes(verb)
    ).length;
    if (actionVerbCount < 8) {
      suggestions.push("🟡 Start achievement bullets with action verbs (Led, Developed, Achieved, Implemented)");
    }

    // Check for quantified achievements
    const hasQuantified = resumeData.experience.some(exp =>
      exp.achievements.some(a => /\d+/.test(a))
    );
    if (!hasQuantified) {
      suggestions.push("🟡 Add quantified achievements with numbers, percentages, or dollar amounts");
    }
  }

  if (impactScore < 70) {
    suggestions.push("🟡 Strengthen bullet points with measurable results and specific outcomes");
    suggestions.push("🟡 Include project outcomes and business impact where possible");
  }

  // Nice-to-have improvements
  if (!resumeData.personalInfo.linkedin) {
    suggestions.push("🟢 Add your LinkedIn profile URL to improve professional visibility");
  }

  if (resumeData.projects.length === 0 && completeness >= 70) {
    suggestions.push("🟢 Consider adding 1-3 relevant projects to showcase your abilities");
  }

  // Success message if everything looks good
  if (suggestions.length === 0) {
    suggestions.push("✅ Your resume looks well-optimized! Consider getting feedback from industry professionals");
  }

  return suggestions.slice(0, 6); // Return top 6 suggestions
}

export function getKeywordSuggestions(): string[] {
  return [
    "leadership", "project management", "communication", "teamwork",
    "problem-solving", "analytical skills", "critical thinking", "creativity",
    "adaptability", "time management", "collaboration", "innovation",
    "strategic planning", "data analysis", "customer service", "attention to detail"
  ];
}

export function generateResumeId(): string {
  return `resume_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function validateEmail(email: string): boolean {
  return CONTACT_PATTERNS.email.test(email);
}

export function validatePhone(phone: string): boolean {
  return CONTACT_PATTERNS.phone.test(phone) && phone.replace(/\D/g, '').length >= 10;
}