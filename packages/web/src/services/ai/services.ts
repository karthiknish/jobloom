/**
 * AI Services
 * 
 * Main service functions that use the modular components.
 */

import { getModel, generateContentRobust, safeParseJSON } from './robust-client';
import {
  createCoverLetterPrompt,
  createResumeAnalysisPrompt,
  createResumeGenerationPrompt,
  createATSScorePrompt,
  createImprovementsPrompt,
  createKeywordExtractionPrompt,
  createCompanyInsightsPrompt,
  createInterviewEvaluationPrompt,
} from './prompts';
import {
  getFallbackCoverLetter,
  parseResumeAnalysis,
  getFallbackResumeAnalysis,
  parseResumeGenerationResponse,
  getFallbackResumeGeneration,
  manualKeywordExtraction,
  calculateFallbackATSScore,
  generateFallbackEvaluation,
  type InterviewAnswerEvaluation,
} from './parsers';
import type {
  CoverLetterRequest,
  CoverLetterResponse,
  ResumeAnalysisRequest,
  ResumeAnalysisResponse,
  ResumeGenerationRequest,
  ResumeGenerationResult,
  MockInterviewQuestion,
  MockInterviewGenerationRequest,
  EditorContentRequest,
} from './types';

// ============ COVER LETTER ============

export async function generateCoverLetter(request: CoverLetterRequest): Promise<CoverLetterResponse> {
  try {
    const { jobTitle, companyName, jobDescription, skills, experience, tone, length, deepResearch = false } = request;

    if (!jobTitle || !companyName || !jobDescription) {
      console.warn('[Cover Letter] Missing required fields');
      return getFallbackCoverLetter(request, 'Missing required fields');
    }

    const keywords = await extractKeywords(jobDescription, skills);

    let researchInsights: string[] = [];
    if (deepResearch) {
      try {
        researchInsights = await analyzeCompanyInsights(jobDescription, companyName);
      } catch (error) {
        console.warn('[Cover Letter] Company insights failed, continuing without:', error);
      }
    }

    const prompt = createCoverLetterPrompt({
      jobTitle, companyName, jobDescription, skills, experience, tone, length,
      keywords, deepResearch, researchInsights
    });

    const content = await generateContentRobust(prompt, {
      useCache: false,
      operation: 'Cover letter generation'
    });

    let atsScore = 75;
    try {
      atsScore = await calculateATSScore(content, keywords, jobDescription);
    } catch (error) {
      console.warn('[Cover Letter] ATS scoring failed, using default:', error);
    }

    let improvements: string[] = [];
    try {
      improvements = await generateImprovements(content, keywords, atsScore, deepResearch);
    } catch (error) {
      console.warn('[Cover Letter] Improvements generation failed:', error);
      improvements = ['Review for keyword optimization', 'Add quantifiable achievements'];
    }

    return {
      content,
      atsScore,
      keywords: keywords.slice(0, 8),
      improvements,
      wordCount: content.split(/\s+/).length,
      deepResearch,
      researchInsights
    };
  } catch (error) {
    console.error('AI Cover Letter Generation Error:', error);
    return getFallbackCoverLetter(request, error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============ RESUME ANALYSIS ============

export async function analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  try {
    const { resumeText, jobDescription } = request;

    if (!resumeText || resumeText.trim().length < 50) {
      console.warn('[Resume Analysis] Resume text too short, returning fallback');
      return getFallbackResumeAnalysis('Resume text is too short for meaningful analysis');
    }

    const prompt = createResumeAnalysisPrompt(resumeText, jobDescription);
    const analysis = await generateContentRobust(prompt, {
      useCache: false,
      operation: 'Resume analysis'
    });

    return parseResumeAnalysis(analysis);
  } catch (error) {
    console.error('AI Resume Analysis Error:', error);
    return getFallbackResumeAnalysis(error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============ RESUME GENERATION ============

export async function generateResumeWithAI(request: ResumeGenerationRequest): Promise<ResumeGenerationResult> {
  try {
    const prompt = createResumeGenerationPrompt(request);
    const raw = await generateContentRobust(prompt, {
      useCache: false,
      operation: 'Resume generation'
    });
    return parseResumeGenerationResponse(raw);
  } catch (error) {
    console.error('AI Resume Generation Error:', error);
    return getFallbackResumeGeneration(request);
  }
}

// ============ MOCK INTERVIEW ============

export async function generateMockInterviewQuestions(
  request: MockInterviewGenerationRequest
): Promise<MockInterviewQuestion[]> {
  try {
    const { role, experience, duration, focus } = request;
    const questionCount = Math.floor(duration / 8);

    const prompt = `
Generate a set of ${questionCount} mock interview questions for a ${experience} ${role} position.
Focus areas: ${focus.join(', ')}.

Return a JSON array of objects with this structure:
{
  "id": "question-1",
  "question": "The interview question",
  "type": "behavioral" | "technical" | "situational" | "leadership",
  "category": "Specific category (e.g., System Design, Conflict Resolution)",
  "difficulty": "Easy" | "Medium" | "Hard",
  "timeLimit": number (in minutes, usually 5-10),
  "followUpQuestions": ["Follow up 1", "Follow up 2"]
}

Ensure the questions are diverse and appropriate for the experience level.
Return ONLY the JSON array.
`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleaned);

    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error('AI Mock Interview Generation Error:', error);
    throw new Error('Failed to generate mock interview questions with AI');
  }
}

// ============ EDITOR CONTENT ============

export async function generateEditorContent(request: EditorContentRequest): Promise<string> {
  const {
    prompt,
    tone = 'professional',
    audience = 'Hireall readers',
    keywords = [],
    length = 'medium',
    format = 'plain',
  } = request;

  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  if (!trimmedPrompt) {
    throw new Error('Prompt is required to generate content');
  }

  const lengthGuide: Record<string, string> = {
    short: '120-180 words',
    medium: '220-320 words',
    long: '350-500 words',
  };

  const keywordLine = keywords.length > 0
    ? `Important keywords to incorporate: ${keywords.join(', ')}`
    : 'Prioritize clarity and actionable insights for job seekers.';

  const formatGuide = format === 'bullet'
    ? 'Present the response as a bullet point list. Use <ul> and <li> tags for the list.'
    : format === 'html'
      ? 'Output content as semantic HTML using <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em> tags as appropriate. Do NOT use markdown formatting or code fences.'
      : 'Use short paragraphs with clear transitions. Output as plain text without any markdown or code fences.';

  const systemPrompt = `You are Hireall's editorial assistant helping create career content that is practical, original, and on-brand.

Topic: ${trimmedPrompt}
Audience: ${audience}
Tone: ${tone}
${keywordLine}
Target length: ${lengthGuide[length] ?? lengthGuide.medium}

Guidelines:
1. Deliver factual, career-focused advice tailored to the topic.
2. Maintain a ${tone} tone that aligns with Hireall's professional voice.
3. Provide actionable takeaways the reader can apply immediately.
4. Avoid mentioning that you are an AI model or referencing this prompt.
5. ${formatGuide}
6. Do not include introductions about the article-writing process.
7. Eliminate filler phrases and keep sentences concise.

Return the final content only. No explanations or metadata.`;

  try {
    const model = getModel();
    const result = await model.generateContent(systemPrompt);
    const raw = result.response.text();
    return sanitizeEditorContent(raw, format);
  } catch (error) {
    console.error('Editor content generation error:', error);
    throw new Error('Failed to generate editor content with AI');
  }
}

function sanitizeEditorContent(text: string, format: string): string {
  if (!text) return '';

  const normalized = text.replace(/\r\n/g, '\n').trim();
  const withoutFences = normalized.replace(/```(?:html|[a-zA-Z0-9_-]+)?\n?/gi, '').replace(/```/g, '');
  const collapsed = withoutFences.replace(/\n{3,}/g, '\n\n').trim();

  if (format === 'html') {
    if (collapsed.includes('<p>') || collapsed.includes('<h') || collapsed.includes('<ul>')) {
      return collapsed;
    }
    return collapsed.split('\n\n').map((para) => para.trim()).filter(Boolean).map((para) => `<p>${para}</p>`).join('\n');
  }

  if (format === 'bullet') {
    const lines = collapsed.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      if (line.startsWith('• ')) return line.slice(2);
      if (line.startsWith('- ')) return line.slice(2);
      if (line.startsWith('* ')) return line.slice(2);
      if (line.match(/^\d+\.\s/)) return line.replace(/^\d+\.\s/, '');
      return line;
    });
    return `<ul>\n${lines.map((line) => `  <li>${line}</li>`).join('\n')}\n</ul>`;
  }

  return collapsed;
}

// ============ INTERVIEW EVALUATION ============

export interface InterviewAnswerEvaluationRequest {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

export { type InterviewAnswerEvaluation };

export async function evaluateInterviewAnswer(
  request: InterviewAnswerEvaluationRequest
): Promise<InterviewAnswerEvaluation> {
  const { question, answer, category, difficulty } = request;
  const prompt = createInterviewEvaluationPrompt(question, answer, category, difficulty);

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overall_score: Math.max(0, Math.min(100, parsed.overall_score || 50)),
        content_score: Math.max(0, Math.min(100, parsed.content_score || 50)),
        clarity_score: Math.max(0, Math.min(100, parsed.clarity_score || 50)),
        relevance_score: Math.max(0, Math.min(100, parsed.relevance_score || 50)),
        structure_score: Math.max(0, Math.min(100, parsed.structure_score || 50)),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        detailed_feedback: parsed.detailed_feedback || "Unable to generate detailed feedback.",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        estimated_response_quality: parsed.estimated_response_quality || "Fair",
      };
    }

    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("AI Interview Evaluation Error:", error);
    return generateFallbackEvaluation(question, answer, category, difficulty);
  }
}

// ============ HELPER FUNCTIONS ============

async function extractKeywords(jobDescription: string, userSkills: string[]): Promise<string[]> {
  try {
    const prompt = createKeywordExtractionPrompt(jobDescription, userSkills);
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    try {
      const keywords = JSON.parse(response);
      return Array.isArray(keywords) ? keywords : [];
    } catch {
      return manualKeywordExtraction(jobDescription, userSkills);
    }
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return manualKeywordExtraction(jobDescription, userSkills);
  }
}

async function analyzeCompanyInsights(jobDescription: string, companyName: string): Promise<string[]> {
  try {
    const prompt = createCompanyInsightsPrompt(jobDescription, companyName);
    const model = getModel();
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

async function calculateATSScore(content: string, keywords: string[], jobDescription: string): Promise<number> {
  try {
    const prompt = createATSScorePrompt(content, keywords, jobDescription);
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    const score = parseInt(response.match(/\d+/)?.[0] || '75');
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('ATS scoring error:', error);
    return calculateFallbackATSScore(content, keywords);
  }
}

async function generateImprovements(
  content: string,
  keywords: string[],
  atsScore: number,
  deepResearch: boolean
): Promise<string[]> {
  try {
    const prompt = createImprovementsPrompt(content, keywords, atsScore, deepResearch);
    const model = getModel();
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
