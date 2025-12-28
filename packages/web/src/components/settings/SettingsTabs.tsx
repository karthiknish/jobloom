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
  Zap,
  ChevronDown
} from "lucide-react";
import { TabsSystem, TabConfig } from "@/components/ui/tabs-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  const activeTabLabel = SETTINGS_TABS.find(t => t.id === activeTab)?.label || "Select Section";

  return (
    <div className="space-y-4">
      {/* Mobile View: Select Dropdown */}
      <div className="lg:hidden">
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger className="w-full h-14 bg-white border-border/50 shadow-md rounded-xl px-4 focus:ring-2 focus:ring-primary/20">
            <div className="flex items-center gap-3 w-full">
              {showIcons && SETTINGS_TABS.find(t => t.id === activeTab)?.icon && (
                React.createElement(SETTINGS_TABS.find(t => t.id === activeTab)!.icon!, {
                  className: "h-5 w-5 text-primary shrink-0"
                })
              )}
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-foreground">
                  {activeTabLabel}
                </span>
                {showDescriptions && (
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {SETTINGS_TABS.find(t => t.id === activeTab)?.description}
                  </span>
                )}
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50 shadow-2xl z-[200]">
            {SETTINGS_TABS.map((tab) => (
              <SelectItem 
                key={tab.id} 
                value={tab.id}
                className="py-3 focus:bg-primary/5 focus:text-primary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  <div className="flex flex-col">
                    <span className="font-medium">{tab.label}</span>
                    <span className="text-[10px] text-muted-foreground">{tab.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop View: Tabs System */}
      <div className="hidden lg:block">
        <TabsSystem
          tabs={tabs}
          activeTab={activeTab || initialTab}
          onTabChange={onTabChange}
          variant={variant}
          showIcons={showIcons}
          showDescriptions={showDescriptions}
        />
      </div>
    </div>
  );
}

export { SETTINGS_TABS as settingsTabsConfig };
