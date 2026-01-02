"use client";

import { useMemo } from "react";
import { MessageSquare, BarChart3, LayoutDashboard, ListChecks, ChevronRight, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardSection = "dashboard" | "jobs" | "analytics" | "feedback" | "extension";

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: Exclude<DashboardSection, "extension">) => void;
  jobsCount?: number;
  className?: string;
}

function DashboardSidebarContent({
  activeSection,
  onSectionChange,
  jobsCount,
}: Omit<DashboardSidebarProps, "className">) {
  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        description: "Your widgets & reminders",
      },
      {
        id: "jobs",
        label: "Jobs",
        icon: ListChecks,
        description:
          typeof jobsCount === "number"
            ? `${jobsCount} tracked`
            : "Track applications",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Insights & trends",
      },
      {
        id: "feedback",
        label: "Feedback",
        icon: MessageSquare,
        description: "AI learning history",
      },
      {
        id: "extension",
        label: "Extension",
        icon: Chrome,
        description: "Browser integration",
      },
    ],
    [jobsCount]
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Manage your job search</p>
          </div>
        </div>
      </div>

      <nav aria-label="Dashboard Navigation" className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const countBadge =
              item.id === "jobs" && typeof jobsCount === "number" ? jobsCount : undefined;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.id === "extension") {
                      window.open("/extension/connect", "_blank", "noopener,noreferrer");
                      return;
                    }
                    onSectionChange(item.id);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none ring-offset-background transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/90 hover:bg-muted/60"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", isActive ? "font-semibold" : "font-medium")}>
                        {item.label}
                      </span>

                      {typeof countBadge === "number" && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {countBadge}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>

                  {isActive && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  jobsCount,
  className,
}: DashboardSidebarProps) {
  return (
    <aside
      className={cn("hidden lg:block w-72 shrink-0", className)}
      role="complementary"
      aria-label="Dashboard Sidebar"
      data-tour="nav-tabs"
    >
      <div className="sticky top-[calc(var(--header-height-desktop)+1rem)]">
        <div className="h-[calc(100vh-var(--header-height-desktop)-2rem)] overflow-auto pr-1">
          <DashboardSidebarContent
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            jobsCount={jobsCount}
          />
        </div>
      </div>
    </aside>
  );
}
