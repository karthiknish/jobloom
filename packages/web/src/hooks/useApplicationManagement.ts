import { useState } from "react";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError, showUndoableSuccess } from "@/components/ui/Toast";
import { useOnboardingState } from "@/hooks/useOnboardingState";

import { Application } from "@/types/dashboard";

export function useApplicationManagement(onRefetchApplications: () => void) {
  const onboarding = useOnboardingState();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleEditApplication = (application: Application) => {
    setEditingApplication(application);
    setShowApplicationForm(true);
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleDeleteApplication = async (applicationId: string, applicationTitle?: string) => {
    try {
      // Soft delete the application
      await dashboardApi.deleteApplication(applicationId);
      await onRefetchApplications();
      
      // Show undo toast
      showUndoableSuccess("Application removed", {
        description: applicationTitle ? `"${applicationTitle}" has been moved to trash.` : "The application has been removed.",
        onUndo: async () => {
          await dashboardApi.restoreApplication(applicationId);
          await onRefetchApplications();
        },
      });
    } catch (error) {
      console.error("Error deleting application:", error);
      showError("Unable to delete application", "Please try again in a moment.");
    }
  };

  const handleApplicationSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingApplication) {
        await dashboardApi.updateApplication(editingApplication._id, data);
        showSuccess("Application updated successfully");
      } else {
        await dashboardApi.createApplication(data);
        showSuccess("Application created successfully");
        // Mark job applied for onboarding tracking
        if (!onboarding.hasAppliedToJob) {
          onboarding.markJobApplied();
        }
      }
      await onRefetchApplications();
      setShowApplicationForm(false);
      setEditingApplication(null);
    } catch (error) {
      console.error("Error saving application:", error);
      showError("Unable to save application", "Please check your internet connection and try again. Your application data is temporarily stored locally.");
    }
  };

  return {
    showApplicationForm,
    setShowApplicationForm,
    editingApplication,
    setEditingApplication,
    selectedApplication,
    setSelectedApplication,
    handleEditApplication,
    handleViewApplication,
    handleDeleteApplication,
    handleApplicationSubmit,
  };
}
