"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  User,
  CreditCard,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Loader2,
  Crown,
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SubdomainSettings } from "@/components/account/SubdomainSettings";

interface ProfileSettingsProps {
  user: any;
  plan: string;
  subscription: any;
  limits: any;
  currentUsage: any;
  nextBillingDate?: string;
  cancellationEffectiveDate?: string;
  subscriptionError: string | null;
  isManagingBilling: boolean;
  isCancellingSubscription: boolean;
  isResumingSubscription: boolean;
  manageBilling: () => void;
  cancelSubscription: () => void;
  resumeSubscription: () => void;
}

export function ProfileSettings({
  user,
  plan,
  subscription,
  limits,
  currentUsage,
  nextBillingDate,
  cancellationEffectiveDate,
  subscriptionError,
  isManagingBilling,
  isCancellingSubscription,
  isResumingSubscription,
  manageBilling,
  cancelSubscription,
  resumeSubscription
}: ProfileSettingsProps) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}