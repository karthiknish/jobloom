import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/terms");

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
