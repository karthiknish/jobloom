import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";

export function useDashboardLayout() {
  const { user } = useFirebaseAuth();
  const [dashboardLayout, setDashboardLayout] = useState<string[]>([]);

  // Load dashboard layout from localStorage
  useEffect(() => {
    if (user?.uid) {
      const savedLayout = localStorage.getItem(`dashboard-layout-${user.uid}`);
      if (savedLayout) {
        try {
          const layout = JSON.parse(savedLayout);
          setDashboardLayout(layout);
        } catch (error) {
          console.error("Error parsing saved dashboard layout:", error);
        }
      }
    }
  }, [user?.uid]);

  // Save dashboard layout to localStorage
  const handleLayoutChange = (newLayout: string[]) => {
    setDashboardLayout(newLayout);
    if (user?.uid) {
      localStorage.setItem(`dashboard-layout-${user.uid}`, JSON.stringify(newLayout));
    }
  };

  return {
    dashboardLayout,
    handleLayoutChange,
  };
}
