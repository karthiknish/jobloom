import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePageMetadata } from "@/metadata";

export const metadata: Metadata = generatePageMetadata("/extension/connect", {
  noIndex: true,
});

export default function ExtensionConnectLayout({ children }: { children: ReactNode }) {
  // The global Header is fixed; add top padding so this route isn't hidden underneath it.
  return <div className="min-h-screen pt-20 md:pt-24">{children}</div>;
}
