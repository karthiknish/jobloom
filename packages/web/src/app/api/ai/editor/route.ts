import { withApi, z } from "@/lib/api/withApi";
import { generateEditorContent } from "@/services/ai/geminiService";

const editorRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  tone: z.string().optional(),
  audience: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  format: z.string().optional(),
});

export const POST = withApi({
  auth: 'admin', // Original code required admin
  rateLimit: 'ai-editor',
  bodySchema: editorRequestSchema,
}, async ({ body }) => {
  const content = await generateEditorContent({
    prompt: body.prompt,
    tone: body.tone,
    audience: body.audience,
    keywords: body.keywords,
    length: body.length,
    format: body.format,
  });

  return {
    content,
    metadata: {
      length: content.split(/\s+/).filter(Boolean).length,
      generatedAt: new Date().toISOString(),
    },
  };
});

export { OPTIONS } from "@/lib/api/withApi";
