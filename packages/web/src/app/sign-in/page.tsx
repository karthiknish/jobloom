"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SignInPage() {
  // Check if we're being opened from the extension
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromExtension = urlParams.get("extension") === "true";
    
    if (isFromExtension) {
      // Add a class to body for extension-specific styling if needed
      document.body.classList.add("from-extension");
      
      // Listen for successful sign-in
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "__clerk_session") {
          // Session was created, notify extension
          window.postMessage({ type: "CLERK_AUTH_SUCCESS" }, "*");
        }
      };
      
      window.addEventListener("storage", handleStorageChange);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        document.body.classList.remove("from-extension");
      };
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        path="/sign-in"
        routing="path"
        redirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </main>
  );
}
