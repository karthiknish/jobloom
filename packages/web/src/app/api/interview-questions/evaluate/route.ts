import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";

interface AnswerEvaluationRequest {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

interface EvaluationFeedback {
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

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AnswerEvaluationRequest = await request.json();
    const { question, answer, category, difficulty } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    // Simulate AI evaluation (in production, this would call an AI service)
    const evaluation = evaluateAnswer(question, answer, category, difficulty);

    return NextResponse.json({
      success: true,
      data: evaluation,
      message: "Answer evaluated successfully"
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}

function evaluateAnswer(
  question: string, 
  answer: string, 
  category: string, 
  difficulty: string
): EvaluationFeedback {
  // Simulated AI evaluation logic
  const answerLength = answer.length;
  const wordCount = answer.split(/\s+/).length;
  
  // Basic scoring based on answer characteristics
  let content_score = Math.min(100, Math.max(0, (wordCount / 100) * 100));
  let clarity_score = Math.min(100, Math.max(0, 100 - (answer.split(/[.!?]/).length - wordCount / 20) * 10));
  let relevance_score = Math.min(100, Math.max(0, 80 + Math.random() * 20));
  let structure_score = Math.min(100, Math.max(0, (answer.toLowerCase().includes('situation') ? 25 : 0) + 
                                                   (answer.toLowerCase().includes('task') ? 25 : 0) + 
                                                   (answer.toLowerCase().includes('action') ? 25 : 0) + 
                                                   (answer.toLowerCase().includes('result') ? 25 : 0)));

  const overall_score = Math.round((content_score + clarity_score + relevance_score + structure_score) / 4);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];

  // Generate feedback based on scores
  if (content_score >= 80) {
    strengths.push("Comprehensive answer with good detail");
  } else if (content_score < 50) {
    improvements.push("Answer could be more detailed and comprehensive");
    suggestions.push("Try to provide more specific examples and context");
  }

  if (clarity_score >= 80) {
    strengths.push("Clear and well-articulated response");
  } else if (clarity_score < 50) {
    improvements.push("Work on clarity and structure of your answer");
    suggestions.push("Consider organizing your thoughts before speaking");
  }

  if (structure_score >= 70) {
    strengths.push("Good use of structured approach (STAR method)");
  } else if (structure_score < 40) {
    improvements.push("Consider using the STAR method for better structure");
    suggestions.push("Structure your answer: Situation, Task, Action, Result");
  }

  if (relevance_score >= 80) {
    strengths.push("Answer directly addresses the question");
  } else if (relevance_score < 60) {
    improvements.push("Answer could be more focused on the question asked");
    suggestions.push("Make sure your answer directly addresses all parts of the question");
  }

  // Add category-specific feedback
  if (category === "behavioral") {
    suggestions.push("For behavioral questions, focus on specific past experiences");
  } else if (category === "technical") {
    suggestions.push("For technical questions, demonstrate your problem-solving process");
  } else if (category === "leadership") {
    suggestions.push("Highlight your leadership impact and team influence");
  }

  const estimated_response_quality = 
    overall_score >= 85 ? "Excellent" :
    overall_score >= 70 ? "Good" :
    overall_score >= 50 ? "Fair" : "Poor";

  const detailed_feedback = generateDetailedFeedback(overall_score, category, strengths, improvements);

  return {
    overall_score,
    content_score: Math.round(content_score),
    clarity_score: Math.round(clarity_score),
    relevance_score: Math.round(relevance_score),
    structure_score: Math.round(structure_score),
    strengths,
    improvements,
    detailed_feedback,
    suggestions,
    estimated_response_quality
  };
}

function generateDetailedFeedback(
  score: number, 
  category: string, 
  strengths: string[], 
  improvements: string[]
): string {
  let feedback = `Your answer received a score of ${score}/100. `;
  
  if (score >= 80) {
    feedback += "This is an excellent response that demonstrates strong interview skills. ";
  } else if (score >= 60) {
    feedback += "This is a good response with room for improvement. ";
  } else if (score >= 40) {
    feedback += "This response needs some improvement to be more effective. ";
  } else {
    feedback += "This response needs significant improvement. ";
  }

  if (strengths.length > 0) {
    feedback += `Key strengths: ${strengths.join(", ").toLowerCase()}. `;
  }

  if (improvements.length > 0) {
    feedback += `Areas to improve: ${improvements.join(", ").toLowerCase()}. `;
  }

  feedback += "Continue practicing to enhance your interview performance.";

  return feedback;
}
