import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/privacy");

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
