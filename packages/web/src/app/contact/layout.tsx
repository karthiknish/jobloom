import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/contact");

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
