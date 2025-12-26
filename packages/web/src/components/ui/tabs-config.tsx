"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Tab configuration types
export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  disabled?: boolean;
  badge?: string | number;
  variant?: "default" | "primary" | "secondary";
}

export interface TabsConfigProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "pills" | "underline" | "card";
  className?: string;
  showBadges?: boolean;
  showIcons?: boolean;
  showDescriptions?: boolean;
}

// Centralized tabs component with consistent theming
export function TabsConfig({
  tabs,
  activeTab,
  onTabChange,
  orientation = "horizontal",
  size = "md",
  variant = "default",
  className,
  showBadges = true,
  showIcons = true,
  showDescriptions = false,
}: TabsConfigProps) {
  const baseClasses = {
    horizontal: "flex flex-row",
    vertical: "flex flex-col space-y-1",
  };

  const sizeClasses = {
    sm: {
      list: orientation === "horizontal" ? "h-8" : "w-full",
      trigger: "px-3 py-1 text-xs",
    },
    md: {
      list: orientation === "horizontal" ? "h-10" : "w-full",
      trigger: "px-4 py-2 text-sm",
    },
    lg: {
      list: orientation === "horizontal" ? "h-12" : "w-full",
      trigger: "px-6 py-3 text-base",
    },
  };

  const variantClasses = {
    default: {
      list: "bg-muted/50 rounded-lg p-1",
      trigger: cn(
        "rounded-md font-medium motion-control",
        "hover:bg-background hover:shadow-sm",
        "data-[state=active]:bg-background data-[state=active]:shadow-md",
        "data-[state=active]:text-foreground data-[state=active]:border border-emerald-200",
        "data-[state=inactive]:text-muted-foreground"
      ),
      activeTrigger: "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900 shadow-sm",
    },
    pills: {
      list: "bg-transparent gap-2",
      trigger: cn(
        "rounded-full font-medium motion-control",
        "hover:bg-emerald-50 hover:text-emerald-700",
        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600",
        "data-[state=active]:text-white data-[state=active]:shadow-lg",
        "data-[state=inactive]:text-muted-foreground bg-muted/50"
      ),
      activeTrigger: "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg",
    },
    underline: {
      list: "border-b border-border bg-transparent",
      trigger: cn(
        "border-b-2 font-medium motion-control",
        "hover:text-foreground hover:border-emerald-200",
        "data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-600",
        "data-[state=inactive]:text-muted-foreground border-transparent"
      ),
      activeTrigger: "text-emerald-700 border-emerald-600",
    },
    card: {
      list: "bg-transparent gap-2",
      trigger: cn(
        "rounded-lg border font-medium motion-control",
        "hover:border-emerald-300 hover:bg-emerald-50",
        "data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50",
        "data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm",
        "data-[state=inactive]:border-border bg-background text-muted-foreground"
      ),
      activeTrigger: "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm",
    },
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(baseClasses[orientation], currentSize.list, currentVariant.list)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
                currentSize.trigger,
                currentVariant.trigger,
                isDisabled && "opacity-50 cursor-not-allowed",
                isActive && currentVariant.activeTrigger,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              data-state={isActive ? "active" : "inactive"}
            >
              {showIcons && Icon && (
                <Icon className={cn(
                  "h-4 w-4",
                  size === "sm" && "h-3 w-3",
                  size === "lg" && "h-5 w-5",
                  isActive && variant === "pills" && "text-white"
                )} />
              )}
              
              <span className="truncate">{tab.label}</span>
              
              {showBadges && tab.badge && (
                <span className={cn(
                  "inline-flex items-center justify-center rounded-full text-xs font-medium",
                  isActive && variant === "pills" 
                    ? "bg-white/20 text-white" 
                    : "bg-emerald-100 text-emerald-800",
                  size === "sm" ? "h-4 w-4 text-[10px]" : "h-5 w-5"
                )}>
                  {typeof tab.badge === "number" && tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
              
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Disabled</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {showDescriptions && (
        <div className="mt-2 text-sm text-muted-foreground">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </div>
      )}
    </div>
  );
}

// Predefined tab configurations for common use cases
export const TAB_CONFIGS = {
  // Dashboard tabs
  DASHBOARD: [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Overview and analytics",
    },
    {
      id: "jobs",
      label: "Jobs",
      description: "Manage job postings",
    },
    {
      id: "applications",
      label: "Applications",
      description: "Track your applications",
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Detailed insights",
    },
  ] as TabConfig[],

  // Settings tabs
  SETTINGS: [
    {
      id: "profile",
      label: "Profile",
      description: "Personal information and preferences",
    },
    {
      id: "preferences",
      label: "Preferences",
      description: "App settings and customization",
    },
    {
      id: "security",
      label: "Security",
      description: "Password and privacy settings",
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Email and push notification preferences",
    },
  ] as TabConfig[],

  // CV/Resume tabs
  CV: [
    {
      id: "upload",
      label: "Upload",
      description: "Upload your resume for analysis",
    },
    {
      id: "analyze",
      label: "Analyze",
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
      description: "Professional resume templates",
    },
  ] as TabConfig[],

  // Account management tabs
  ACCOUNT: [
    {
      id: "overview",
      label: "Overview",
      description: "Account summary and status",
    },
    {
      id: "billing",
      label: "Billing",
      description: "Subscription and payment methods",
    },
    {
      id: "integrations",
      label: "Integrations",
      description: "Connected services and extensions",
    },
    {
      id: "data",
      label: "Data & Privacy",
      description: "Data management and privacy settings",
    },
  ] as TabConfig[],
} as const;

// Hook for creating tabs with common patterns
export function useTabs(
  config: TabConfig[],
  initialTab?: string,
  options?: {
    onTabChange?: (tabId: string) => void;
    persist?: boolean;
    storageKey?: string;
  }
) {
  const [activeTab, setActiveTab] = React.useState(
    () => {
      // Try to get initial tab from storage if persisting
      if (options?.persist && options?.storageKey) {
        const stored = localStorage.getItem(options.storageKey);
        if (stored && config.find(tab => tab.id === stored)) {
          return stored;
        }
      }
      return initialTab || config[0]?.id || "";
    }
  );

  React.useEffect(() => {
    if (options?.persist && options?.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored && config.find(tab => tab.id === stored) && stored !== activeTab) {
        setActiveTab(stored);
      }
    }
  }, [config, options?.persist, options?.storageKey, activeTab]);

  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
    
    if (options?.persist && options?.storageKey) {
      localStorage.setItem(options.storageKey, tabId);
    }
    
    options?.onTabChange?.(tabId);
  }, [options?.persist, options?.storageKey, options?.onTabChange]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    tabs: config,
  };
}

// Higher-order component for wrapping content with tabs
export function withTabs<P extends object>(
  Component: React.ComponentType<P>,
  tabConfig: TabConfig[],
  options?: {
    defaultTab?: string;
    persist?: boolean;
    storageKey?: string;
    onTabChange?: (tabId: string) => void;
  }
) {
  return function WrappedComponent(props: P) {
    const { activeTab, setActiveTab, tabs } = useTabs(tabConfig, options?.defaultTab, {
      persist: options?.persist,
      storageKey: options?.storageKey,
      onTabChange: options?.onTabChange,
    });

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

export default TabsConfig;
