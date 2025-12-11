import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/sign-in");

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
