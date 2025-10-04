"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";

import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { VisaCriteriaSettings } from "@/components/settings/VisaCriteriaSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AutofillSettings } from "@/components/settings/AutofillSettings";
import { FeaturesSettings } from "@/components/settings/FeaturesSettings";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast, TOAST_MESSAGES } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user: firebaseUser, loading: userLoading } = useFirebaseAuth();
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const {
    plan,
    actions: subscriptionActions,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const isPaidPlan = plan !== "free";
  const showBillingButton = !subscriptionLoading && isPaidPlan;

  const [formData, setFormData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      title: "",
      company: "",
      bio: "",
      avatar: "",
    },
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      newsletter: true,
      marketingEmails: false,
      theme: "light",
      ukFiltersEnabled: false,
      autoDetectJobs: true,
      showSponsorButton: true,
      ageCategory: "adult",
      educationStatus: "none",
      phdStatus: "none",
      professionalStatus: "none",
      minimumSalary: 0,
      jobCategories: [] as string[],
      locationPreference: "uk",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    if (!userLoading && firebaseUser) {
      const userData = {
        profile: {
          firstName: firebaseUser.displayName?.split(' ')[0] || "",
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
          location: "",
          title: "",
          company: "",
          bio: "",
          avatar: firebaseUser.photoURL || "",
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          newsletter: true,
          marketingEmails: false,
          theme: "light",
          ukFiltersEnabled: false,
          autoDetectJobs: true,
          showSponsorButton: true,
          ageCategory: "adult",
          educationStatus: "none",
          phdStatus: "none",
          professionalStatus: "none",
          minimumSalary: 0,
          jobCategories: [] as string[],
          locationPreference: "uk",
        },
        security: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      };
      // Only update if the data has actually changed
      setFormData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(userData)) {
          return userData;
        }
        return prev;
      });
      setOriginalData(userData);
    }
  }, [userLoading, firebaseUser]);

  const handleInputChange = (section: string, field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalData(formData);
      setHasChanges(false);
      toast.success(TOAST_MESSAGES.SETTINGS.PROFILE_SAVED);

      if (typeof window !== "undefined") {
        window.postMessage(
          {
            type: "HIREALL_EXTENSION_UPDATE_PREFS",
            payload: {
              enableSponsorshipChecks: formData.preferences.showSponsorButton !== false,
            },
          },
          "*"
        );
      }
    } catch (error) {
      toast.error(TOAST_MESSAGES.SETTINGS.SETTINGS_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    setHasChanges(false);
  };

  const handleBillingPortal = async () => {
    if (!firebaseUser) {
      toast.error(TOAST_MESSAGES.GENERIC.UNAUTHORIZED);
      return;
    }

    try {
      setBillingPortalLoading(true);

      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.status === 404) {
        toast.info(
          "Billing portal unavailable",
          "We couldn't find an active subscription for your account. Upgrade your plan to manage billing."
        );
        return;
      }

      if (!response.ok) {
        const errorMessage =
          (data && typeof data.error === "string" && data.error) ||
          TOAST_MESSAGES.GENERIC.ERROR;
        toast.error("Unable to open billing portal", errorMessage);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      toast.error(
        "Unable to open billing portal",
        "No billing portal URL was returned. Please try again later."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : TOAST_MESSAGES.GENERIC.ERROR;
      toast.error("Unable to open billing portal", errorMessage);
    } finally {
      setBillingPortalLoading(false);
    }
  };

  const handleUpgrade = () => {
    const checkoutUrl = subscriptionActions.checkoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    router.push("/upgrade");
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      toast.success(TOAST_MESSAGES.AUTH.SIGN_OUT_SUCCESS);
      router.push("/");
    } catch (error) {
      toast.error(TOAST_MESSAGES.GENERIC.ERROR);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSettings
            formData={formData}
            onInputChange={handleInputChange}
            firebaseUser={firebaseUser}
          />
        );
      case "preferences":
        return (
          <PreferencesSettings
            formData={formData}
            onInputChange={handleInputChange}
          />
        );
      case "visa-criteria":
        return (
          <VisaCriteriaSettings
            formData={formData}
            onInputChange={handleInputChange}
          />
        );
      case "autofill":
        return <AutofillSettings />;
      case "security":
        return (
          <SecuritySettings
            formData={formData}
            onInputChange={handleInputChange}
            user={firebaseUser}
          />
        );
      case "features":
        return (
          <FeaturesSettings
            showBillingButton={showBillingButton}
            billingPortalLoading={billingPortalLoading}
            onBillingPortalClick={handleBillingPortal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      user={firebaseUser}
      plan={plan || "free"}
      subscriptionLoading={subscriptionLoading}
      billingPortalLoading={billingPortalLoading}
      showBillingButton={showBillingButton}
      activeTab={activeTab}
      hasChanges={hasChanges}
      isLoading={isLoading}
      onTabChange={setActiveTab}
      onSave={handleSave}
      onReset={handleReset}
      onBillingPortal={handleBillingPortal}
      onUpgrade={handleUpgrade}
      onSignOut={handleSignOut}
    >
      {renderActiveTabContent()}
    </SettingsLayout>
  );
}