import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/upgrade");

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return children;
}
