"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { useRemoteConfig } from "@/hooks/useRemoteConfig";
import { SubdomainSettings } from "@/components/account/SubdomainSettings";
import { FeatureGate } from "@/components/UpgradePrompt";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Settings,
  Bell,
  User,
  Shield,
  Globe,
  CreditCard,
  Database,
  Key,
  Loader2,
  Crown,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Save,
  Trash2,
  Download,
  Ban,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Lock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/components/ui/Toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SubscriptionLimits } from "@/types/api";

interface UserPreferences {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlertsEnabled: boolean;
  jobKeywords: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  salaryRange: { min?: number; max?: number };
  jobTypes: string[];
  experienceLevels: string[];
  industries: string[];
  analyticsTracking: boolean;
  dataSharing: boolean;
  marketingEmails: boolean;
}

const createDefaultPreferences = (): UserPreferences => ({
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  jobAlertsEnabled: false,
  jobKeywords: [],
  preferredCompanies: [],
  preferredLocations: [],
  salaryRange: {},
  jobTypes: [],
  experienceLevels: [],
  industries: [],
  analyticsTracking: true,
  dataSharing: false,
  marketingEmails: true,
});

const PremiumFeatureLockCard = ({
  title,
  description,
  feature,
}: {
  title: string;
  description: string;
  feature: string;
}) => (
  <Card className="h-full border-dashed border-primary/40 bg-primary/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-primary">
        <Crown className="h-5 w-5" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button
        asChild
        className="w-full bg-gradient-to-r from-primary to-secondary text-white"
      >
        <a href={`/upgrade?feature=${feature}`}>Upgrade to unlock</a>
      </Button>
    </CardContent>
  </Card>
);

export default function SettingsPage() {
  const {
    user,
    updatePassword: updateUserPassword,
    sendEmailVerification: triggerEmailVerification,
  } = useFirebaseAuth();
  const { subscription, plan, limits, currentUsage, hasFeature, refreshSubscription } = useSubscription();
  const {
    isJobImportEnabled,
    isCvAnalysisEnabled,
    isAdvancedFiltersEnabled,
    isBulkActionsEnabled,
    isRealTimeUpdatesEnabled,
    isAnalyticsEnabled,
    isNotificationsEnabled,
    isBetaFeaturesEnabled,
    dashboardRefreshIntervalSeconds,
    notificationDisplayDurationSeconds,
    maintenanceMessage
  } = useRemoteConfig();
  const [activeTab, setActiveTab] = useState("profile");
  const [preferences, setPreferences] = useState<UserPreferences>(createDefaultPreferences);

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isResumingSubscription, setIsResumingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [verificationSending, setVerificationSending] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const exportFormats = limits.exportFormats ?? [];
  type PremiumCapability = {
    key: keyof SubscriptionLimits;
    label: string;
    description: string;
    requires?: string[];
  };

  const premiumCapabilities: PremiumCapability[] = [
    {
      key: "advancedAnalytics",
      label: "Advanced analytics",
      description: "Detailed dashboards and performance insights to track your search.",
    },
    {
      key: "customAlerts",
      label: "Custom job alerts",
      description: "Receive personalised alerts based on job keywords, companies, and locations.",
    },
    {
      key: "prioritySupport",
      label: "Priority support",
      description: "Skip the queue with fast responses from the Hireall support team.",
    },
    {
      key: "teamCollaboration",
      label: "Team collaboration",
      description: "Invite collaborators to manage job applications together.",
    },
    {
      key: "exportFormats",
      label: "Premium exports",
      description: "Unlock JSON and PDF exports alongside CSV downloads.",
      requires: ["json", "pdf"],
    },
  ];

  const featureStatusList = [
    { key: "jobImport", label: "Job import", enabled: isJobImportEnabled, description: "Import roles directly from supported sources." },
    { key: "cvAnalysis", label: "CV analysis", enabled: isCvAnalysisEnabled, description: "Run AI-powered resume scoring and feedback." },
    { key: "advancedFilters", label: "Advanced filters", enabled: isAdvancedFiltersEnabled, description: "Filter jobs by location, sponsorship, salary, and more." },
    { key: "bulkActions", label: "Bulk actions", enabled: isBulkActionsEnabled, description: "Update multiple applications in one click." },
    { key: "realTimeUpdates", label: "Real-time updates", enabled: isRealTimeUpdatesEnabled, description: "Receive instant changes when job statuses update." },
    { key: "analytics", label: "Analytics tracking", enabled: isAnalyticsEnabled, description: "Collect usage data to power analytics dashboards." },
    { key: "notifications", label: "Notifications", enabled: isNotificationsEnabled, description: "Enable in-app and email notifications." },
    { key: "betaFeatures", label: "Beta features", enabled: isBetaFeaturesEnabled, description: "Access experimental tools before everyone else." },
  ];
  const exportFormatsFeatureKey: keyof SubscriptionLimits = "exportFormats";
  const premiumExportsUnlocked = hasFeature(exportFormatsFeatureKey, ["json", "pdf"]);

  const nextBillingDate = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")
    : null;

  const cancellationEffectiveDate = subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")
    : null;

  const handleChangePassword = async () => {
    if (!user) return;

    const { current, next, confirm } = passwordForm;
    if (!current || !next || !confirm) {
      setChangePasswordError("Please complete all password fields.");
      return;
    }

    if (next.length < 8) {
      setChangePasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (next !== confirm) {
      setChangePasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setChangePasswordError(null);
      setChangePasswordLoading(true);
      await updateUserPassword(current, next);
      showSuccess("Password changed!", "Your password has been updated successfully.");
      setPasswordForm({ current: "", next: "", confirm: "" });
      setShowChangePasswordForm(false);
    } catch (error: any) {
      const message = typeof error?.message === "string" ? error.message : "Failed to update password.";
      setChangePasswordError(message);
      showError(message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user || user.emailVerified) return;

    try {
      setVerificationSending(true);
      await triggerEmailVerification();
    } catch (error) {
      console.error("Error sending verification email:", error);
    } finally {
      setVerificationSending(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!user) return;

    try {
      setRevokingSessions(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/revoke-sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke sessions');
      }

      showSuccess("Sessions revoked!", "You've been signed out from all other devices.");
    } catch (error) {
      console.error('Error revoking sessions:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke sessions';
      showError(message);
    } finally {
      setRevokingSessions(false);
    }
  };

  const manageBilling = async () => {
    if (!user) return;

    try {
      setIsManagingBilling(true);
      setSubscriptionError(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Unable to open billing portal");
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Billing portal URL was not returned");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      const message = error instanceof Error ? error.message : "Unable to open billing portal";
      setSubscriptionError(message);
      showError(message);
    } finally {
      setIsManagingBilling(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user) return;

    try {
      setIsCancellingSubscription(true);
      setSubscriptionError(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel subscription");
      }

      showSuccess("Cancellation scheduled", "Your subscription will end at the next billing date.");
      await refreshSubscription();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      const message = error instanceof Error ? error.message : "Unable to cancel subscription";
      setSubscriptionError(message);
      showError(message);
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const resumeSubscription = async () => {
    if (!user) return;

    try {
      setIsResumingSubscription(true);
      setSubscriptionError(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to resume subscription");
      }

      showSuccess("Subscription restored!", "Your subscription will continue as normal.");
      await refreshSubscription();
    } catch (error) {
      console.error("Error resuming subscription:", error);
      const message = error instanceof Error ? error.message : "Unable to resume subscription";
      setSubscriptionError(message);
      showError(message);
    } finally {
      setIsResumingSubscription(false);
    }
  };

  // Load user preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/settings/preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences({
            ...createDefaultPreferences(),
            ...(data.preferences ?? {}),
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setPreferences({
              ...createDefaultPreferences(),
              ...(parsed ?? {}),
            });
          } catch (localError) {
            console.error('Error loading local preferences:', localError);
          }
        }
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to backend
  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        showSuccess('Preferences saved!', 'Your settings have been updated.');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Save failed', 'Unable to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Export user data
  const exportData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/export', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Data exported!', `Your data has been downloaded as ${data.filename}`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Export failed', 'Unable to export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (!user) return;

    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE_MY_ACCOUNT_PERMANENTLY" to confirm:'
    );

    if (confirmation !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
      showError('Deletion cancelled', 'Confirmation text did not match. Account deletion cancelled.');
      return;
    }

    setDeletingAccount(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmation,
          reason: 'User requested account deletion from settings'
        })
      });

      if (response.ok) {
        showSuccess('Account deleted', 'Your account has been permanently deleted.');
        // Sign out and redirect after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showError('Deletion failed', 'Unable to delete account. Please contact support.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="mb-4">Please sign in to access settings.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Settings className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account, preferences, and features</p>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="flex items-center gap-4 mb-6">
              <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
                {plan} Plan
              </Badge>
              {subscription?.status === 'active' && (
                <span className="text-sm text-muted-foreground">
                  Next billing: {subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy') : 'N/A'}
                </span>
              )}
              {plan === 'free' && (
                <Button size="sm" asChild>
                  <a href="/upgrade">Upgrade</a>
                </Button>
              )}
            </div>

            {plan === 'free' && (
              <Card className="border border-primary/30 bg-primary/5">
                <CardContent className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-primary">Unlock premium features</h2>
                      <p className="text-sm text-muted-foreground">
                        Unlimited CV analyses, custom job alerts, API access, and JSON/PDF exports are just one click away.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
                    <a href="/upgrade">View premium plans</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 h-auto">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Features</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Your basic account details and profile information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.displayName || "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Member Since</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.metadata?.creationTime
                          ? format(new Date(user.metadata.creationTime), "MMMM d, yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Status</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription & Billing
                    </CardTitle>
                    <CardDescription>
                      Manage your plan, billing cycle, and cancellation settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
                            {plan} plan
                          </Badge>
                          {subscription?.status === 'active' && subscription?.billingCycle && (
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {subscription.billingCycle}
                            </span>
                          )}
                        </div>
                      </div>
                      {nextBillingDate && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                          <p className="text-sm">{nextBillingDate}</p>
                        </div>
                      )}
                    </div>

                    {subscription?.cancelAtPeriodEnd && cancellationEffectiveDate && (
                      <Alert className="border-accent/20 bg-accent/5 text-accent-foreground">
                        <AlertTitle className="flex items-center gap-2">
                          <Ban className="h-4 w-4" />
                          Subscription Cancelling
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          Your subscription will end on {cancellationEffectiveDate}. You can resume it before this date.
                        </AlertDescription>
                      </Alert>
                    )}

                    {subscriptionError && (
                      <Alert variant="destructive">
                        <AlertTitle className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" />
                          Billing Action Failed
                        </AlertTitle>
                        <AlertDescription>{subscriptionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={manageBilling}
                        disabled={isManagingBilling}
                      >
                        {isManagingBilling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Opening Portal...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Manage Billing
                          </>
                        )}
                      </Button>

                      {plan === 'free' ? (
                        <Button className="w-full" asChild>
                          <a href="/upgrade">
                            <Crown className="h-4 w-4" />
                            Upgrade Plan
                          </a>
                        </Button>
                      ) : subscription?.cancelAtPeriodEnd ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={resumeSubscription}
                          disabled={isResumingSubscription}
                        >
                          {isResumingSubscription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Resuming...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              Resume Subscription
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={cancelSubscription}
                          disabled={isCancellingSubscription}
                        >
                          {isCancellingSubscription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4" />
                              Cancel at Period End
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {plan !== 'free' && (
                      <p className="text-xs text-muted-foreground">
                        Need to change payment method or download invoices? Open the billing portal for full Stripe controls.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Usage Statistics
                    </CardTitle>
                    <CardDescription>
                      Your current usage and limits for this billing period.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        whileHover={{ y: -2 }}
                        className="text-center"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-primary">
                          {currentUsage?.applications || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Jobs Tracked {limits.applicationsPerMonth !== -1 && `(${limits.applicationsPerMonth - (currentUsage?.applications || 0)} left)`}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -2 }}
                        className="text-center"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                          <ClipboardList className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-secondary">
                          {currentUsage?.cvAnalyses || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          CV Analyses {limits.cvAnalysesPerMonth !== -1 && `(${limits.cvAnalysesPerMonth - (currentUsage?.cvAnalyses || 0)} left)`}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        whileHover={{ y: -2 }}
                        className="text-center"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                          <CalendarCheck className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-secondary">
                          0
                        </div>
                        <div className="text-sm text-muted-foreground">Interviews</div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {/* Public Portfolio Link */}
                <div className="lg:col-span-2">
                  <SubdomainSettings />
                </div>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appearance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive notifications and updates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Job Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about new job opportunities
                        </p>
                      </div>
                      <Switch
                        checked={preferences.jobAlertsEnabled}
                        onCheckedChange={(checked) => updatePreference('jobAlertsEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Job Preferences */}
                <FeatureGate
                  feature="customAlerts"
                  showUpgradePrompt={false}
                  fallback={
                    <PremiumFeatureLockCard
                      feature="customAlerts"
                      title="Personalised job alerts"
                      description="Upgrade to set job keywords, preferred companies, and salary bands for tailored alerts."
                    />
                  }
                >
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Job Preferences</CardTitle>
                      <CardDescription>
                        Set your job search preferences to receive personalized recommendations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Job Keywords</Label>
                            <Textarea
                              placeholder="e.g., React, Node.js, Senior, Frontend"
                              value={preferences.jobKeywords.join(', ')}
                              onChange={(e) => updatePreference('jobKeywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter keywords separated by commas
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Preferred Companies</Label>
                            <Textarea
                              placeholder="e.g., Google, Microsoft, Apple"
                              value={preferences.preferredCompanies.join(', ')}
                              onChange={(e) => updatePreference('preferredCompanies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Preferred Locations</Label>
                            <Textarea
                              placeholder="e.g., San Francisco, Remote, New York"
                              value={preferences.preferredLocations.join(', ')}
                              onChange={(e) => updatePreference('preferredLocations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Min Salary ($)</Label>
                              <Input
                                type="number"
                                placeholder="80000"
                                value={preferences.salaryRange.min || ''}
                                onChange={(e) => updatePreference('salaryRange', {
                                  ...preferences.salaryRange,
                                  min: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Salary ($)</Label>
                              <Input
                                type="number"
                                placeholder="150000"
                                value={preferences.salaryRange.max || ''}
                                onChange={(e) => updatePreference('salaryRange', {
                                  ...preferences.salaryRange,
                                  max: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FeatureGate>
              </div>

              {/* Save Preferences */}
              <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan capabilities</CardTitle>
                  <CardDescription>
                    {plan === 'premium'
                      ? 'Everything currently available with your premium subscription.'
                      : 'Preview what unlocks instantly when you upgrade to premium.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {premiumCapabilities.map((capability) => {
                      const unlocked = hasFeature(
                        capability.key,
                        capability.requires
                      );

                      return (
                        <div
                          key={capability.key}
                          className="flex gap-3 rounded-lg border border-border/60 bg-background/60 p-4"
                        >
                          <div
                            className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                              unlocked
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {unlocked ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Lock className="h-5 w-5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{capability.label}</p>
                            <p className="text-sm text-muted-foreground">{capability.description}</p>
                            {capability.key === 'exportFormats' && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {exportFormats.length > 0 ? (
                                  exportFormats.map((format) => (
                                    <Badge
                                      key={format}
                                      variant={
                                        ['json', 'pdf'].includes(format)
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="uppercase text-[10px] tracking-wide"
                                    >
                                      {format}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="uppercase text-[10px] tracking-wide"
                                  >
                                    CSV
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature availability</CardTitle>
                    <CardDescription>
                      Live status of the remote feature flags powering Hireall.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {featureStatusList.map((feature) => (
                      <div
                        key={feature.key}
                        className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{feature.label}</p>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                        <Badge
                          variant={feature.enabled ? 'default' : 'outline'}
                          className={feature.enabled ? 'bg-primary/10 text-primary border-primary/30' : ''}
                        >
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System information</CardTitle>
                    <CardDescription>
                      Key configuration values for your workspace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Dashboard refresh</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Every {dashboardRefreshIntervalSeconds} seconds
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Notification duration</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notificationDisplayDurationSeconds} seconds
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Monthly limits</Label>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <p>
                          CV analyses: {limits.cvAnalysesPerMonth === -1 ? 'Unlimited' : limits.cvAnalysesPerMonth}
                        </p>
                        <p>
                          Applications: {limits.applicationsPerMonth === -1 ? 'Unlimited' : limits.applicationsPerMonth}
                        </p>
                      </div>
                    </div>
                    {maintenanceMessage && (
                      <div>
                        <Label className="text-sm font-medium">Maintenance notice</Label>
                        <p className="text-sm text-muted-foreground mt-1">{maintenanceMessage}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Subscription</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
                          {plan} plan
                        </Badge>
                        {plan === 'free' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href="/upgrade">Upgrade</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data management
                    </CardTitle>
                    <CardDescription>
                      Export your records or permanently close your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                        <p className="font-medium text-foreground">Export your data</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Includes jobs, applications, preferences, and subscription history.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 flex items-center gap-2"
                          onClick={exportData}
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Export {premiumExportsUnlocked ? 'JSON' : 'CSV'}
                            </>
                          )}
                        </Button>
                        {!premiumExportsUnlocked && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Premium unlocks JSON and PDF export formats in addition to CSV.
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                        <p className="font-medium text-foreground">Delete account</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permanently remove your Hireall data and account access.
                        </p>
                        <Button
                          variant="destructive"
                          className="mt-4 flex items-center gap-2"
                          onClick={deleteAccount}
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete account
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Data exports remain available for one hour via secure links. Account deletion is immediate and irreversible.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Security */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Security
                    </CardTitle>
                    <CardDescription>
                      Manage your account security settings and authentication.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">
                        Keep your account secure by using a strong, unique password.
                        </p>
                      </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowChangePasswordForm((prev) => !prev);
                          setChangePasswordError(null);
                        }}
                      >
                        {showChangePasswordForm ? "Cancel" : "Change Password"}
                      </Button>
                    </div>
                    </div>

                  {showChangePasswordForm && (
                    <Card className="border border-border/60 bg-muted/30">
                      <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            placeholder="Enter current password"
                            value={passwordForm.current}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                            }
                            disabled={changePasswordLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={passwordForm.next}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                            }
                            disabled={changePasswordLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordForm.confirm}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                            }
                            disabled={changePasswordLoading}
                          />
                        </div>

                        {changePasswordError && (
                          <Alert variant="destructive">
                            <AlertTitle>Password update failed</AlertTitle>
                            <AlertDescription>{changePasswordError}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setShowChangePasswordForm(false);
                              setPasswordForm({ current: "", next: "", confirm: "" });
                              setChangePasswordError(null);
                            }}
                            disabled={changePasswordLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleChangePassword}
                            disabled={changePasswordLoading}
                          >
                            {changePasswordLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update Password"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Active Sessions</p>
                        <p className="text-sm text-muted-foreground">
                          Manage your active login sessions
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Sessions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Privacy & Data
                    </CardTitle>
                    <CardDescription>
                      Control your privacy settings and data sharing preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Analytics Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Help improve the app with usage data
                        </p>
                      </div>
                      <Switch defaultChecked={isAnalyticsEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">
                          Share anonymized data for research
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive product updates and offers
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
