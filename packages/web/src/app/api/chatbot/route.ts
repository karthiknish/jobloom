import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Job/Career related keywords for guardrails
const ALLOWED_TOPICS = [
  'job', 'career', 'interview', 'resume', 'cv', 'application', 'hiring', 'employment',
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
    /(interview|resume|job|career)/i
  ];

  const hasQuestionPattern = jobQuestionPatterns.some(pattern =>
    pattern.test(lowercaseMessage)
  );

  return hasAllowedTopic || hasQuestionPattern;
}

// Generate guardrail response for off-topic questions
function getGuardrailResponse(): string {
  return `I'm Jobloom's AI career assistant, specialized in helping with job search, career development, interview preparation, and professional growth. 

I can help you with:
• Resume and CV optimization
• Interview preparation and practice
• Career planning and advice
• Job search strategies
• Salary negotiation tips
• Professional networking guidance
• Skill development recommendations

What career-related question can I help you with today?`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Check guardrails - only allow job/career related questions
    if (!isJobRelated(message)) {
      return NextResponse.json({
        response: getGuardrailResponse(),
        isJobRelated: false
      });
    }

    // Create the model with appropriate configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // Create system prompt with context about being a career assistant
    const systemPrompt = `You are Jobloom AI, a specialized career and job search assistant. You help users with:

- Job search strategies and applications
- Resume/CV writing and optimization
- Interview preparation and practice
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
7. Include specific examples when helpful
8. End responses with relevant follow-up questions when appropriate

User question: ${message}

${context ? `Additional context: ${context}` : ''}

Respond as Jobloom AI:`;

    // Generate response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const generatedText = response.text();

    return NextResponse.json({
      response: generatedText,
      isJobRelated: true
    });

  } catch (error) {
    console.error("Chatbot API error:", error);

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          { error: "I apologize, but I can't assist with that type of request." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Sorry, I'm having trouble processing your request. Please try again." },
      { status: 500 }
    );
  }
}
