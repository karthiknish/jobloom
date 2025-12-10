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
Analyze this resume for ATS compatibility and job fit. Provide a comprehensive analysis in the following JSON format:

{
  "atsScore": <number 0-100>,
  "keywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["missing1", "missing2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...]
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
 * Create ATS score calculation prompt
 */
export function createATSScorePrompt(content: string, keywords: string[], jobDescription: string): string {
  return `
Analyze this cover letter for ATS (Applicant Tracking System) compatibility and provide a score from 0-100.

Cover Letter:
${content}

Target Keywords: ${keywords.join(', ')}

Job Description:
${jobDescription}

Evaluate based on:
1. Keyword matching (30 points)
2. Natural language flow (20 points)
3. Length appropriateness (15 points)
4. Structure and formatting (15 points)
5. Relevance to job requirements (20 points)

Return only a number between 0-100 representing the ATS compatibility score.
`;
}

/**
 * Create improvements prompt
 */
export function createImprovementsPrompt(
  content: string,
  keywords: string[],
  atsScore: number,
  deepResearch: boolean
): string {
  return `
Analyze this cover letter and provide 3-5 specific, actionable improvement suggestions.

Cover Letter:
${content}

Current ATS Score: ${atsScore}/100
Target Keywords: ${keywords.join(', ')}
Deep Research Used: ${deepResearch}

Focus on:
1. Keyword optimization for ATS
2. Content relevance and impact
3. Structure and readability
4. Company-specific personalization
5. Quantifiable achievements

Return suggestions as a JSON array of strings.

Example: ["Add more quantifiable achievements with specific metrics", "Incorporate additional job-specific keywords naturally"]
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

/**
 * Create interview evaluation prompt
 */
export function createInterviewEvaluationPrompt(
  question: string,
  answer: string,
  category: string,
  difficulty: string
): string {
  return `You are an expert interview coach. Evaluate this interview answer and provide comprehensive feedback.

INTERVIEW QUESTION (${category} - ${difficulty}):
"${question}"

CANDIDATE'S ANSWER:
"${answer}"

Analyze the answer and return a JSON object with this exact structure:
{
  "overall_score": <number 0-100>,
  "content_score": <number 0-100 - depth and substance of the answer>,
  "clarity_score": <number 0-100 - how clear and articulate>,
  "relevance_score": <number 0-100 - how well it addresses the question>,
  "structure_score": <number 0-100 - use of STAR method or logical structure>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area to improve 1", "area to improve 2", ...],
  "detailed_feedback": "A paragraph of constructive feedback",
  "suggestions": ["specific suggestion 1", "specific suggestion 2", ...],
  "estimated_response_quality": "Poor" | "Fair" | "Good" | "Excellent"
}

Evaluation criteria:
- Content (25%): Depth, examples, specificity
- Clarity (25%): Clear articulation, no rambling
- Relevance (25%): Directly addresses all parts of the question
- Structure (25%): STAR method for behavioral, logical flow for technical

Quality thresholds:
- Excellent: 85-100
- Good: 70-84
- Fair: 50-69
- Poor: 0-49

Be constructive and helpful. Return ONLY the JSON object.`;
}
