import { useState } from "react";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";

interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  job?: any;
}

export function useApplicationManagement(onRefetchApplications: () => void) {
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

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      await dashboardApi.deleteApplication(applicationId);
      await onRefetchApplications();
      showSuccess("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      showError("Failed to delete application");
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
      }
      await onRefetchApplications();
      setShowApplicationForm(false);
      setEditingApplication(null);
    } catch (error) {
      console.error("Error saving application:", error);
      showError("Failed to save application");
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
