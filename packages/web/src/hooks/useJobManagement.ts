import { useState } from "react";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useOnboardingState } from "@/hooks/useOnboardingState";

interface JobFormData {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary: string;
  isSponsored: boolean;
  isRecruitmentAgency: boolean;
  source: string;
  jobType: string;
  experienceLevel: string;
}

export function useJobManagement(onRefetchJobStats: () => void) {
  const [showJobForm, setShowJobForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const onboarding = useOnboardingState();

  const handleJobSubmit = async (data: JobFormData) => {
    try {
      await dashboardApi.createJob(data as unknown as Record<string, unknown>);
      await onRefetchJobStats();
      
      // Mark first job added for onboarding tracking
      if (!onboarding.hasAddedFirstJob) {
        onboarding.markFirstJobAdded();
      }
      
      showSuccess("Job added to your dashboard!", "You can now track this opportunity and update its status as you progress through the application process.");
      setShowJobForm(false);
    } catch (error) {
      console.error("Error adding job:", error);
      showError("Unable to save job", "Please check your internet connection and try again. If the problem persists, contact support.");
      throw error; // Re-throw so JobForm can handle it
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
