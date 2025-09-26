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
      showSuccess("Job added successfully");
      setShowJobForm(false);
    } catch (error) {
      console.error("Error adding job:", error);
      showError("Failed to add job");
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
