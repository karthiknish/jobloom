"use client";

import React, { useState, useEffect, useCallback } from "react";
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

export interface TabsSystemProps {
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

// Hook for managing tabs state
export function useTabsState(
  config: TabConfig[],
  initialTab?: string,
  options?: {
    onTabChange?: (tabId: string) => void;
    persist?: boolean;
    storageKey?: string;
  }
) {
  const [activeTab, setActiveTab] = useState(() => {
    // Try to get initial tab from storage if persisting
    if (options?.persist && options?.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored && config.find(tab => tab.id === stored)) {
        return stored;
      }
    }
    return initialTab || config[0]?.id || "";
  });

  useEffect(() => {
    if (options?.persist && options?.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored && config.find(tab => tab.id === stored) && stored !== activeTab) {
        setActiveTab(stored);
      }
    }
  }, [config, options?.persist, options?.storageKey, activeTab]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    
    if (options?.persist && options?.storageKey) {
      localStorage.setItem(options.storageKey, tabId);
    }
    
    options?.onTabChange?.(tabId);
  }, [setActiveTab, options?.persist, options?.storageKey, options?.onTabChange]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    tabs: config,
  };
}

// Centralized tabs component with consistent theming
export function TabsSystem({
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
}: TabsSystemProps) {
  const baseClasses = {
    horizontal: "flex flex-row w-full",
    vertical: "flex flex-col space-y-1 w-full",
  };

  const sizeClasses = {
    sm: {
      list: orientation === "horizontal" ? "h-8 w-full" : "w-full",
      trigger: "px-3 py-1 text-xs flex-1",
    },
    md: {
      list: orientation === "horizontal" ? "h-10 w-full" : "w-full",
      trigger: "px-4 py-2 text-sm flex-1",
    },
    lg: {
      list: orientation === "horizontal" ? "h-12 w-full" : "w-full",
      trigger: "px-6 py-3 text-base flex-1",
    },
  };

  const variantClasses = {
    default: {
      list: "bg-muted/50 rounded-lg p-1 flex",
      trigger: cn(
        "rounded-md font-medium motion-control flex items-center justify-center flex-1",
        "hover:bg-background hover:shadow-sm",
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
        "data-[state=inactive]:text-muted-foreground"
      ),
      activeTrigger: "bg-primary text-primary-foreground shadow-md",
    },
    pills: {
      list: "bg-transparent gap-2",
      trigger: cn(
        "rounded-full font-medium motion-control",
        "hover:bg-primary/10 hover:text-primary",
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
        "data-[state=inactive]:text-muted-foreground bg-muted/50"
      ),
      activeTrigger: "bg-primary text-primary-foreground shadow-lg",
    },
    underline: {
      list: "border-b border-border bg-transparent",
      trigger: cn(
        "border-b-2 font-medium motion-control",
        "hover:text-foreground hover:border-primary/50",
        "data-[state=active]:text-primary data-[state=active]:border-primary",
        "data-[state=inactive]:text-muted-foreground border-transparent"
      ),
      activeTrigger: "text-primary border-primary",
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

  const gridCols = orientation === "horizontal" ? `grid-cols-${tabs.length}` : undefined;

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(baseClasses[orientation], currentSize.list, currentVariant.list, gridCols)}>
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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

export default TabsSystem;
