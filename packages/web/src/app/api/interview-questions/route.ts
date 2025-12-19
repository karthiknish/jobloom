import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Industry types
const INDUSTRIES = [
  "general",
  "technology",
  "finance",
  "healthcare",
  "marketing",
  "consulting",
  "data-science",
] as const;

// Zod schema for query parameters
const interviewQuestionsSchema = z.object({
  industry: z.enum(INDUSTRIES).optional(),
});

export const GET = withApi({
  auth: "required",
  querySchema: interviewQuestionsSchema,
}, async ({ query }) => {
  const { industry: industryFilter } = query;

  const db = getAdminDb();

  // Build query - fetch all questions or filter by industry
  const queryRef = db.collection("interviewQuestions").orderBy("id");
  
  // If industry filter is provided, we'll filter after fetching
  // (Firestore doesn't support OR queries for "general" + specific industry)
  const snapshot = await queryRef.get();

  // Organize questions by type
  const interviewQuestions: Record<string, any[]> = {
    behavioral: [],
    technical: [],
    situational: [],
    leadership: [],
    systemDesign: [],
    productSense: [],
  };

  snapshot.forEach((doc) => {
    const question = doc.data();
    const type = question.type;
    
    // Apply industry filter if provided
    // Include questions that match the filter OR are "general"
    if (industryFilter) {
      const questionIndustry = question.industry || "general";
      if (questionIndustry !== industryFilter && questionIndustry !== "general") {
        return; // Skip this question
      }
    }
    
    if (interviewQuestions[type]) {
      interviewQuestions[type].push(question);
    }
  });

  // Calculate counts per category
  const categoryCounts: Record<string, number> = {};
  for (const [type, questions] of Object.entries(interviewQuestions)) {
    categoryCounts[type] = questions.length;
  }

  // If no questions in database, return empty structure
  const hasQuestions = Object.values(interviewQuestions).some(arr => arr.length > 0);

  if (!hasQuestions) {
    return {
      behavioral: [],
      technical: [],
      situational: [],
      leadership: [],
      systemDesign: [],
      productSense: [],
      industries: INDUSTRIES,
      selectedIndustry: industryFilter || "all",
      message: "No interview questions found. Run setup endpoint to populate questions.",
    };
  }

  return {
    data: interviewQuestions,
    industries: INDUSTRIES,
    selectedIndustry: industryFilter || "all",
    categoryCounts,
    totalQuestions: Object.values(categoryCounts).reduce((a, b) => a + b, 0),
  };
});
