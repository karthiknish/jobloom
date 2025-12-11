import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/conditions");

export default function ConditionsLayout({ children }: { children: ReactNode }) {
  return children;
}
