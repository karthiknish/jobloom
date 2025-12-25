"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SafeImg } from "@/components/ui/SafeImg";

function looksLikeHtml(input: string) {
  // Heuristic: treat as HTML if it contains tags.
  // This keeps existing Tiptap/HTML posts working while enabling Markdown posts.
  return /<\s*\/?\s*[a-z][\s\S]*>/i.test(input);
}

export function BlogContent({ content }: { content: string }) {
  const normalized = typeof content === "string" ? content.trim() : "";

  if (!normalized) return null;

  if (looksLikeHtml(normalized)) {
    return (
      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: normalized }}
      />
    );
  }

  return (
    <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: (props) => (
            <SafeImg
              {...props}
              // react-markdown may pass src as string | undefined
              src={typeof props.src === "string" ? props.src : undefined}
              alt={props.alt ?? ""}
              className={props.className}
            />
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
