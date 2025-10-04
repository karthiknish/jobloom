"use client";

import React from "react";
import {
  RefreshCw,
  CreditCard,
  Crown,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "firebase/auth";

interface SettingsSidebarProps {
  user: User | null;
  plan: string;
  subscriptionLoading: boolean;
  billingPortalLoading: boolean;
  showBillingButton: boolean;
  onBillingPortal: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

export function SettingsSidebar({
  user,
  plan,
  subscriptionLoading,
  billingPortalLoading,
  showBillingButton,
  onBillingPortal,
  onUpgrade,
  onSignOut,
}: SettingsSidebarProps) {
  return (
    <div className="lg:w-80">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback className="text-lg bg-emerald-100 text-emerald-600">
                {user?.displayName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900">
                {user?.displayName || 'User'}
              </div>
              <div className="text-sm text-gray-600">{user?.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                Member since {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-2">
            {subscriptionLoading ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                disabled
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking plan...
              </Button>
            ) : showBillingButton ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onBillingPortal}
                disabled={billingPortalLoading}
              >
                {billingPortalLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Opening Billing Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Manage Billing
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full justify-start gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={onUpgrade}
              >
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={onSignOut}
            >
              <Key className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
