/**
 * AI Prompt Builders
 * 
 * All prompt templates for AI generation.
 */

import type { CoverLetterRequest, ResumeGenerationRequest } from './types';

/**
 * Create cover letter generation prompt
 */
export function createCoverLetterPrompt(data: CoverLetterRequest & {
  keywords: string[];
  researchInsights: string[];
}): string {
  const { jobTitle, companyName, jobDescription, skills, experience, tone, length, keywords, deepResearch, researchInsights } = data;

  const lengthGuide = {
    concise: '200-250 words',
    standard: '250-350 words',
    detailed: '350-450 words'
  };

  const toneGuide = {
    professional: 'formal, business-appropriate language',
    friendly: 'warm, approachable, conversational tone',
    enthusiastic: 'energetic, passionate, highly motivated language',
    formal: 'very formal, traditional business correspondence style'
  };

  // Role-specific instructions
  let roleSpecificInstructions = "";
  const jobTitleLower = jobTitle.toLowerCase();
  if (jobTitleLower.includes('engineer') || jobTitleLower.includes('developer') || jobTitleLower.includes('tech')) {
    roleSpecificInstructions = "Highlight technical problem-solving, specific projects, and how your tech stack aligns with the company's needs.";
  } else if (jobTitleLower.includes('manager') || jobTitleLower.includes('lead') || jobTitleLower.includes('director')) {
    roleSpecificInstructions = "Emphasize leadership philosophy, team building, and strategic vision for the department.";
  } else if (jobTitleLower.includes('sales') || jobTitleLower.includes('marketing') || jobTitleLower.includes('growth')) {
    roleSpecificInstructions = "Focus on your track record of driving results, revenue impact, and understanding of the target market.";
  }

  return `
Write a compelling cover letter for a ${jobTitle} position at ${companyName}.

JOB DETAILS:
- Position: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}

CANDIDATE INFO:
- Skills: ${skills.join(', ')}
- Experience: ${experience}

REQUIREMENTS:
- Tone: ${toneGuide[tone]}
- Length: ${lengthGuide[length]}
- Optimize for ATS with these keywords: ${keywords.join(', ')}
${deepResearch ? `- Company Insights: ${researchInsights.join('; ')}` : ''}
- ${roleSpecificInstructions}

INSTRUCTIONS:
1. Start with a strong hook that shows enthusiasm for the role and company
2. Highlight relevant experience and skills that match the job requirements
3. Incorporate keywords naturally throughout the letter
4. Demonstrate knowledge of the company (especially if deep research is available)
5. End with a clear call to action
6. Keep the tone ${tone} throughout
7. Ensure the letter is ${lengthGuide[length]}

Format as a professional cover letter with proper salutation and closing.
`;
}

/**
 * Create resume analysis prompt
 */
export function createResumeAnalysisPrompt(resumeText: string, jobDescription?: string): string {
  return `
Analyze this resume for ATS compatibility and job fit. Also, extract all information into a structured format.
If this is a LinkedIn PDF export, pay special attention to the specific formatting LinkedIn uses.

Provide a comprehensive analysis in the following JSON format:

{
  "atsScore": <number 0-100>,
  "keywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["missing1", "missing2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "parsedData": {
    "personalInfo": {
      "fullName": "...",
      "email": "...",
      "phone": "...",
      "location": "...",
      "linkedin": "...",
      "github": "...",
      "website": "...",
      "summary": "..."
    },
    "experience": [
      {
        "company": "...",
        "position": "...",
        "location": "...",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM or empty if current",
        "current": boolean,
        "description": "...",
        "achievements": ["bullet 1", "bullet 2"]
      }
    ],
    "education": [
      {
        "institution": "...",
        "degree": "...",
        "field": "...",
        "graduationDate": "YYYY-MM",
        "gpa": "...",
        "honors": "..."
      }
    ],
    "skills": [
      {
        "category": "Technical Skills",
        "skills": ["skill 1", "skill 2"]
      }
    ],
    "projects": [
      {
        "name": "...",
        "description": "...",
        "technologies": ["tech 1", "tech 2"],
        "link": "...",
        "github": "..."
      }
    ],
    "certifications": [
      {
        "name": "...",
        "issuer": "...",
        "date": "YYYY-MM-DD",
        "credentialId": "..."
      }
    ],
    "languages": [
      {
        "language": "...",
        "proficiency": "Beginner" | "Intermediate" | "Advanced" | "Native"
      }
    ]
  }
}

Resume Text:
${resumeText}

${jobDescription ? `Job Description:
${jobDescription}

` : ''}

Focus on:
- ATS keyword optimization
- Content relevance and impact
- Formatting and structure
- Quantifiable achievements
- Industry-specific terminology
- ACCURATE extraction of all dates, companies, and roles.
`;
}

/**
 * Create resume generation prompt
 */
export function createResumeGenerationPrompt(request: ResumeGenerationRequest): string {
  const {
    jobTitle,
    experience,
    skills,
    education,
    industry,
    level,
    style,
    includeObjective,
    atsOptimization,
    aiEnhancement,
  } = request;

  const styleGuide: Record<string, string> = {
    modern: 'Modern: clean layout, concise bullet points, metrics-driven achievements',
    classic: 'Classic: traditional formatting, professional tone, clear sections',
    creative: 'Creative: engaging language, storytelling elements while staying ATS-friendly',
    tech: 'Tech: emphasize technical skills, projects, agile practices, measurable outcomes',
  };

  const levelGuide: Record<string, string> = {
    entry: 'Entry level professional (0-2 years experience)',
    mid: 'Mid level professional (3-7 years experience)',
    senior: 'Senior professional (8-12 years experience)',
    executive: 'Executive leader (13+ years experience)',
  };

  const normalizedSkills = skills && skills.length > 0 ? skills.join(', ') : 'Not specified';
  const styleDescription = styleGuide[style] ?? `Style preference: ${style}`;
  const levelDescription = levelGuide[level] ?? `Professional level: ${level}`;

  // Role-specific instructions
  let roleSpecificInstructions = "";
  const jobTitleLower = jobTitle.toLowerCase();
  if (jobTitleLower.includes('engineer') || jobTitleLower.includes('developer') || jobTitleLower.includes('tech')) {
    roleSpecificInstructions = "Focus on technical stack, architecture, problem-solving, and specific technologies used. Use industry-standard tech terminology.";
  } else if (jobTitleLower.includes('manager') || jobTitleLower.includes('lead') || jobTitleLower.includes('director')) {
    roleSpecificInstructions = "Focus on leadership, team management, strategic impact, budget oversight, and cross-functional collaboration.";
  } else if (jobTitleLower.includes('sales') || jobTitleLower.includes('marketing') || jobTitleLower.includes('growth')) {
    roleSpecificInstructions = "Focus on quantifiable metrics, revenue growth, conversion rates, campaign performance, and market expansion.";
  } else if (jobTitleLower.includes('design') || jobTitleLower.includes('creative') || jobTitleLower.includes('ux')) {
    roleSpecificInstructions = "Focus on design process, user-centricity, visual impact, and specific design tools/methodologies.";
  }

  return `You are an expert resume writer helping a candidate craft an optimized resume for ATS systems.

Return ONLY a valid JSON object (no markdown fences, no commentary) using this exact structure:
{
  "summary": "...",
  "experience": "...",
  "skills": "...",
  "education": "...",
  "content": "..."
}

Formatting rules:
- Use \\n within string values for line breaks.
- Make sure content is ATS-friendly: short bullet sentences, measurable achievements, relevant keywords.
- Keep tone ${aiEnhancement ? 'polished and confident' : 'close to the original wording provided by the user'}.
- ${atsOptimization ? 'Prioritize keyword coverage and simple structure (SUMMARY, EXPERIENCE, SKILLS, EDUCATION).' : 'Maintain natural narrative flow. ATS optimization is optional.'}
- If ${includeObjective ? 'include' : 'do not include'} an objective statement. If included, merge it into the summary section.
- ${roleSpecificInstructions}

Candidate context:
- Target role: ${jobTitle}
- Industry focus: ${industry || 'general'}
- Professional level: ${levelDescription}
- Resume style preference: ${styleDescription}
- Key skills: ${normalizedSkills}
- Education: ${education || 'Not specified'}
- Experience highlights: ${experience || 'Not provided'}

Ensure each section is complete. Provide the full resume body in the "content" field with appropriate headings (e.g., SUMMARY, EXPERIENCE, SKILLS, EDUCATION).`;
}

/**
 * Create job summary prompt
 */
export function createJobSummaryPrompt(jobDescription: string): string {
  return `
Analyze the following job description and provide a concise summary, key requirements, culture insights, and ATS keywords.

Job Description:
${jobDescription}

Return a JSON object with this exact structure:
{
  "summary": "A 2-3 sentence high-level summary of the role",
  "keyRequirements": ["requirement 1", "requirement 2", ...],
  "cultureInsights": ["insight 1", "insight 2", ...],
  "atsKeywords": ["keyword 1", "keyword 2", ...],
  "salaryEstimate": "Any salary info mentioned or 'Not specified'"
}

Ensure the summary is professional and highlights the core value proposition of the role.
Return ONLY the JSON object.
`;
}



/**
 * Create keyword extraction prompt
 */
export function createKeywordExtractionPrompt(jobDescription: string, userSkills: string[]): string {
  return `
Analyze this job description and extract the most important keywords and skills that would be valuable for ATS optimization. Focus on technical skills, soft skills, and industry-specific terms.

Job Description:
${jobDescription}

User Skills: ${userSkills.join(', ')}

Return a JSON array of the top 12 most relevant keywords/phrases. Focus on terms that are commonly searched by ATS systems.

Example format: ["JavaScript", "React", "Node.js", "Team Leadership", "Agile Methodology"]
`;
}

/**
 * Create company insights prompt
 */
export function createCompanyInsightsPrompt(jobDescription: string, companyName: string): string {
  return `
Analyze this job description for ${companyName} and provide 3-5 key insights about the company culture, values, and work environment. Focus on:

1. Company values and culture
2. Work environment and collaboration style
3. Innovation and technology focus
4. Growth and development opportunities
5. Diversity and inclusion

Job Description:
${jobDescription}

Return insights as a JSON array of strings, each insight should be actionable and specific.

Example: ["Emphasizes collaborative team environment with cross-functional projects", "Focuses on innovation and cutting-edge technology solutions"]
`;
}

