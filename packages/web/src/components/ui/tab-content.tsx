"use client";

import React, { useState, useEffect } from "react";
import { usePreConfiguredTabs } from "@/lib/tabs-utils";

interface TabContentProps {
  configKey: keyof typeof import("@/lib/tabs-utils").PRECONFIGURED_TABS;
  initialTab?: string;
  children: React.ReactNode;
  renderContent: (activeTab: string) => React.ReactNode;
  persist?: boolean;
  storageKey?: string;
  className?: string;
}

export function TabContent({
  configKey,
  initialTab,
  children,
  renderContent,
  persist = true,
  storageKey,
  className,
}: TabContentProps) {
  const { activeTab } = usePreConfiguredTabs(
    configKey,
    initialTab,
    {
      persist,
      storageKey,
    }
  );

  return (
    <div className={className}>
      {renderContent(activeTab)}
    </div>
  );
}

// Hook for managing tab content
export function useTabContent(
  configKey: keyof typeof import("@/lib/tabs-utils").PRECONFIGURED_TABS,
  initialTab?: string,
  options?: {
    persist?: boolean;
    storageKey?: string;
    onTabChange?: (tabId: string) => void;
  }
) {
  return usePreConfiguredTabs(configKey, initialTab, options);
}

export default TabContent;
