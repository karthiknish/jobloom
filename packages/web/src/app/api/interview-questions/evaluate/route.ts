import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { evaluateInterviewAnswer } from "@/services/ai/geminiService";

interface AnswerEvaluationRequest {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: AnswerEvaluationRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const { question, answer, category, difficulty } = body;

    // Validate required fields
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required", code: "MISSING_QUESTION" },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "Answer is required", code: "MISSING_ANSWER" },
        { status: 400 }
      );
    }

    // Validate answer length
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length < 10) {
      return NextResponse.json(
        { error: "Answer is too short. Please provide a more detailed response.", code: "ANSWER_TOO_SHORT" },
        { status: 400 }
      );
    }

    if (trimmedAnswer.length > 10000) {
      return NextResponse.json(
        { error: "Answer is too long. Please keep it under 10000 characters.", code: "ANSWER_TOO_LONG" },
        { status: 400 }
      );
    }

    // Evaluate answer using AI
    const evaluation = await evaluateInterviewAnswer({
      question: question.trim(),
      answer: trimmedAnswer,
      category: category || "general",
      difficulty: difficulty || "Medium",
    });

    return NextResponse.json({
      success: true,
      data: evaluation,
      metadata: {
        questionLength: question.length,
        answerLength: trimmedAnswer.length,
        wordCount: trimmedAnswer.split(/\s+/).length,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service not configured", code: "AI_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to evaluate answer",
        code: "EVALUATION_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
