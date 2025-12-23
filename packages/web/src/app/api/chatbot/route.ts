import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import { ServiceUnavailableError, ValidationError } from "@/lib/api/errorResponse";

export { OPTIONS };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("GEMINI_API_KEY is not configured. NEXT_PUBLIC_GEMINI_API_KEY is set but ignored to keep the key server-side.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Job/Career related keywords for guardrails
const ALLOWED_TOPICS = [
  'job', 'career', 'resume', 'cv', 'application', 'hiring', 'employment',
  'work', 'professional', 'salary', 'compensation', 'benefits', 'skills', 'experience',
  'networking', 'linkedin', 'cover letter', 'portfolio', 'freelance', 'startup',
  'management', 'leadership', 'team', 'project', 'deadline', 'performance', 'promotion',
  'negotiation', 'contract', 'remote', 'hybrid', 'office', 'company', 'industry',
  'technology', 'software', 'engineering', 'design', 'marketing', 'sales', 'finance',
  'hr', 'recruitment', 'training', 'development', 'growth', 'success', 'achievement'
];

// Check if message is related to allowed topics
function isJobRelated(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();

  // Check for explicit job/career keywords
  const hasAllowedTopic = ALLOWED_TOPICS.some(topic =>
    lowercaseMessage.includes(topic)
  );

  // Check for common job-related question patterns
  const jobQuestionPatterns = [
    /how (do|can|should|to)/i,
    /what (is|are|should|do)/i,
    /can you (help|tell|explain)/i,
    /i (want|need|have|am)/i,
    /(advice|tips?|guidance|help)/i,
    /(looking for|seeking|applying)/i,
    /(resume|job|career)/i
  ];

  const hasQuestionPattern = jobQuestionPatterns.some(pattern =>
    pattern.test(lowercaseMessage)
  );

  return hasAllowedTopic || hasQuestionPattern;
}

// Generate guardrail response for off-topic questions
function getGuardrailResponse(): string {
  return `I'm Hireall's AI career assistant, specialized in helping with job search, career development, and professional growth. 

I can help you with:
• Resume and CV optimization
• Career planning and advice
• Job search strategies
• Salary negotiation tips
• Professional networking guidance
• Skill development recommendations

What career-related question can I help you with today?`;
}

function sanitizeResponse(text: string): string {
  if (!text) {
    return "";
  }

  const normalized = text.replace(/\r\n/g, "\n");

  const withoutMarkdown = normalized
    // Convert markdown bullets to bullet character
    .replace(/^\s*[-*]\s+/gm, "• ")
    // Remove bold/italic markers while keeping content
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");

  const withoutAsterisks = withoutMarkdown.replace(/\*/g, "");

  return withoutAsterisks.replace(/\n{3,}/g, "\n\n").trim();
}

const chatbotSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.string().optional(),
});

export const POST = withApi({
  auth: 'optional',
  rateLimit: 'chatbot',
  bodySchema: chatbotSchema,
}, async ({ body }) => {
  const { message, context } = body;

  // Check guardrails - only allow job/career related questions
  if (!isJobRelated(message)) {
    return {
      response: getGuardrailResponse(),
      isJobRelated: false
    };
  }

  if (!GEMINI_API_KEY || !genAI) {
    throw new ServiceUnavailableError(
      "AI service not configured. Missing GEMINI_API_KEY.",
      "gemini"
    );
  }

  try {
    // Use the correct model name for Gemini API
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Create system prompt with context about being a career assistant
    const systemPrompt = `You are Hireall AI, a specialized career and job search assistant. You help users with:

- Job search strategies and applications
- Resume/CV writing and optimization
- Career planning and development
- Salary negotiation and compensation
- Professional networking and LinkedIn optimization
- Skill development and learning paths
- Workplace challenges and solutions
- Industry insights and trends

IMPORTANT RULES:
1. Stay focused on career and professional development topics
2. Provide practical, actionable advice
3. Be encouraging and supportive
4. Use professional, friendly language
5. If asked about non-career topics, politely redirect to career advice
6. Keep responses concise but comprehensive
7. Use clean formatting with simple numbered lists (1. 2. 3.) or bullet points (•)
8. NEVER use asterisks (*) for formatting - use • for bullets instead
9. Add proper line breaks between sections for readability
10. Include specific examples when helpful
11. End responses with relevant follow-up questions when appropriate

User question: ${message}

${context ? `Additional context: ${context}` : ''}

Respond as Hireall AI with clean, readable formatting:`;

    // Generate response (prefer message array format for future extensibility)
    const result = await model.generateContent([systemPrompt]);
    const response = await result.response;
    const generatedText = sanitizeResponse(response.text().trim());

    return {
      response: generatedText,
      isJobRelated: true
    };
  } catch (error: any) {
    console.error("Chatbot API error:", error);
    const errorMessage = error.message || String(error);

    if (errorMessage.includes("403") || errorMessage.includes("unregistered") || errorMessage.includes("Forbidden")) {
      throw new ServiceUnavailableError(
        "Access to AI model forbidden. Verify billing & API key permissions for Gemini.",
        "gemini"
      );
    }
    if (errorMessage.includes("API_KEY") || errorMessage.includes("Missing API key")) {
      throw new ServiceUnavailableError(
        "AI service not configured. Please add GEMINI_API_KEY on the server.",
        "gemini"
      );
    }
    if (errorMessage.toLowerCase().includes("safety")) {
      throw new ValidationError(
        "I can't provide a response for that request due to content guidelines.",
        "content"
      );
    }
    throw error;
  }
});
