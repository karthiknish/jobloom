import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('GEMINI_API_KEY is not configured. NEXT_PUBLIC_GEMINI_API_KEY is set but ignored to protect the server key.');
}

let genAI: GoogleGenerativeAI | null = null;
const modelCache = new Map<string, GenerativeModel>();
const DEFAULT_MODEL = 'gemini-2.0-flash';

// ============ ROBUSTNESS UTILITIES ============

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

const CIRCUIT_BREAKER_THRESHOLD = 5; // Open after 5 failures
const CIRCUIT_BREAKER_RESET_MS = 60 * 1000; // Reset after 1 minute

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;
const TIMEOUT_MS = 30000; // 30 second timeout per request

// Simple response cache for deduplication
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache

/**
 * Execute a promise with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoff(attempt: number): number {
  const exponentialDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Check and update circuit breaker state
 */
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  // Reset circuit if enough time has passed
  if (circuitBreaker.isOpen && now - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    console.log('[Gemini] Circuit breaker reset');
  }
  
  return circuitBreaker.isOpen;
}

/**
 * Record a failure for circuit breaker
 */
function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    console.warn(`[Gemini] Circuit breaker opened after ${circuitBreaker.failures} failures`);
  }
}

/**
 * Record success - reduces failure count
 */
function recordSuccess(): void {
  if (circuitBreaker.failures > 0) {
    circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
  }
}

/**
 * Generate cache key from prompt
 */
function getCacheKey(prompt: string): string {
  // Simple hash - first 100 chars + length
  return `${prompt.slice(0, 100)}_${prompt.length}`;
}

/**
 * Get cached response if available and fresh
 */
function getCachedResponse(cacheKey: string): string | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[Gemini] Cache hit');
    return cached.response;
  }
  return null;
}

/**
 * Store response in cache
 */
function cacheResponse(cacheKey: string, response: string): void {
  // Limit cache size
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
}

/**
 * Robust AI content generation with retry, timeout, and circuit breaker
 */
async function generateContentRobust(
  prompt: string,
  options: { useCache?: boolean; operation?: string } = {}
): Promise<string> {
  const { useCache = true, operation = 'AI generation' } = options;
  
  // Check circuit breaker
  if (checkCircuitBreaker()) {
    throw new Error('AI service temporarily unavailable. Please try again in a moment.');
  }
  
  // Check cache
  const cacheKey = getCacheKey(prompt);
  if (useCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const model = getModel();
      
      const result = await withTimeout(
        model.generateContent(prompt),
        TIMEOUT_MS,
        operation
      );
      
      const response = result.response.text().trim();
      
      if (!response) {
        throw new Error('Empty response from AI');
      }
      
      // Success - record and cache
      recordSuccess();
      if (useCache) {
        cacheResponse(cacheKey, response);
      }
      
      return response;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Gemini] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (lastError.message.includes('API key') || lastError.message.includes('not configured')) {
        throw lastError;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < MAX_RETRIES - 1) {
        const delay = calculateBackoff(attempt);
        console.log(`[Gemini] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  recordFailure();
  throw lastError || new Error(`${operation} failed after ${MAX_RETRIES} attempts`);
}

/**
 * Safe JSON parse with validation
 */
function safeParseJSON<T>(text: string, validator?: (data: unknown) => data is T): T | null {
  try {
    // Clean markdown code fences
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    // Extract JSON object or array
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (validator && !validator(parsed)) {
      return null;
    }
    
    return parsed as T;
  } catch {
    return null;
  }
}

// ============ END ROBUSTNESS UTILITIES ============

function getModel(modelName: string = DEFAULT_MODEL): GenerativeModel {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY on the server.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  const cached = modelCache.get(modelName);
  if (cached) {
    return cached;
  }

  const created = genAI.getGenerativeModel({ model: modelName });
  modelCache.set(modelName, created);
  return created;
}

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

export interface ResumeGenerationRequest {
  jobTitle: string;
  experience: string;
  skills: string[];
  education: string;
  industry: string;
  level: 'entry' | 'mid' | 'senior' | 'executive' | string;
  style: 'modern' | 'classic' | 'creative' | 'tech' | string;
  includeObjective: boolean;
  atsOptimization: boolean;
  aiEnhancement: boolean;
}

export interface ResumeGenerationResult {
  content: string;
  summary: string;
  experience: string;
  skills: string;
  education: string;
}

export interface MockInterviewQuestion {
  id: string;
  question: string;
  type: "behavioral" | "technical" | "situational" | "leadership";
  category: string;
  difficulty: string;
  timeLimit: number;
  followUpQuestions?: string[];
}

export interface MockInterviewGenerationRequest {
  role: string;
  experience: string;
  duration: number;
  focus: string[];
}

export interface EditorContentRequest {
  prompt: string;
  tone?: 'professional' | 'approachable' | 'enthusiastic' | string;
  audience?: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  format?: 'plain' | 'bullet' | string;
}

/**
 * Generate a personalized cover letter using AI
 * Uses robust generation with retry, timeout, and circuit breaker
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

    // Validate inputs
    if (!jobTitle || !companyName || !jobDescription) {
      console.warn('[Cover Letter] Missing required fields');
      return getFallbackCoverLetter(request, 'Missing required fields');
    }

    // Extract keywords from job description
    const keywords = await extractKeywords(jobDescription, skills);

    // Generate company insights if deep research is requested
    let researchInsights: string[] = [];
    if (deepResearch) {
      try {
        researchInsights = await analyzeCompanyInsights(jobDescription, companyName);
      } catch (error) {
        console.warn('[Cover Letter] Company insights failed, continuing without:', error);
      }
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

    // Generate content with robust AI call
    const content = await generateContentRobust(prompt, {
      useCache: false, // Each cover letter should be unique
      operation: 'Cover letter generation'
    });

    // Calculate ATS score with error handling
    let atsScore = 75;
    try {
      atsScore = await calculateATSScore(content, keywords, jobDescription);
    } catch (error) {
      console.warn('[Cover Letter] ATS scoring failed, using default:', error);
    }

    // Generate improvement suggestions with error handling
    let improvements: string[] = [];
    try {
      improvements = await generateImprovements(content, keywords, atsScore, deepResearch);
    } catch (error) {
      console.warn('[Cover Letter] Improvements generation failed:', error);
      improvements = ['Review for keyword optimization', 'Add quantifiable achievements'];
    }

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
    return getFallbackCoverLetter(request, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Fallback cover letter when AI generation fails
 */
function getFallbackCoverLetter(request: CoverLetterRequest, reason: string): CoverLetterResponse {
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

/**
 * Analyze resume for ATS compatibility and suggestions
 * Uses robust generation with retry, timeout, and circuit breaker
 */
export async function analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  try {
    const { resumeText, jobDescription } = request;

    // Validate input
    if (!resumeText || resumeText.trim().length < 50) {
      console.warn('[Resume Analysis] Resume text too short, returning fallback');
      return getFallbackResumeAnalysis('Resume text is too short for meaningful analysis');
    }

    const prompt = createResumeAnalysisPrompt(resumeText, jobDescription);

    // Use robust generation with retry and timeout
    const analysis = await generateContentRobust(prompt, {
      useCache: false, // Each resume is unique
      operation: 'Resume analysis'
    });

    // Parse with safe JSON parser
    const parsedAnalysis = parseResumeAnalysis(analysis);

    return parsedAnalysis;

  } catch (error) {
    console.error('AI Resume Analysis Error:', error);
    // Return graceful fallback instead of throwing
    return getFallbackResumeAnalysis(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Fallback response when AI analysis fails
 */
function getFallbackResumeAnalysis(reason: string): ResumeAnalysisResponse {
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

export async function generateResumeWithAI(request: ResumeGenerationRequest): Promise<ResumeGenerationResult> {
  try {
    const prompt = createResumeGenerationPrompt(request);
    
    // Use robust generation with retry and timeout
    const raw = await generateContentRobust(prompt, {
      useCache: false, // Each generation should be unique
      operation: 'Resume generation'
    });
    
    return parseResumeGenerationResponse(raw);
  } catch (error) {
    console.error('AI Resume Generation Error:', error);
    // Return a basic template instead of failing
    return getFallbackResumeGeneration(request);
  }
}

/**
 * Fallback response when AI generation fails
 */
function getFallbackResumeGeneration(request: ResumeGenerationRequest): ResumeGenerationResult {
  console.log('[Resume Generation] Using fallback template');
  return {
    summary: `Experienced ${request.level || ''} ${request.jobTitle} with expertise in ${request.industry || 'the industry'}. ${request.experience || 'Proven track record of delivering results.'}`,
    experience: request.experience || 'Please add your work experience here.',
    skills: request.skills?.join(', ') || 'Please add your skills here.',
    education: request.education || 'Please add your education here.',
    content: `PROFESSIONAL SUMMARY\n${request.experience || 'Add your summary here.'}\n\nSKILLS\n${request.skills?.join(', ') || 'Add skills'}\n\nEDUCATION\n${request.education || 'Add education'}`
  };
}

/**
 * Generate mock interview questions using AI
 */
export async function generateMockInterviewQuestions(request: MockInterviewGenerationRequest): Promise<MockInterviewQuestion[]> {
  try {
    const { role, experience, duration, focus } = request;
    const questionCount = Math.floor(duration / 8); // ~8 minutes per question

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
    // Fallback to empty array or throw, caller should handle
    throw new Error('Failed to generate mock interview questions with AI');
  }
}

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
  if (!text) {
    return '';
  }

  const normalized = text.replace(/\r\n/g, '\n').trim();
  // Remove code fences
  const withoutFences = normalized
    .replace(/```(?:html|[a-zA-Z0-9_-]+)?\n?/gi, '')
    .replace(/```/g, '');
  const collapsed = withoutFences.replace(/\n{3,}/g, '\n\n').trim();

  if (format === 'html') {
    // If it looks like HTML already, return it cleaned up
    if (collapsed.includes('<p>') || collapsed.includes('<h') || collapsed.includes('<ul>')) {
      return collapsed;
    }
    // Convert plain text to HTML paragraphs
    return collapsed
      .split('\n\n')
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para) => `<p>${para}</p>`)
      .join('\n');
  }

  if (format === 'bullet') {
    const lines = collapsed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Remove existing bullet characters
        if (line.startsWith('• ')) return line.slice(2);
        if (line.startsWith('- ')) return line.slice(2);
        if (line.startsWith('* ')) return line.slice(2);
        if (line.match(/^\d+\.\s/)) return line.replace(/^\d+\.\s/, '');
        return line;
      });

    // Return as HTML unordered list
    return `<ul>\n${lines.map((line) => `  <li>${line}</li>`).join('\n')}\n</ul>`;
  }

  return collapsed;
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

    const model = getModel();
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

    const model = getModel();
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

function createResumeGenerationPrompt(request: ResumeGenerationRequest): string {
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
- Use \\\n within string values for line breaks.
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

function parseResumeGenerationResponse(raw: string): ResumeGenerationResult {
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
  } catch (error) {
    throw new Error('Failed to parse AI resume JSON');
  }

  const toText = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value.replace(/\\n/g, '\n').trim();
    if (Array.isArray(value)) {
      return value
        .map((item) => toText(item))
        .filter(Boolean)
        .join('\n');
    }
    if (typeof value === 'object') {
      return Object.values(value)
        .map((item) => toText(item))
        .filter(Boolean)
        .join('\n');
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

  return {
    summary,
    experience,
    skills,
    education,
    content,
  };
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

// ============================================
// Interview Answer Evaluation
// ============================================

export interface InterviewAnswerEvaluationRequest {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

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
 * Evaluate an interview answer using AI
 */
export async function evaluateInterviewAnswer(
  request: InterviewAnswerEvaluationRequest
): Promise<InterviewAnswerEvaluation> {
  const { question, answer, category, difficulty } = request;

  const prompt = `You are an expert interview coach. Evaluate this interview answer and provide comprehensive feedback.

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

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parse AI response
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
    // Return fallback evaluation based on heuristics
    return generateFallbackEvaluation(question, answer, category, difficulty);
  }
}

/**
 * Fallback evaluation using heuristics when AI fails
 */
function generateFallbackEvaluation(
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

  // Calculate scores based on answer characteristics
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