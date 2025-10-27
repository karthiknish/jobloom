"use client";

import { useEffect } from "react";
import { ensureFirebaseApp } from "@/firebase/client";

export default function FirebaseInitializer() {
  useEffect(() => {
    // Initialize Firebase app on client-side
    ensureFirebaseApp();
    
    // Initialize extension auth bridge for session sharing
    console.log("[ExtensionAuthBridge] Initializing extension auth bridge");
    import("@/lib/extensionAuthBridge").then(({ extensionAuthBridge }) => {
      extensionAuthBridge;
    }).catch((error) => {
      console.warn("[ExtensionAuthBridge] Failed to load auth bridge:", error);
    });
  }, []);

  return null;
}
