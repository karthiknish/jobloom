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
  Palette,
  Globe,
  CreditCard,
  Clock,
  Database,
  Key,
  Mail,
  Moon,
  Sun,
  Loader2,
  Crown,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Save,
  Trash2,
  Download,
  Upload,
  Ban,
  RotateCcw,
  ShieldAlert
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

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
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
}

export default function SettingsPage() {
  const { user } = useFirebaseAuth();
  const { subscription, plan, limits, currentUsage, actions, hasFeature, refreshSubscription } = useSubscription();
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
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
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
    industries: []
  });

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isResumingSubscription, setIsResumingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const nextBillingDate = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")
    : null;

  const cancellationEffectiveDate = subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")
    : null;

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

      showSuccess("Subscription will cancel at period end");
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

      showSuccess("Subscription cancellation revoked");
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
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
          try {
            setPreferences(JSON.parse(saved));
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
        showSuccess('Preferences saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Failed to save preferences. Please try again.');
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
        showSuccess(`Data exported successfully! Downloaded ${data.filename}`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Failed to export data. Please try again.');
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
      showError('Account deletion cancelled - incorrect confirmation');
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
        showSuccess('Account deleted successfully. You will be redirected shortly.');
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
      showError('Failed to delete account. Please contact support.');
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
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
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
                      <Palette className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={preferences.theme} onValueChange={(value: any) => updatePreference('theme', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                <FeatureGate feature="customAlerts">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feature Toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Settings</CardTitle>
                    <CardDescription>
                      Enable or disable various application features.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'jobImport', label: 'Job Import', enabled: isJobImportEnabled, desc: 'Import jobs from external sources' },
                      { key: 'cvAnalysis', label: 'CV Analysis', enabled: isCvAnalysisEnabled, desc: 'AI-powered CV analysis and scoring' },
                      { key: 'advancedFilters', label: 'Advanced Filters', enabled: isAdvancedFiltersEnabled, desc: 'Advanced job filtering options' },
                      { key: 'bulkActions', label: 'Bulk Actions', enabled: isBulkActionsEnabled, desc: 'Perform actions on multiple items' },
                      { key: 'realTimeUpdates', label: 'Real-time Updates', enabled: isRealTimeUpdatesEnabled, desc: 'Live updates for job changes' },
                      { key: 'analytics', label: 'Analytics Tracking', enabled: isAnalyticsEnabled, desc: 'Usage analytics and insights' },
                      { key: 'notifications', label: 'Notifications', enabled: isNotificationsEnabled, desc: 'Push and email notifications' },
                      { key: 'betaFeatures', label: 'Beta Features', enabled: isBetaFeaturesEnabled, desc: 'Early access to new features' },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{feature.label}</Label>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                        <Switch checked={feature.enabled} disabled />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Information</CardTitle>
                    <CardDescription>
                      Current system configuration and limits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Dashboard Refresh</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Every {dashboardRefreshIntervalSeconds} seconds
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Notification Duration</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notificationDisplayDurationSeconds} seconds
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Rate Limits</Label>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <p>Jobs: 100/hour</p>
                        <p>CV Analyses: 20/hour</p>
                        <p>Applications: 50/hour</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Subscription</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={plan === 'free' ? 'secondary' : 'default'}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
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

                {/* Data Management */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                    <CardDescription>
                      Export, import, or delete your data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={exportData}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {exporting ? 'Exporting...' : 'Export Data'}
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" disabled>
                        <Upload className="h-4 w-4" />
                        Import Data
                        <span className="text-xs opacity-60">(Coming Soon)</span>
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                        onClick={deleteAccount}
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deletingAccount ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Data export includes all your jobs, applications, and settings.
                      Account deletion is permanent and cannot be undone.
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
                          Last changed 30 days ago
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>

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

                {/* API & Integrations */}
                <FeatureGate feature="apiAccess">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>API & Integrations</CardTitle>
                      <CardDescription>
                        Manage API keys and third-party integrations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                              hireall_••••••••••••••••••••••••
                            </code>
                            <Button variant="outline" size="sm">
                              Regenerate
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Webhook Endpoints</Label>
                          <div className="space-y-2">
                            <Input placeholder="https://your-app.com/webhook" />
                            <Button variant="outline" size="sm">
                              Add Webhook
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FeatureGate>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
