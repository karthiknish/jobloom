import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import {
  summarizeJobDescription,
} from "@/services/ai/geminiService";

export { OPTIONS };

const jobSummaryRequestSchema = z.object({
  jobDescription: z.string().min(50, "Job description is too short").max(20000),
});

export const POST = withApi({
  auth: 'required',
  rateLimit: 'ai-job-summary',
  bodySchema: jobSummaryRequestSchema,
}, async ({ user, body }) => {
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(user!.uid).get();
  const userData = userDoc.data();

  const isAdmin = userData?.isAdmin === true;
  const isPremium = userData?.subscription?.tier === 'premium' || 
                    userData?.subscription?.status === 'active';

  // Allow free users 1 summary per day or something? 
  // For now, let's stick to premium/admin for AI features as per existing patterns
  if (!userData || (!isPremium && !isAdmin)) {
    throw new AuthorizationError(
      "Premium subscription required for AI job summarization",
      ERROR_CODES.PAYMENT_REQUIRED
    );
  }

  const summary = await summarizeJobDescription(body.jobDescription);

  return summary;
});
