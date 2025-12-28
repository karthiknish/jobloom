/**
 * AI Response Parsers and Fallbacks
 * 
 * Parsing logic and fallback generators.
 */

import type {
  CoverLetterRequest,
  CoverLetterResponse,
  ResumeAnalysisResponse,
  ResumeGenerationRequest,
  ResumeGenerationResult,
} from './types';

// ============ COVER LETTER ============

/**
 * Fallback cover letter when AI generation fails
 */
export function getFallbackCoverLetter(request: CoverLetterRequest, reason: string): CoverLetterResponse {
  console.log(`[Cover Letter] Using fallback. Reason: ${reason}`);
  
  const { jobTitle, companyName, skills, experience } = request;
  const skillsList = skills?.slice(0, 3).join(', ') || 'relevant skills';
  
  return {
    content: `Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle} position at ${companyName}. With my background in ${skillsList}, I am confident in my ability to contribute to your team.

${experience || 'Throughout my career, I have developed strong expertise in this field and am eager to bring my skills to your organization.'}

I am excited about the opportunity to join ${companyName} and would welcome the chance to discuss how my experience aligns with your needs.

Thank you for your consideration.

Sincerely,
[Your Name]`,
    atsScore: 60,
    keywords: skills?.slice(0, 8) || [],
    improvements: [
      'Customize this template with specific achievements',
      'Add quantifiable metrics to demonstrate impact',
      'Include more company-specific references'
    ],
    wordCount: 100,
    deepResearch: false,
    researchInsights: []
  };
}

// ============ RESUME ANALYSIS ============

/**
 * Parse AI response for resume analysis
 */
export function parseResumeAnalysis(analysis: string): ResumeAnalysisResponse {
  try {
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        atsScore: Math.max(0, Math.min(100, parsed.atsScore || 75)),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        parsedData: parsed.parsedData || undefined
      };
    }
  } catch (error) {
    console.error('Failed to parse resume analysis:', error);
  }

  return getFallbackResumeAnalysis('Parse error');
}

/**
 * Fallback response when AI analysis fails
 */
export function getFallbackResumeAnalysis(reason: string): ResumeAnalysisResponse {
  console.log(`[Resume Analysis] Using fallback response. Reason: ${reason}`);
  return {
    atsScore: 60,
    keywords: ['professional', 'experience', 'skills'],
    missingKeywords: ['specific technical skills', 'quantifiable achievements'],
    suggestions: [
      'Add quantifiable achievements with specific metrics',
      'Include more industry-specific keywords',
      'Ensure contact information is complete',
      'Consider adding a professional summary'
    ],
    strengths: ['Resume provided for analysis'],
    weaknesses: ['AI analysis temporarily unavailable - using basic evaluation']
  };
}

// ============ RESUME GENERATION ============

/**
 * Parse resume generation response
 */
export function parseResumeGenerationResponse(raw: string): ResumeGenerationResult {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Missing JSON object in AI resume response');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Failed to parse AI resume JSON');
  }

  const toText = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value.replace(/\\n/g, '\n').trim();
    if (Array.isArray(value)) {
      return value.map((item) => toText(item)).filter(Boolean).join('\n');
    }
    if (typeof value === 'object') {
      return Object.values(value).map((item) => toText(item)).filter(Boolean).join('\n');
    }
    return String(value);
  };

  const summary = toText(parsed.summary);
  const experience = toText(parsed.experience);
  const skills = toText(parsed.skills);
  const education = toText(parsed.education);
  const content = toText(parsed.content);

  if (!summary && !experience && !skills && !education && !content) {
    throw new Error('AI resume response was empty');
  }

  return { summary, experience, skills, education, content };
}

/**
 * Fallback response when AI generation fails
 */
export function getFallbackResumeGeneration(request: ResumeGenerationRequest): ResumeGenerationResult {
  console.log('[Resume Generation] Using fallback template');
  return {
    summary: `Experienced ${request.level || ''} ${request.jobTitle} with expertise in ${request.industry || 'the industry'}. ${request.experience || 'Proven track record of delivering results.'}`,
    experience: request.experience || 'Please add your work experience here.',
    skills: request.skills?.join(', ') || 'Please add your skills here.',
    education: request.education || 'Please add your education here.',
    content: `PROFESSIONAL SUMMARY\n${request.experience || 'Add your summary here.'}\n\nSKILLS\n${request.skills?.join(', ') || 'Add skills'}\n\nEDUCATION\n${request.education || 'Add education'}`
  };
}

// ============ KEYWORD EXTRACTION ============

/**
 * Fallback keyword extraction
 */
export function manualKeywordExtraction(jobDescription: string, userSkills: string[]): string[] {
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

// End of parsers.ts
