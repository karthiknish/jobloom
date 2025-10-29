import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId, ValidationError } from "@/lib/api/errors";
import { generateEditorContent, type EditorContentRequest } from "@/services/ai/geminiService";

type EditorLength = NonNullable<EditorContentRequest["length"]>;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON payload", undefined, "INVALID_JSON");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ValidationError("Request body must be an object", undefined, "INVALID_BODY");
    }

    const { prompt, tone, audience, keywords, length, format } = body as Record<string, unknown>;

    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new ValidationError("Prompt is required", "prompt", "PROMPT_REQUIRED");
    }

    const normalizedLength = typeof length === "string" ? length.toLowerCase() : undefined;
    const allowedLengths = new Set<EditorLength>(["short", "medium", "long"]);

    const content = await generateEditorContent({
      prompt,
      tone: typeof tone === "string" ? tone : undefined,
      audience: typeof audience === "string" ? audience : undefined,
      keywords: Array.isArray(keywords) ? keywords.filter((item): item is string => typeof item === "string") : undefined,
      length: normalizedLength && allowedLengths.has(normalizedLength as EditorLength)
        ? (normalizedLength as EditorLength)
        : undefined,
      format: typeof format === "string" ? format : undefined,
    });

    return NextResponse.json({
      content,
      metadata: {
        length: content.split(/\s+/).filter(Boolean).length,
        generatedAt: new Date().toISOString(),
      },
    });
  }, {
    endpoint: "/api/ai/editor",
    method: "POST",
    requestId,
  });
}
