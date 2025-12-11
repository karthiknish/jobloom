import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/volunteer");

export default function VolunteerLayout({ children }: { children: ReactNode }) {
  return children;
}
