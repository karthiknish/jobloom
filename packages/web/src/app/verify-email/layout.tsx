import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/verify-email");

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
