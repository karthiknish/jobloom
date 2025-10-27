"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { TabsSystem, TabConfig, useTabsState } from "@/components/ui/tabs-system";
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Shield, 
  FileText, 
  Brain, 
  CreditCard, 
  UploadCloud,
  Target,
  TrendingUp,
  Bell,
  Database,
  Link,
  Edit,
  Palette,
  Briefcase,
  Sparkles,
  Eye,
  FileCheck,
  PenTool
} from "lucide-react";

// Pre-configured tabs with icons for common use cases
export const PRECONFIGURED_TABS = {
  DASHBOARD: [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: Target,
      description: "Manage job postings and applications",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Detailed insights and reports",
    },
  ] as TabConfig[],

  SETTINGS: [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Personal information and preferences",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: Settings,
      description: "App settings and customization",
    },
    {
      id: "visa-criteria",
      label: "UK Visa Criteria",
      icon: Shield,
      description: "UK visa eligibility settings",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Password and privacy settings",
    },
  ] as TabConfig[],

  CV_MANAGER: [
    {
      id: "upload",
      label: "Upload",
      icon: UploadCloud,
      description: "Upload your resume for analysis",
    },
    {
      id: "analyze",
      label: "Analyze",
      icon: Brain,
      description: "Get ATS score and improvements",
    },
    {
      id: "improve",
      label: "Improve",
      description: "AI-powered resume improvements",
    },
    {
      id: "templates",
      label: "Templates",
      icon: FileText,
      description: "Professional resume templates",
    },
  ] as TabConfig[],

  APPLICATION: [
    {
      id: "resume-maker",
      label: "AI Resume Generator",
      icon: Sparkles,
      description: "Create resumes with AI assistance",
    },
    {
      id: "advanced-resume-builder",
      label: "Advanced Resume Builder",
      icon: Edit,
      description: "Professional resume builder with ATS scoring",
    },
    {
      id: "cover-letter",
      label: "Cover Letter",
      icon: PenTool,
      description: "AI-powered cover letter generator",
    },
    {
      id: "templates",
      label: "Templates Library",
      icon: Palette,
      description: "Professional templates and examples",
    },
    {
      id: "import",
      label: "Import Resume",
      icon: UploadCloud,
      description: "Upload and edit existing resumes",
    },
  ] as TabConfig[],

  ACCOUNT: [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      description: "Account summary and status",
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      description: "Subscription and payment methods",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Link,
      description: "Connected services and extensions",
    },
    {
      id: "data",
      label: "Data & Privacy",
      icon: Database,
      description: "Data management and privacy settings",
    },
  ] as TabConfig[],
} as const;

// Hook for getting pre-configured tabs with state management
export function usePreConfiguredTabs(
  configKey: keyof typeof PRECONFIGURED_TABS,
  initialTab?: string,
  options?: {
    onTabChange?: (tabId: string) => void;
    persist?: boolean;
    storageKey?: string;
  }
) {
  return useTabsState(
    PRECONFIGURED_TABS[configKey],
    initialTab,
    {
      storageKey: `${configKey.toLowerCase()}-active-tab`,
      ...options,
    }
  );
}

// Component that wraps TabsSystem with pre-configured tabs
interface PreConfiguredTabsProps {
  configKey: keyof typeof PRECONFIGURED_TABS;
  initialTab?: string;
  onTabChange?: (tabId: string) => void;
  persist?: boolean;
  storageKey?: string;
  variant?: "default" | "pills" | "underline" | "card";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  showBadges?: boolean;
  showIcons?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export function PreConfiguredTabs({
  configKey,
  initialTab,
  onTabChange,
  persist = true,
  storageKey,
  variant = "default",
  size = "md",
  orientation = "horizontal",
  showBadges = true,
  showIcons = true,
  showDescriptions = false,
  className,
}: PreConfiguredTabsProps) {
  const { activeTab, setActiveTab, tabs } = usePreConfiguredTabs(
    configKey,
    initialTab,
    {
      onTabChange,
      persist,
      storageKey: storageKey || `${configKey.toLowerCase()}-active-tab`,
    }
  );

  return (
    <TabsSystem
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      variant={variant}
      size={size}
      orientation={orientation}
      showBadges={showBadges}
      showIcons={showIcons}
      showDescriptions={showDescriptions}
      className={className}
    />
  );
}

// Higher-order component for pages with tabs
export function withTabs<T extends object>(
  Component: React.ComponentType<T>,
  configKey: keyof typeof PRECONFIGURED_TABS,
  options?: {
    initialTab?: string;
    persist?: boolean;
    storageKey?: string;
    variant?: "default" | "pills" | "underline" | "card";
    size?: "sm" | "md" | "lg";
  }
) {
  return function WithTabsComponent(props: T) {
    const { activeTab, setActiveTab, tabs } = usePreConfiguredTabs(
      configKey,
      options?.initialTab,
      {
        persist: options?.persist,
        storageKey: options?.storageKey,
      }
    );

    return (
      <Component
        {...props}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  };
}

// Utility function to create tabs with badges (for counts)
export function createTabsWithBadges(
  baseTabs: TabConfig[],
  counts: Record<string, number>
): TabConfig[] {
  return baseTabs.map(tab => ({
    ...tab,
    badge: counts[tab.id] || undefined,
  }));
}

// Utility function to create dynamic tabs
export function createDynamicTabs(
  baseTabs: TabConfig[],
  options?: {
    disabledTabs?: string[];
    hiddenTabs?: string[];
    customBadges?: Record<string, string | number>;
  }
): TabConfig[] {
  return baseTabs
    .filter(tab => !options?.hiddenTabs?.includes(tab.id))
    .map(tab => ({
      ...tab,
      disabled: options?.disabledTabs?.includes(tab.id) || tab.disabled,
      badge: options?.customBadges?.[tab.id] || tab.badge,
    }));
}

export type { TabConfig };
export { TabsSystem, useTabsState };

// Custom tab content component that works with TabsSystem
interface CustomTabContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ value, activeTab, children, className }: CustomTabContentProps) {
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={cn("flex-1 outline-none", className)}>
      {children}
    </div>
  );
}
