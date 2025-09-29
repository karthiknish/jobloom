"use client";

import { Button } from "@/components/ui/button";
import { showSuccess } from "@/components/ui/Toast";
import ConnectExtensionClient from "./ConnectExtensionClient";

export const dynamic = "force-dynamic";

export default function ConnectExtensionPage() {
  return <ConnectExtensionClient />;
}
