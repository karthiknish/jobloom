import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";
import { PageTransitionWrapper } from "@/components/ui/PageTransitionWrapper";

export const metadata: Metadata = generatePageMetadata("/dashboard", {
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <PageTransitionWrapper>{children}</PageTransitionWrapper>;
}
