"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, LayoutDashboard, ListChecks, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type DashboardSection = "dashboard" | "jobs" | "analytics";

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  jobsCount?: number;
  className?: string;
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  jobsCount,
  className,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
        description: "Your widgets & reminders",
      },
      {
        id: "jobs",
        label: "Jobs",
        icon: <ListChecks className="h-4 w-4" />,
        description:
          typeof jobsCount === "number"
            ? `${jobsCount} tracked`
            : "Track applications",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Insights & trends",
      },
    ],
    [jobsCount]
  );

  const renderNavItem = (item: NavItem) => {
    const isActive = activeSection === item.id;
    return (
      <motion.button
        key={item.id}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onSectionChange(item.id);
          setIsOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex-shrink-0",
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {item.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{item.label}</div>
          {item.description ? (
            <div
              className={cn(
                "text-xs truncate",
                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {item.description}
            </div>
          ) : null}
        </div>
      </motion.button>
    );
  };

  const sidebarContent = (
    <nav className="space-y-1">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dashboard
        </div>
        {navItems.map(renderNavItem)}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button - positioned above mobile nav */}
      <div className="lg:hidden fixed bottom-[6.5rem] right-4 z-30">
        <Button
          size="icon"
          className="rounded-full shadow-lg h-12 w-12"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-50 p-4 pt-20 overflow-y-auto"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:block w-64 flex-shrink-0", className)}>
        <div className="sticky top-[calc(var(--header-height-desktop)+1rem)]">
          <div className="bg-background/80 backdrop-blur-sm rounded-xl border border-border p-4 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
            {sidebarContent}
          </div>
        </div>
      </div>
    </>
  );
}
