import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/cv-evaluator", {
  // Likely authenticated/interactive; keep out of search indices
  noIndex: true,
});

export default function CvEvaluatorLayout({ children }: { children: ReactNode }) {
  return children;
}
