"use client";

import { useEffect } from "react";
import { ensureFirebaseApp } from "@/firebase/client";

export default function FirebaseInitializer() {
  useEffect(() => {
    // Initialize Firebase app on client-side
    ensureFirebaseApp();
  }, []);

  return null;
}
