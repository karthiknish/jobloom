import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/sign-up");

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
