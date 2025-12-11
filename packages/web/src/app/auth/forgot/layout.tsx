import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/auth/forgot");

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
