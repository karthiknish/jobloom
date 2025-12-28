import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";
import { PageTransitionWrapper } from "@/components/ui/PageTransitionWrapper";

export const metadata: Metadata = generatePageMetadata("/career-tools");

export default function CareerToolsLayout({ children }: { children: ReactNode }) {
  return <PageTransitionWrapper>{children}</PageTransitionWrapper>;
}
