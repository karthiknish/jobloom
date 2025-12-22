import { evaluateInterviewAnswer } from "@/services/ai/geminiService";
import { getAdminDb } from "@/firebase/admin";
import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { AuthorizationError } from "@/lib/api/errorResponse";

export { OPTIONS };

const evaluateSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(10, "Answer is too short. Please provide a more detailed response.").max(10000, "Answer is too long. Please keep it under 10000 characters."),
  category: z.string().optional().default("general"),
  difficulty: z.string().optional().default("Medium"),
});

export const POST = withApi({
  auth: 'required',
  rateLimit: 'ai-interview',
  bodySchema: evaluateSchema,
}, async ({ user, body }) => {
  const { question, answer, category, difficulty } = body;

  // Check for premium subscription
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(user!.uid).get();
  const userData = userDoc.data();

  const isPremium = userData?.subscription?.tier === "premium" ||
                    userData?.subscription?.tier === "enterprise" ||
                    userData?.subscriptionId ||
                    userData?.subscriptionStatus === 'active';

  if (!isPremium) {
    throw new AuthorizationError(
      "Premium subscription required for AI interview evaluation",
      ERROR_CODES.PAYMENT_REQUIRED
    );
  }

  // Evaluate answer using AI
  const evaluation = await evaluateInterviewAnswer({
    question: question.trim(),
    answer: answer.trim(),
    category: category,
    difficulty: difficulty,
  });

  return {
    success: true,
    data: evaluation,
    metadata: {
      questionLength: question.length,
      answerLength: answer.length,
      wordCount: answer.split(/\s+/).length,
      evaluatedAt: new Date().toISOString(),
    },
  };
});
