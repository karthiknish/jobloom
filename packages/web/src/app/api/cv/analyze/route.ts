import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex-generated/api";

// Check if the environment variables are defined
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not defined");
}

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not defined");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const { analysisId, cvText, targetRole, industry } = await req.json();

    if (!analysisId || !cvText) {
      return NextResponse.json(
        { error: "Missing analysisId or cvText" },
        { status: 400 },
      );
    }

    // Update status to processing
    await convex.mutation(api.cvAnalysis.updateCvAnalysisStatus, {
      analysisId,
      status: "processing",
    });

    // Create the analysis prompt
    const prompt = createAnalysisPrompt(cvText, targetRole, industry);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Parse the JSON response from Gemini
    let analysisData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      await convex.mutation(api.cvAnalysis.updateCvAnalysisError, {
        analysisId,
        errorMessage: "Failed to parse AI analysis results",
      });
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 },
      );
    }

    // Update the analysis with results
    await convex.mutation(api.cvAnalysis.updateCvAnalysisResults, {
      analysisId,
      overallScore: analysisData.overallScore,
      strengths: analysisData.strengths,
      weaknesses: analysisData.weaknesses,
      missingSkills: analysisData.missingSkills,
      recommendations: analysisData.recommendations,
      industryAlignment: analysisData.industryAlignment,
      atsCompatibility: analysisData.atsCompatibility,
      keywordAnalysis: analysisData.keywordAnalysis,
      sectionAnalysis: analysisData.sectionAnalysis,
    });

    return NextResponse.json({ success: true, analysisData });
  } catch (error) {
    console.error("Error analyzing CV:", error);

    // Update analysis with error
    if (req.body) {
      try {
        const { analysisId } = await req.json();
        // Create a Convex HTTP client inside the function
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        await convex.mutation(api.cvAnalysis.updateCvAnalysisError, {
          analysisId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } catch (updateError) {
        console.error("Failed to update error status:", updateError);
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze CV" },
      { status: 500 },
    );
  }
}

function createAnalysisPrompt(
  cvText: string,
  targetRole?: string,
  industry?: string,
): string {
  const roleContext = targetRole
    ? `for a ${targetRole} position`
    : "for general job applications";
  const industryContext = industry ? `in the ${industry} industry` : "";

  return `
You are an expert CV/Resume analyzer and career coach specializing in ATS (Applicant Tracking Systems) optimization. Analyze the following CV ${roleContext} ${industryContext} and provide a comprehensive evaluation with a focus on ATS compatibility and job search success.

CV Content:
${cvText}

Please analyze this CV and return your analysis in the following JSON format:

{
  "overallScore": <number between 0-100>,
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "missingSkills": [
    "<missing skill 1>",
    "<missing skill 2>",
    "<missing skill 3>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>",
    "<actionable recommendation 4>",
    "<actionable recommendation 5>"
  ],
  "industryAlignment": {
    "score": <number between 0-100>,
    "feedback": "<detailed feedback about industry alignment>"
  },
  "atsCompatibility": {
    "score": <number between 0-100>,
    "issues": [
      "<ATS issue 1 - be specific about what to fix>",
      "<ATS issue 2 - be specific about what to fix>",
      "<ATS issue 3 - be specific about what to fix>"
    ],
    "suggestions": [
      "<ATS improvement suggestion 1 - be very specific and actionable>",
      "<ATS improvement suggestion 2 - be very specific and actionable>",
      "<ATS improvement suggestion 3 - be very specific and actionable>",
      "<ATS improvement suggestion 4 - be very specific and actionable>"
    ]
  },
  "keywordAnalysis": {
    "presentKeywords": [
      "<relevant keyword 1>",
      "<relevant keyword 2>",
      "<relevant keyword 3>",
      "<relevant keyword 4>",
      "<relevant keyword 5>"
    ],
    "missingKeywords": [
      "<missing important keyword 1 - be specific to role/industry>",
      "<missing important keyword 2 - be specific to role/industry>",
      "<missing important keyword 3 - be specific to role/industry>",
      "<missing important keyword 4 - be specific to role/industry>",
      "<missing important keyword 5 - be specific to role/industry>"
    ],
    "keywordDensity": <number between 0-100>
  },
  "sectionAnalysis": {
    "hasSummary": <boolean>,
    "hasExperience": <boolean>,
    "hasEducation": <boolean>,
    "hasSkills": <boolean>,
    "hasContact": <boolean>,
    "missingsections": [
      "<missing section 1>",
      "<missing section 2>"
    ]
  }
}

Analysis Guidelines:
1. Overall Score: Consider content quality, structure, relevance, completeness, and ATS compatibility (weighted heavily)
2. Strengths: Highlight what the candidate does well, especially ATS-friendly elements
3. Weaknesses: Identify areas that need improvement, focusing on ATS issues
4. Missing Skills: Skills that would be valuable for the target role/industry, with emphasis on technical skills
5. Recommendations: Specific, actionable advice for improvement with priority on ATS optimization
6. Industry Alignment: How well the CV matches industry expectations and standard terminology
7. ATS Compatibility: How well the CV would perform with Applicant Tracking Systems
   - Check for proper section headings (use standard terms like "Work Experience" not "Jobs")
   - Check for keyword optimization
   - Check for proper formatting (avoid columns, headers, footers, graphics)
   - Check for appropriate file format compatibility
8. Keyword Analysis: Relevant keywords present and missing, with industry-specific terms
9. Section Analysis: Check for essential CV sections using standard ATS-friendly headings

ATS-Specific Focus Areas:
- Use of standard section headings that ATS systems recognize
- Proper keyword placement and density
- Avoidance of graphics, tables, columns, or complex formatting
- Clear contact information at the top
- Quantifiable achievements with numbers and metrics
- Industry-specific terminology and skills
- Proper chronological formatting

Be very specific, constructive, and provide highly actionable feedback. Focus heavily on both content and ATS format improvements. Each suggestion should be clear enough for someone to implement immediately. Prioritize ATS compatibility in your recommendations.
`;
}
