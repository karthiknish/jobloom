import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { generateMockInterviewQuestions, type MockInterviewQuestion as AIMockQuestion } from "@/services/ai/geminiService";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const mockInterviewRequestSchema = z.object({
  role: z.string().min(1, "Role is required"),
  experience: z.string().min(1, "Experience is required"),
  duration: z.number().min(1, "Duration is required"),
  focus: z.array(z.string()).optional().default([]),
});

interface MockInterviewSession {
  id: string;
  role: string;
  experience: string;
  duration: number;
  questions: MockInterviewQuestion[];
  startedAt: Date;
  status: "created" | "in_progress" | "completed";
}

interface MockInterviewQuestion {
  id: string;
  question: string;
  type: "behavioral" | "technical" | "situational" | "leadership";
  category: string;
  difficulty: string;
  timeLimit: number;
  followUpQuestions?: string[];
}

export const POST = withApi({
  auth: "required",
  bodySchema: mockInterviewRequestSchema,
}, async ({ body }) => {
  const { role, experience, duration, focus } = body;

  // Generate mock interview session
  const session = await generateMockInterviewSession(role, experience, duration, focus);

  return session;
});

export const GET = withApi({
  auth: "required",
}, async () => {
  // Return available mock interview templates
  const templates = getMockInterviewTemplates();

  return templates;
});

async function generateMockInterviewSession(
  role: string,
  experience: string,
  duration: number,
  focus: string[]
): Promise<MockInterviewSession> {
  let questions: MockInterviewQuestion[] = [];
  
  try {
    // Try to generate questions using AI
    const aiQuestions = await generateMockInterviewQuestions({
      role,
      experience,
      duration,
      focus
    });
    
    // Map AI questions to our internal format if needed (interfaces match, but good to be safe)
    questions = aiQuestions.map((q, index) => ({
      id: `question-${index + 1}`,
      question: q.question,
      type: q.type,
      category: q.category,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      followUpQuestions: q.followUpQuestions || []
    }));
    
  } catch (error) {
    console.error("AI generation failed, falling back to static questions:", error);
    questions = getFallbackQuestions(role, experience, duration, focus);
  }
  
  return {
    id: `mock-interview-${Date.now()}`,
    role,
    experience,
    duration,
    questions,
    startedAt: new Date(),
    status: "created"
  };
}

function getFallbackQuestions(
  role: string,
  experience: string,
  duration: number,
  focus: string[]
): MockInterviewQuestion[] {
  const questionBank = getQuestionBank();
  
  // Filter questions by role and experience
  let filteredQuestions = questionBank.filter(q => 
    q.roles.includes(role) && q.experience.includes(experience)
  );

  // If focus areas are specified, prioritize them
  if (focus.length > 0) {
    const focusQuestions = filteredQuestions.filter(q => 
      focus.some(f => q.categories.includes(f))
    );
    const otherQuestions = filteredQuestions.filter(q => 
      !focus.some(f => q.categories.includes(f))
    );
    
    // Mix focus and other questions
    filteredQuestions = [
      ...focusQuestions.slice(0, Math.ceil(duration / 10)),
      ...otherQuestions.slice(0, Math.floor(duration / 10))
    ];
  }

  // Select appropriate number of questions based on duration
  const questionCount = Math.floor(duration / 8); // ~8 minutes per question
  return filteredQuestions.slice(0, questionCount).map((q, index) => ({
    id: `question-${index + 1}`,
    question: q.question,
    type: q.type,
    category: q.category,
    difficulty: q.difficulty,
    timeLimit: 8, // 8 minutes per question
    followUpQuestions: q.followUpQuestions || []
  }));
}

function getQuestionBank(): any[] {
  return [
    {
      question: "Tell me about yourself and your experience in this field.",
      type: "behavioral",
      category: "Introduction",
      difficulty: "Easy",
      roles: ["software-engineer", "product-manager", "ux-designer"],
      experience: ["entry-level", "mid-level", "senior"],
      followUpQuestions: [
        "What specific achievements are you most proud of?",
        "How does your experience align with this role?"
      ]
    },
    {
      question: "Describe a challenging technical problem you solved recently.",
      type: "technical",
      category: "Problem Solving",
      difficulty: "Medium",
      roles: ["software-engineer"],
      experience: ["mid-level", "senior"],
      followUpQuestions: [
        "What was the impact of your solution?",
        "What would you do differently now?"
      ]
    },
    {
      question: "How do you prioritize features when there are conflicting requirements?",
      type: "situational",
      category: "Prioritization",
      difficulty: "Medium",
      roles: ["product-manager"],
      experience: ["mid-level", "senior"],
      followUpQuestions: [
        "Can you give an example from your experience?",
        "How do you handle stakeholder disagreements?"
      ]
    },
    {
      question: "Walk me through your design process for a mobile app.",
      type: "technical",
      category: "Design Process",
      difficulty: "Medium",
      roles: ["ux-designer"],
      experience: ["mid-level", "senior"],
      followUpQuestions: [
        "How do you incorporate user feedback?",
        "What tools do you use in your design process?"
      ]
    },
    {
      question: "Tell me about a time you had to lead a team through a difficult project.",
      type: "leadership",
      category: "Team Leadership",
      difficulty: "Hard",
      roles: ["software-engineer", "product-manager", "ux-designer"],
      experience: ["senior"],
      followUpQuestions: [
        "How did you motivate your team?",
        "What was the outcome?"
      ]
    }
  ];
}

function getMockInterviewTemplates() {
  return [
    {
      id: "software-engineer-entry",
      name: "Software Engineer (Entry Level)",
      role: "software-engineer",
      experience: "entry-level",
      duration: 30,
      description: "Perfect for junior developers applying to their first or second software engineering role.",
      focus: ["technical", "behavioral"],
      questionCount: 4
    },
    {
      id: "software-engineer-mid",
      name: "Software Engineer (Mid Level)",
      role: "software-engineer",
      experience: "mid-level",
      duration: 45,
      description: "Designed for developers with 2-5 years of experience looking to advance their careers.",
      focus: ["technical", "system-design", "behavioral"],
      questionCount: 6
    },
    {
      id: "software-engineer-senior",
      name: "Software Engineer (Senior)",
      role: "software-engineer",
      experience: "senior",
      duration: 60,
      description: "For experienced developers targeting senior or lead positions.",
      focus: ["system-design", "leadership", "technical", "behavioral"],
      questionCount: 8
    },
    {
      id: "product-manager-mid",
      name: "Product Manager (Mid Level)",
      role: "product-manager",
      experience: "mid-level",
      duration: 45,
      description: "Comprehensive interview for product managers with 2-5 years of experience.",
      focus: ["strategy", "leadership", "behavioral"],
      questionCount: 6
    },
    {
      id: "ux-designer-mid",
      name: "UX Designer (Mid Level)",
      role: "ux-designer",
      experience: "mid-level",
      duration: 40,
      description: "Complete UX design interview covering design process and problem-solving.",
      focus: ["design", "problem-solving", "behavioral"],
      questionCount: 5
    }
  ];
}
