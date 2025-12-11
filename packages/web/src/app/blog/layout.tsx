import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/blog");

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
