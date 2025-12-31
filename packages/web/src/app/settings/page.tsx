"use client";

import React, { useEffect, useState } from "react";
import { Bell, Mail, Send, Smartphone, Zap } from "lucide-react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { VisaCriteriaSettings } from "@/components/settings/VisaCriteriaSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { FeaturesSettings } from "@/components/settings/FeaturesSettings";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/providers/subscription-provider";
import { useToast, TOAST_MESSAGES } from "@/hooks/use-toast";
import { LoadingPage } from "@/components/ui/loading";
import { settingsApi } from "@/utils/api/settings";
import { subscriptionApi } from "@/utils/api/subscription";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { getAuth, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

const settingsSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    avatar: z.string().optional(),
  }),
  preferences: z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    newsletter: z.boolean(),
    marketingEmails: z.boolean(),
    ukFiltersEnabled: z.boolean(),
    autoDetectJobs: z.boolean(),
    showSponsorButton: z.boolean(),
    ageCategory: z.string(),
    educationStatus: z.string(),
    phdStatus: z.string(),
    professionalStatus: z.string(),
    minimumSalary: z.number().min(0),
    jobCategories: z.array(z.string()),
    locationPreference: z.string(),
  }),
  security: z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  }).refine((data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user: firebaseUser, loading: userLoading } = useFirebaseAuth();
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [originalData, setOriginalData] = useState<SettingsFormValues | null>(null);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const {
    plan,
    actions: subscriptionActions,
    isLoading: subscriptionLoading,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState("profile");

  const isPaidPlan = plan !== "free";
  const showBillingButton = !subscriptionLoading && isPaidPlan;

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
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
        ukFiltersEnabled: false,
        autoDetectJobs: true,
        showSponsorButton: true,
        ageCategory: "adult",
        educationStatus: "none",
        phdStatus: "none",
        professionalStatus: "none",
        minimumSalary: 0,
        jobCategories: [],
        locationPreference: "uk",
      },
      security: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    },
  });

  const { isDirty, isValid } = form.formState;

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
          const data = await settingsApi.getPreferences();
          const backendPrefs = data.preferences || {};
          const minimumSalary = sanitizeNonNegativeNumber(backendPrefs.minimumSalary, 38700);

          const userData: SettingsFormValues = {
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
              newsletter: backendPrefs.newsletter ?? true,
              marketingEmails: backendPrefs.marketingEmails ?? false,
              ukFiltersEnabled: backendPrefs.ukFiltersEnabled ?? false,
              autoDetectJobs: backendPrefs.autoDetectJobs ?? true,
              showSponsorButton: backendPrefs.showSponsorButton ?? true,
              ageCategory: backendPrefs.ageCategory ?? "adult",
              educationStatus: backendPrefs.educationStatus ?? "none",
              phdStatus: backendPrefs.phdStatus ?? "none",
              professionalStatus: backendPrefs.professionalStatus ?? "none",
              minimumSalary,
              jobCategories: backendPrefs.jobCategories ?? [],
              locationPreference: backendPrefs.locationPreference ?? "uk",
            },
            security: {
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            },
          };

          form.reset(userData);
          setOriginalData(userData);
        } catch (error) {
          console.error("Error loading user preferences:", error);
          toast.error("Failed to load preferences");
        }
      }
    };

    loadUserPreferences();
  }, [userLoading, firebaseUser, toast, form]);

  const formData = form.watch();

  const handleSave = async (values: SettingsFormValues) => {
    setIsLoading(true);
    try {
      if (!firebaseUser) {
        toast.error("User not authenticated");
        return;
      }

      const preferencesToSave = {
        ...values.preferences,
        minimumSalary: sanitizeNonNegativeNumber(values.preferences.minimumSalary, 0),
      };

      // Save preferences to backend
      await settingsApi.updatePreferences({
        preferences: preferencesToSave,
      });

      // Update profile if changed
      const nameChanged = values.profile.firstName !== originalData?.profile.firstName ||
                          values.profile.lastName !== originalData?.profile.lastName;
      const avatarChanged = values.profile.avatar !== originalData?.profile.avatar;

      if (nameChanged || avatarChanged) {
        const fullName = `${values.profile.firstName} ${values.profile.lastName}`.trim();
        
        // 1. Update Firebase Auth Profile
        await updateProfile(firebaseUser, {
          displayName: fullName,
          photoURL: values.profile.avatar,
        });

        // 2. Sync with Firestore root 'users' collection
        await settingsApi.updateRootProfile({
          name: fullName,
          photoURL: values.profile.avatar,
        });
      }

      // Sync logic remains same using values...
      const syncData = {
        userVisaCriteria: {
          ukFiltersEnabled: values.preferences.ukFiltersEnabled,
          ageCategory: (values.preferences.ageCategory === 'youngAdult' || values.preferences.ageCategory === 'student') ? 'under26' : 'adult',
          educationStatus: values.preferences.educationStatus === 'bachelor' ? 'graduateVisa' : 
                           values.preferences.educationStatus === 'master' ? 'graduateVisa' :
                           values.preferences.educationStatus === 'phd' ? 'graduateVisa' :
                           values.preferences.educationStatus,
          phdStatus: values.preferences.phdStatus === 'completed' ? 'stemPhd' : 
                     values.preferences.phdStatus === 'in-progress' ? 'nonStemPhd' : 'none',
          professionalStatus: values.preferences.professionalStatus === 'entry-level' ? 'workingTowards' :
                              values.preferences.professionalStatus === 'junior' ? 'workingTowards' :
                              values.preferences.professionalStatus === 'mid-level' ? 'fullRegistration' :
                              values.preferences.professionalStatus === 'senior' ? 'charteredStatus' :
                              values.preferences.professionalStatus === 'expert' ? 'charteredStatus' : 'none',
          minimumSalary: preferencesToSave.minimumSalary,
          jobCategories: values.preferences.jobCategories,
          locationPreference: values.preferences.locationPreference,
        },
        preferences: {
          enableSponsorshipChecks: values.preferences.showSponsorButton !== false,
          enableAutoDetection: values.preferences.autoDetectJobs !== false,
          enableJobBoardIntegration: true,
        },
      };

      if (typeof window !== "undefined") {
        const chromeApi = window.chrome;
        const chromeRuntime = chromeApi?.runtime;
        const storageSync = chromeApi?.storage?.sync;
        const storageSyncSet = storageSync?.set?.bind(storageSync);
        
        if (storageSyncSet) {
          console.log("[Settings] Synchronization started with browser extension...");
          await new Promise<void>((resolve, reject) => {
            storageSyncSet(syncData, () => {
              if (chromeRuntime?.lastError) {
                console.warn("[Settings] Extension sync failed:", chromeRuntime.lastError.message);
                reject(new Error(chromeRuntime.lastError.message || "Chrome runtime error"));
              } else {
                console.log("[Settings] Extension sync successful.");
                resolve();
              }
            });
          });
        } else {
          console.info("[Settings] Browser extension not detected. Skipping preference synchronization.");
        }
      }

      if (typeof window !== "undefined") {
        window.postMessage(
          {
            type: "HIREALL_EXTENSION_UPDATE_PREFS",
            payload: {
              ...syncData,
              enableSponsorshipChecks: values.preferences.showSponsorButton !== false,
              ukFiltersEnabled: values.preferences.ukFiltersEnabled,
            },
          },
          "*"
        );
      }

      setOriginalData(values);
      form.reset(values);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      form.reset(originalData);
    }
  };

  const handleBillingPortal = async () => {
    if (!firebaseUser) {
      toast.error(TOAST_MESSAGES.GENERIC.UNAUTHORIZED);
      return;
    }

    try {
      setBillingPortalLoading(true);

      const data = await subscriptionApi.openPortal();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      toast.error(
        "Unable to open billing portal",
        "No billing portal URL was returned. Please try again later."
      );
    } catch (error: any) {
      if (error.status === 404) {
        toast.info(
          "Billing portal unavailable",
          "We couldn't find an active subscription for your account. Upgrade your plan to manage billing."
        );
        return;
      }
      const errorMessage = error.message || TOAST_MESSAGES.GENERIC.ERROR;
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
    return <LoadingPage label="Loading settings..." />;
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSettings
            firebaseUser={firebaseUser}
          />
        );
      case "preferences":
        return (
          <PreferencesSettings />
        );
      case "notifications":
        return (
          <NotificationsSettings />
        );
      case "visa":
        return (
          <VisaCriteriaSettings />
        );
      case "security":
        return (
          <SecuritySettings
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
    <Form {...form}>
      <SettingsLayout
        user={firebaseUser}
        plan={plan || "free"}
        subscriptionLoading={subscriptionLoading}
        billingPortalLoading={billingPortalLoading}
        showBillingButton={showBillingButton}
        activeTab={activeTab}
        hasChanges={form.formState.isDirty}
        isLoading={isLoading}
        onTabChange={setActiveTab}
        onSave={form.handleSubmit(handleSave)}
        onReset={handleReset}
        onBillingPortal={handleBillingPortal}
        onUpgrade={handleUpgrade}
        onSignOut={handleSignOut}
      >
        {renderActiveTabContent()}
      </SettingsLayout>
    </Form>
  );
}