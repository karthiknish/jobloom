import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/auth/reset");

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
