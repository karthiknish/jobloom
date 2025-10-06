import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export interface CoverLetterRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  skills: string[];
  experience: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'formal';
  length: 'concise' | 'standard' | 'detailed';
  deepResearch?: boolean;
}

export interface CoverLetterResponse {
  content: string;
  atsScore: number;
  keywords: string[];
  improvements: string[];
  wordCount: number;
  deepResearch: boolean;
  researchInsights: string[];
}

export interface ResumeAnalysisRequest {
  resumeText: string;
  jobDescription?: string;
}

export interface ResumeAnalysisResponse {
  atsScore: number;
  keywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

/**
 * Generate a personalized cover letter using AI
 */
export async function generateCoverLetter(request: CoverLetterRequest): Promise<CoverLetterResponse> {
  try {
    const {
      jobTitle,
      companyName,
      jobDescription,
      skills,
      experience,
      tone,
      length,
      deepResearch = false
    } = request;

    // Extract keywords from job description
    const keywords = await extractKeywords(jobDescription, skills);

    // Generate company insights if deep research is requested
    let researchInsights: string[] = [];
    if (deepResearch) {
      researchInsights = await analyzeCompanyInsights(jobDescription, companyName);
    }

    // Create the AI prompt
    const prompt = createCoverLetterPrompt({
      jobTitle,
      companyName,
      jobDescription,
      skills,
      experience,
      tone,
      length,
      keywords,
      deepResearch,
      researchInsights
    });

    // Generate content with AI
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    // Calculate ATS score
    const atsScore = await calculateATSScore(content, keywords, jobDescription);

    // Generate improvement suggestions
    const improvements = await generateImprovements(content, keywords, atsScore, deepResearch);

    const wordCount = content.split(/\s+/).length;

    return {
      content,
      atsScore,
      keywords: keywords.slice(0, 8),
      improvements,
      wordCount,
      deepResearch,
      researchInsights
    };

  } catch (error) {
    console.error('AI Cover Letter Generation Error:', error);
    throw new Error('Failed to generate cover letter with AI');
  }
}

/**
 * Analyze resume for ATS compatibility and suggestions
 */
export async function analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  try {
    const { resumeText, jobDescription } = request;

    const prompt = createResumeAnalysisPrompt(resumeText, jobDescription);

    const result = await model.generateContent(prompt);
    const analysis = result.response.text().trim();

    // Parse the AI response (assuming structured output)
    const parsedAnalysis = parseResumeAnalysis(analysis);

    return parsedAnalysis;

  } catch (error) {
    console.error('AI Resume Analysis Error:', error);
    throw new Error('Failed to analyze resume with AI');
  }
}

/**
 * Extract keywords from job description using AI
 */
async function extractKeywords(jobDescription: string, userSkills: string[]): Promise<string[]> {
  try {
    const prompt = `
Analyze this job description and extract the most important keywords and skills that would be valuable for ATS optimization. Focus on technical skills, soft skills, and industry-specific terms.

Job Description:
${jobDescription}

User Skills: ${userSkills.join(', ')}

Return a JSON array of the top 12 most relevant keywords/phrases. Focus on terms that are commonly searched by ATS systems.

Example format: ["JavaScript", "React", "Node.js", "Team Leadership", "Agile Methodology"]
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Try to parse as JSON, fallback to manual extraction
    try {
      const keywords = JSON.parse(response);
      return Array.isArray(keywords) ? keywords : [];
    } catch {
      // Fallback: extract common keywords manually
      return manualKeywordExtraction(jobDescription, userSkills);
    }

  } catch (error) {
    console.error('Keyword extraction error:', error);
    return manualKeywordExtraction(jobDescription, userSkills);
  }
}

/**
 * Analyze company insights from job description
 */
async function analyzeCompanyInsights(jobDescription: string, companyName: string): Promise<string[]> {
  try {
    const prompt = `
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

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    try {
      const insights = JSON.parse(response);
      return Array.isArray(insights) ? insights : [];
    } catch {
      return [
        `${companyName} emphasizes innovation and technology-driven solutions`,
        `Strong focus on collaboration and team-oriented work environment`,
        `Committed to professional development and continuous learning`
      ];
    }

  } catch (error) {
    console.error('Company insights analysis error:', error);
    return [
      `${companyName} emphasizes innovation and technology-driven solutions`,
      `Strong focus on collaboration and team-oriented work environment`,
      `Committed to professional development and continuous learning`
    ];
  }
}

/**
 * Calculate ATS score using AI analysis
 */
async function calculateATSScore(content: string, keywords: string[], jobDescription: string): Promise<number> {
  try {
    const prompt = `
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

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    const score = parseInt(response.match(/\d+/)?.[0] || '75');
    return Math.max(0, Math.min(100, score));

  } catch (error) {
    console.error('ATS scoring error:', error);
    // Fallback scoring
    return calculateFallbackATSScore(content, keywords);
  }
}

/**
 * Generate improvement suggestions
 */
async function generateImprovements(
  content: string,
  keywords: string[],
  atsScore: number,
  deepResearch: boolean
): Promise<string[]> {
  try {
    const prompt = `
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

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    try {
      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch {
      return [
        'Add specific quantifiable achievements',
        'Include more company-specific keywords',
        'Strengthen the opening statement',
        'Add relevant industry terminology'
      ];
    }

  } catch (error) {
    console.error('Improvement generation error:', error);
    return [
      'Add specific quantifiable achievements',
      'Include more company-specific keywords',
      'Strengthen the opening statement'
    ];
  }
}

/**
 * Create the AI prompt for cover letter generation
 */
function createCoverLetterPrompt(data: CoverLetterRequest & {
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
function createResumeAnalysisPrompt(resumeText: string, jobDescription?: string): string {
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
 * Parse AI response for resume analysis
 */
function parseResumeAnalysis(analysis: string): ResumeAnalysisResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        atsScore: Math.max(0, Math.min(100, parsed.atsScore || 75)),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : []
      };
    }
  } catch (error) {
    console.error('Failed to parse resume analysis:', error);
  }

  // Fallback response
  return {
    atsScore: 75,
    keywords: ['leadership', 'communication', 'problem-solving'],
    missingKeywords: ['specific technical skills'],
    suggestions: ['Add quantifiable achievements', 'Include more keywords from job description'],
    strengths: ['Clear structure', 'Good experience summary'],
    weaknesses: ['Could use more specific metrics', 'Missing some key industry terms']
  };
}

/**
 * Fallback keyword extraction
 */
function manualKeywordExtraction(jobDescription: string, userSkills: string[]): string[] {
  const commonKeywords = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
    'javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes',
    'agile', 'scrum', 'git', 'sql', 'nosql', 'mongodb', 'postgresql'
  ];

  const jobDescLower = jobDescription.toLowerCase();
  const foundKeywords = commonKeywords.filter(keyword =>
    jobDescLower.includes(keyword.toLowerCase())
  );

  const matchingSkills = userSkills.filter(skill =>
    jobDescLower.includes(skill.toLowerCase())
  );

  return [...new Set([...foundKeywords, ...matchingSkills])].slice(0, 12);
}

/**
 * Fallback ATS scoring
 */
function calculateFallbackATSScore(content: string, keywords: string[]): number {
  let score = 50; // Base score

  const contentWords = content.toLowerCase().split(/\s+/);
  const matchedKeywords = keywords.filter(keyword =>
    contentWords.some(word => word.toLowerCase().includes(keyword.toLowerCase()))
  );

  score += (matchedKeywords.length / keywords.length) * 30;

  const wordCount = content.split(' ').length;
  if (wordCount >= 200 && wordCount <= 400) {
    score += 10;
  }

  if (content.includes('Dear') && content.includes('Best regards')) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}