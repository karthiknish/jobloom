import { useState } from "react";
import { dashboardApi } from "@/utils/api/dashboard";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { useSubscription } from "@/providers/subscription-provider";
import { UpgradeIntentDetail } from "@/utils/upgradeIntent";

import { Job } from "@/types/dashboard";

export function useJobManagement(
  onRefetchJobStats: () => void,
  onUpgradeIntent?: (detail: UpgradeIntentDetail) => void
) {
  const [showJobForm, setShowJobForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const onboarding = useOnboardingState();
  const { canUseFeature, currentUsage, limits } = useSubscription();

  const checkApplicationLimit = (): boolean => {
    const usage = currentUsage?.applications ?? 0;
    const canAdd = canUseFeature("applicationsPerMonth", usage);
    if (!canAdd) {
      onUpgradeIntent?.({
        feature: "applicationsPerMonth",
        title: "Application Limit Reached",
        description:
          "You've reached your monthly limit of 50 job applications. Upgrade to Premium for unlimited applications.",
      });
      setShowUpgradePrompt(true);
      return false;
    }
    return true;
  };

  const handleJobSubmit = async (data: Job) => {
    // Check application limit before creating job
    if (!checkApplicationLimit()) {
      return;
    }

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
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleJobSubmit,
    checkApplicationLimit,
    applicationLimit: limits.applicationsPerMonth,
    currentApplications: currentUsage?.applications ?? 0,
  };
}
