"use client";

import React from "react";
import {
  User,
  Settings,
  Shield,
  Crown,
  Bell,
  Mail,
  Send,
  Smartphone,
  Zap
} from "lucide-react";
import { TabsSystem, TabConfig } from "@/components/ui/tabs-system";

export const SETTINGS_TABS: TabConfig[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Personal Details",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Settings,
    description: "App Behavior",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alerts & Emails",
  },
  {
    id: "visa", 
    label: "UK Visa",
    icon: Shield,
    description: "Eligibility Criteria",
  },
  {
    id: "features",
    label: "Features & Plan",
    icon: Crown,
    description: "Manage Subscription",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Privacy & Access",
  },
];

export interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  initialTab?: string;
  variant?: "default" | "pills" | "underline";
  showIcons?: boolean;
  showDescriptions?: boolean;
}

export function SettingsTabs({
  activeTab,
  onTabChange,
  initialTab = "profile",
  variant = "default",
  showIcons = true,
  showDescriptions = true,
}: SettingsTabsProps) {
  const tabs = SETTINGS_TABS.map((tab) => ({
    ...tab,
    description: showDescriptions ? tab.description : undefined,
  }));

  return (
    <TabsSystem
      tabs={tabs}
      activeTab={activeTab || initialTab}
      onTabChange={onTabChange}
      variant={variant}
      showIcons={showIcons}
      showDescriptions={showDescriptions}
    />
  );
}

export { SETTINGS_TABS as settingsTabsConfig };
