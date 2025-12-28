/**
 * AI Blog Generator API
 * 
 * Generates blog posts using Gemini AI with configurable tone, length, and topic.
 * Returns structured JSON with title, excerpt, content, category, and tags.
 */

import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { ServiceUnavailableError } from "@/lib/api/errorResponse";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const BlogGeneratorSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  tone: z.enum(["professional", "casual", "technical", "inspirational"]).optional().default("professional"),
  targetAudience: z.string().optional().default("job seekers and career professionals"),
  length: z.enum(["short", "medium", "long"]).optional().default("medium"),
  additionalContext: z.string().optional(),
});

// ============================================================================
// AI PROMPT
// ============================================================================

const BLOG_PROMPT = `You are an expert blog content writer for HireAll, a job search and career platform. Generate a complete blog post based on the given topic.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, no backticks.

The JSON must have this exact structure:
{
  "title": "Compelling blog post title",
  "excerpt": "2-3 sentence summary for SEO and previews",  
  "content": "Full HTML-formatted blog content with proper headings, paragraphs, and lists",
  "category": "One of: technology, business, design, marketing, development, tutorial, news, remote-work, other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Content Guidelines:
- Title: Catchy, SEO-friendly, relevant to topic
- Excerpt: Concise summary, max 160 characters for SEO
- Content: Well-structured HTML with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
- Include actionable tips and real-world examples
- Use proper HTML formatting, NOT markdown
- Category: Match the topic to the best category
- Tags: 4-6 relevant keywords

Length Guidelines:
- short: ~500 words
- medium: ~800 words  
- long: ~1200 words`;

// ============================================================================
// API HANDLER
// ============================================================================

export const POST = withApi({
  auth: 'admin', // Only admins can generate blog posts
  rateLimit: 'ai-blog',
  bodySchema: BlogGeneratorSchema,
}, async ({ body }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ServiceUnavailableError("AI service not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const userPrompt = `Generate a blog post about: "${body.topic}"

Tone: ${body.tone}
Target Audience: ${body.targetAudience}
Length: ${body.length}
${body.additionalContext ? `Additional Context: ${body.additionalContext}` : ""}

Remember: Return ONLY valid JSON, no markdown, no code blocks.`;

  const result = await model.generateContent([BLOG_PROMPT, userPrompt]);
  const response = await result.response;
  let text = response.text();

  // Clean up potential markdown formatting
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Parse the JSON response
  let blogData;
  try {
    blogData = JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse AI response:", text);
    throw new ServiceUnavailableError("Failed to parse AI response. Please try again.");
  }

  // Validate required fields
  if (!blogData.title || !blogData.excerpt || !blogData.content || !blogData.category || !blogData.tags) {
    throw new ServiceUnavailableError("AI response missing required fields. Please try again.");
  }

  return {
    title: blogData.title,
    excerpt: blogData.excerpt,
    content: blogData.content,
    category: blogData.category.toLowerCase(),
    tags: Array.isArray(blogData.tags) ? blogData.tags : [],
  };
});
