"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, signOut as firebaseSignOut, updateProfile } from "firebase/auth";

import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { VisaCriteriaSettings } from "@/components/settings/VisaCriteriaSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { FeaturesSettings } from "@/components/settings/FeaturesSettings";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/providers/subscription-provider";
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

  const sanitizeNonNegativeNumber = (value: unknown, fallback: number) => {
    const asNumber = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(asNumber)) return fallback;
    return Math.max(0, asNumber);
  };

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userLoading && firebaseUser) {
        try {
          // Load preferences from backend
          const token = await firebaseUser.getIdToken();
          const response = await fetch("/api/settings/preferences", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const backendPrefs = data.preferences || {};
            const minimumSalary = sanitizeNonNegativeNumber(backendPrefs.minimumSalary, 38700);

            const userData = {
              profile: {
                firstName: firebaseUser.displayName?.split(' ')[0] || "",
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
                email: firebaseUser.email || "",
                phone: firebaseUser.phoneNumber || "",
                avatar: firebaseUser.photoURL || "",
              },
              preferences: {
                emailNotifications: backendPrefs.emailNotifications ?? true,
                pushNotifications: backendPrefs.pushNotifications ?? false,
                newsletter: backendPrefs.newsletter ?? backendPrefs.marketingEmails ?? true,
                marketingEmails: backendPrefs.marketingEmails ?? false,
                theme: backendPrefs.theme ?? "light",
                // Extension-specific preferences from backend
                ukFiltersEnabled: backendPrefs.ukFiltersEnabled ?? false,
                autoDetectJobs: backendPrefs.autoDetectJobs ?? true,
                showSponsorButton: backendPrefs.showSponsorButton ?? true,
                ageCategory: backendPrefs.ageCategory ?? "adult",
                educationStatus: backendPrefs.educationStatus ?? "none",
                phdStatus: backendPrefs.phdStatus ?? "none",
                professionalStatus: backendPrefs.professionalStatus ?? "none",
                minimumSalary,
                jobCategories: backendPrefs.jobCategories ?? [] as string[],
                locationPreference: backendPrefs.locationPreference ?? "uk",
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
          } else {
            console.error("Failed to load preferences from backend");
            // Fallback to default values
            const userData = {
              profile: {
                firstName: firebaseUser.displayName?.split(' ')[0] || "",
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
                email: firebaseUser.email || "",
                phone: firebaseUser.phoneNumber || "",
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
                minimumSalary: 38700,
                jobCategories: [] as string[],
                locationPreference: "uk",
              },
              security: {
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              },
            };
            setFormData(userData);
            setOriginalData(userData);
          }
        } catch (error) {
          console.error("Error loading user preferences:", error);
          toast.error("Failed to load preferences");
        }
      }
    };

    loadUserPreferences();
  }, [userLoading, firebaseUser, toast]);

  useEffect(() => {
    const currentComparable = {
      profile: formData.profile,
      preferences: formData.preferences,
    };
    const originalComparable = {
      profile: originalData.profile,
      preferences: originalData.preferences,
    };
    setHasChanges(JSON.stringify(currentComparable) !== JSON.stringify(originalComparable));
  }, [formData.profile, formData.preferences, originalData.profile, originalData.preferences]);

  const handleInputChange = (section: string, field: string, value: any) => {
    const sanitizedValue =
      section === "preferences" && field === "minimumSalary"
        ? sanitizeNonNegativeNumber(value, formData.preferences.minimumSalary)
        : value;

    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: sanitizedValue,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (!firebaseUser) {
        toast.error("User not authenticated");
        return;
      }

      const preferencesToSave = {
        ...formData.preferences,
        minimumSalary: sanitizeNonNegativeNumber(formData.preferences.minimumSalary, 0),
      };

      // Save preferences to backend
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferences: preferencesToSave,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences to backend");
      }

      // Update profile if changed
      if (
        formData.profile.firstName !== originalData.profile.firstName ||
        formData.profile.lastName !== originalData.profile.lastName
      ) {
        await updateProfile(firebaseUser, {
          displayName: `${formData.profile.firstName} ${formData.profile.lastName}`.trim(),
        });
      }

      // Sync both UK Settings and Extension settings
      const syncData = {
        // UK Settings - matches extension UserProfileManager structure
        userVisaCriteria: {
          ukFiltersEnabled: formData.preferences.ukFiltersEnabled,
          ageCategory: formData.preferences.ageCategory === 'youngAdult' ? 'under26' : 'adult',
          educationStatus: formData.preferences.educationStatus === 'bachelor' ? 'graduateVisa' : formData.preferences.educationStatus,
          phdStatus: formData.preferences.phdStatus === 'completed' ? 'stemPhd' : formData.preferences.phdStatus === 'in-progress' ? 'nonStemPhD' : 'none',
          professionalStatus: formData.preferences.professionalStatus,
          minimumSalary: preferencesToSave.minimumSalary,
          jobCategories: formData.preferences.jobCategories,
          locationPreference: formData.preferences.locationPreference,
        },
        // Extension Settings - matches extension UserProfileManager structure
        preferences: {
          enableSponsorshipChecks: formData.preferences.showSponsorButton !== false,
          enableAutoDetection: formData.preferences.autoDetectJobs !== false,
          enableJobBoardIntegration: true,
        },
      };

      // Save to chrome storage sync for extension access
      if (typeof window !== "undefined") {
        const chromeApi = window.chrome;
        const chromeRuntime = chromeApi?.runtime;
        const storageSync = chromeApi?.storage?.sync;
        const storageSyncSet = storageSync?.set?.bind(storageSync);
        if (storageSyncSet) {
          await new Promise<void>((resolve, reject) => {
            storageSyncSet(syncData, () => {
              if (chromeRuntime?.lastError) {
                reject(new Error(chromeRuntime.lastError.message || "Chrome runtime error"));
              } else {
                resolve();
              }
            });
          });
        }
      }

      // Also send message to any loaded extension instances
      if (typeof window !== "undefined") {
        window.postMessage(
          {
            type: "HIREALL_EXTENSION_UPDATE_PREFS",
            payload: {
              ...syncData,
              // Legacy support for old extension versions
              enableSponsorshipChecks: formData.preferences.showSponsorButton !== false,
              ukFiltersEnabled: formData.preferences.ukFiltersEnabled,
            },
          },
          "*"
        );
      }

      setOriginalData({
        ...formData,
        preferences: preferencesToSave,
        security: originalData.security,
      });
      toast.success(TOAST_MESSAGES.SETTINGS.PROFILE_SAVED);
    } catch (error) {
      console.error("Error saving preferences:", error);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
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