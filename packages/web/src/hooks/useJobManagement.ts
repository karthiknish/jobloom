import { useState } from "react";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";

export function useJobManagement(onRefetchJobStats: () => void) {
  const [showJobForm, setShowJobForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleJobSubmit = async (data: Record<string, unknown>) => {
    try {
      await dashboardApi.createJob(data);
      await onRefetchJobStats();
      showSuccess("Job added to your dashboard!", "You can now track this opportunity and update its status as you progress through the application process.");
      setShowJobForm(false);
    } catch (error) {
      console.error("Error adding job:", error);
      showError("Unable to save job", "Please check your internet connection and try again. If the problem persists, contact support.");
    }
  };

  return {
    showJobForm,
    setShowJobForm,
    showImportModal,
    setShowImportModal,
    handleJobSubmit,
  };
}
