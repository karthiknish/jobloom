"use client";

import { useEffect } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { analytics } from "@/firebase/analytics";

export default function DashboardPage() {
  useEffect(() => {
    analytics.logPageView("/dashboard", "Dashboard");
    analytics.logFeatureUsed("dashboard_page_visit");
  }, []);

  return <Dashboard />;
}
