"use client";

import { useMemo } from "react";
import { MessageSquare, BarChart3, LayoutDashboard, ListChecks, ChevronRight, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export type DashboardSection = "dashboard" | "jobs" | "analytics" | "feedback" | "extension";

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  jobsCount?: number;
  className?: string;
}

function DashboardSidebarContent({
  activeSection,
  onSectionChange,
  jobsCount,
}: Omit<DashboardSidebarProps, "className">) {
  const { setOpenMobile } = useSidebar();

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
    <>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Manage your job search</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (item.id === "extension") {
                          window.open("/extension/connect", "_blank");
                        } else {
                          onSectionChange(item.id);
                        }
                        setOpenMobile(false);
                      }}
                      tooltip={item.label}
                      className="group"
                    >
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </>
  );
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  jobsCount,
  className,
}: DashboardSidebarProps) {
  return (
    <div className={cn("hidden lg:block", className)}>
      <SidebarProvider defaultOpen={true}>
        <Sidebar 
          variant="floating" 
          collapsible="icon"
          className="top-[calc(var(--header-height-desktop)+1rem)] h-[calc(100vh-var(--header-height-desktop)-2rem)]"
          role="navigation"
          aria-label="Dashboard Navigation"
        >
          <DashboardSidebarContent
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            jobsCount={jobsCount}
          />
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
