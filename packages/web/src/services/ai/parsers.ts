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
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : []
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

/**
 * Fallback ATS scoring
 */
export function calculateFallbackATSScore(content: string, keywords: string[]): number {
  let score = 50;

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

// ============ INTERVIEW EVALUATION ============

export interface InterviewAnswerEvaluation {
  overall_score: number;
  content_score: number;
  clarity_score: number;
  relevance_score: number;
  structure_score: number;
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  suggestions: string[];
  estimated_response_quality: "Poor" | "Fair" | "Good" | "Excellent";
}

/**
 * Fallback evaluation using heuristics when AI fails
 */
export function generateFallbackEvaluation(
  question: string,
  answer: string,
  category: string,
  difficulty: string
): InterviewAnswerEvaluation {
  const wordCount = answer.split(/\s+/).length;
  const hasSTAR =
    answer.toLowerCase().includes("situation") ||
    answer.toLowerCase().includes("task") ||
    answer.toLowerCase().includes("action") ||
    answer.toLowerCase().includes("result");

  let content_score = Math.min(100, Math.max(20, (wordCount / 150) * 70 + 30));
  let clarity_score = Math.min(100, Math.max(30, 100 - (answer.split(/[.!?]/).length > wordCount / 15 ? 20 : 0)));
  let relevance_score = Math.min(100, Math.max(40, 70 + Math.random() * 20));
  let structure_score = hasSTAR ? Math.min(100, 60 + Math.random() * 30) : Math.max(30, 40 + Math.random() * 20);

  const overall_score = Math.round((content_score + clarity_score + relevance_score + structure_score) / 4);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];

  if (wordCount > 50) strengths.push("Good level of detail in your response");
  if (hasSTAR) strengths.push("Good use of structured approach");
  if (wordCount < 30) improvements.push("Answer could be more detailed with specific examples");
  if (!hasSTAR && category === "behavioral") {
    improvements.push("Consider using the STAR method for behavioral questions");
    suggestions.push("Structure your answer: Situation, Task, Action, Result");
  }

  if (category === "technical") {
    suggestions.push("For technical questions, walk through your problem-solving process step by step");
  }
  if (category === "leadership") {
    suggestions.push("Highlight specific examples of your leadership impact and team influence");
  }

  const estimated_response_quality: "Poor" | "Fair" | "Good" | "Excellent" =
    overall_score >= 85 ? "Excellent" :
      overall_score >= 70 ? "Good" :
        overall_score >= 50 ? "Fair" : "Poor";

  return {
    overall_score,
    content_score: Math.round(content_score),
    clarity_score: Math.round(clarity_score),
    relevance_score: Math.round(relevance_score),
    structure_score: Math.round(structure_score),
    strengths: strengths.length > 0 ? strengths : ["You provided a response to the question"],
    improvements: improvements.length > 0 ? improvements : ["Continue practicing to refine your answers"],
    detailed_feedback: `Your answer received a score of ${overall_score}/100. ${overall_score >= 70
        ? "This is a good response that demonstrates interview readiness."
        : "This response has room for improvement."
      } Focus on providing specific examples and structuring your answers clearly.`,
    suggestions: suggestions.length > 0 ? suggestions : ["Practice with more questions to build confidence"],
    estimated_response_quality,
  };
}
