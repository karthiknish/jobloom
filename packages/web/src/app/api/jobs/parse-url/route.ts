import { withAuthenticatedApi, z } from "@/lib/api/withApi";
import { getModel, safeParseJSON } from "@/services/ai/robust-client";
import { NetworkError } from "@/lib/api/errorResponse";

const parseUrlSchema = z.object({
  url: z.string().url(),
});

/**
 * Extract text from HTML by removing scripts, styles, and tags
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
  // Remove all other tags
  text = text.replace(/<[^>]+>/g, " ");
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export const POST = withAuthenticatedApi({
  rateLimit: 'job-parse',
  bodySchema: parseUrlSchema,
}, async ({ body }) => {
  const { url } = body;

  try {
    // 1. Fetch the URL
    // Note: Some sites might block simple fetch requests. 
    // In a production environment, a proxy or headless browser might be needed.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new NetworkError(`Failed to fetch URL: ${response.statusText} (${response.status})`, response.status);
    }

    const html = await response.text();

    // 2. Extract text from HTML
    const cleanText = extractTextFromHtml(html);

    if (cleanText.length < 100) {
      throw new Error("The page content seems too short to be a job posting or was blocked.");
    }

    // 3. Use Gemini to parse job details
    const prompt = `
Extract job details from the following text content of a job posting URL: ${url}

Text content:
${cleanText.substring(0, 12000)}

Return a JSON object with the following structure:
{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "description": "Brief summary of the job description (max 500 chars)",
  "salary": "Salary range if mentioned",
  "jobType": "Full-time, Part-time, Contract, etc.",
  "experienceLevel": "Junior, Mid, Senior, etc.",
  "remoteWork": boolean,
  "skills": ["skill1", "skill2"],
  "requirements": ["req1", "req2"],
  "benefits": ["benefit1", "benefit2"]
}

If a field is not found, use null or an empty array.
Return ONLY the JSON object.
`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();
    
    // Clean AI response if it contains markdown code blocks
    const cleanedAiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedJob = safeParseJSON(cleanedAiResponse);

    if (!parsedJob) {
      console.error("AI Response failed to parse:", aiResponse);
      throw new Error("Failed to parse job details from the page content.");
    }

    return { 
      job: {
        ...parsedJob,
        url,
        source: new URL(url).hostname.replace('www.', ''),
        dateFound: Date.now()
      } 
    };
  } catch (error) {
    console.error("URL parsing error:", error);
    if (error instanceof NetworkError) throw error;
    throw new Error(error instanceof Error ? error.message : "Failed to parse job from URL");
  }
});
