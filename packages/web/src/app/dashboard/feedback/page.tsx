"use client";

import { useEffect } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { analytics } from "@/firebase/analytics";

export default function FeedbackPage() {
  useEffect(() => {
    analytics.logPageView("/dashboard/feedback", "Feedback History");
  }, []);

  return <Dashboard initialView="feedback" />;
}
