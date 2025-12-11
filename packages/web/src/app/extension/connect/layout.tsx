import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/extension/connect", {
  noIndex: true,
});

export default function ExtensionConnectLayout({ children }: { children: ReactNode }) {
  return children;
}
