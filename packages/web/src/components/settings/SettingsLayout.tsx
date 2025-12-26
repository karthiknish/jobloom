"use client";

import React from "react";
import { SettingsHeader } from "./SettingsHeader";
import { SettingsSidebar } from "./SettingsSidebar";
import { SettingsTabs } from "./SettingsTabs";
import { User } from "firebase/auth";

interface SettingsLayoutProps {
  user: User | null;
  plan: string;
  subscriptionLoading: boolean;
  billingPortalLoading: boolean;
  showBillingButton: boolean;
  activeTab: string;
  hasChanges: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  onReset: () => void;
  onBillingPortal: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

export function SettingsLayout({
  user,
  plan,
  subscriptionLoading,
  billingPortalLoading,
  showBillingButton,
  activeTab,
  hasChanges,
  isLoading,
  children,
  onTabChange,
  onSave,
  onReset,
  onBillingPortal,
  onUpgrade,
  onSignOut,
}: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <SettingsHeader
          hasChanges={hasChanges}
          isLoading={isLoading}
          onSave={onSave}
          onReset={onReset}
        />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <SettingsSidebar
              user={user}
              plan={plan}
              subscriptionLoading={subscriptionLoading}
              billingPortalLoading={billingPortalLoading}
              showBillingButton={showBillingButton}
              onBillingPortal={onBillingPortal}
              onUpgrade={onUpgrade}
              onSignOut={onSignOut}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="space-y-6 max-h-[calc(100vh-12rem)] lg:max-h-none overflow-y-auto lg:overflow-visible px-1 -mx-1">
                <SettingsTabs
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  initialTab="profile"
                  variant="default"
                  showIcons={true}
                  showDescriptions={true}
                />

                {/* Tab Content */}
                {children}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
