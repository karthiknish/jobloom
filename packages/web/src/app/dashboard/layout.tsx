import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/dashboard", {
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
