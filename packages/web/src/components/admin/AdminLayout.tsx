// components/admin/AdminLayout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  MessageSquare,
  Mail,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  Heart,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Sponsors",
    href: "/admin/sponsors",
    icon: Building2,
  },
  {
    title: "Volunteers",
    href: "/admin/volunteers",
    icon: Heart,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Contact",
    href: "/admin/contact",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: Bug,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Email Marketing",
    href: "/admin/email-marketing",
    icon: Mail,
  },
];

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useFirebaseAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const sidebarWidth = isCollapsed ? "w-[72px]" : "w-64";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-white">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform border-r border-gray-200 bg-white motion-layout lg:translate-x-0",
            sidebarWidth,
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex h-16 items-center border-b border-gray-200",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            <Link href="/admin" prefetch={false} className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                H
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Admin
                </motion.span>
              )}
            </Link>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col justify-between h-[calc(100vh-var(--header-height-mobile))]">
            {/* Navigation */}
            <nav className={cn("flex-1 py-4", isCollapsed ? "px-2" : "px-3")}>
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "group relative flex items-center rounded-lg motion-control",
                        isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-700",
                          !isCollapsed && "mr-3"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className={cn(
                            "absolute bg-primary rounded-full",
                            isCollapsed ? "left-0 top-1/2 -translate-y-1/2 w-1 h-6" : "left-0 top-1/2 -translate-y-1/2 w-1 h-6"
                          )}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </nav>

            {/* Footer Section */}
            <div className={cn("border-t border-gray-200", isCollapsed ? "px-2 py-4" : "px-3 py-4")}>
              {/* Collapse Toggle Button - Desktop only */}
              <div className="hidden lg:block mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isCollapsed ? "icon" : "sm"}
                      onClick={toggleCollapsed}
                      className={cn(
                        "text-gray-500 hover:text-gray-700",
                        isCollapsed ? "w-full justify-center" : "w-full justify-start"
                      )}
                    >
                      {isCollapsed ? (
                        <PanelLeft className="h-5 w-5" />
                      ) : (
                        <>
                          <PanelLeftClose className="h-5 w-5 mr-2" />
                          <span className="text-sm">Collapse</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      Expand sidebar
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* Main Site Link */}
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/"
                      prefetch={false}
                      className="flex items-center justify-center p-3 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors mb-4"
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Main Site
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href="/"
                  prefetch={false}
                  className="flex items-center px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors mb-4"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">Main Site</span>
                </Link>
              )}
              
              {/* User Section */}
              <div className={cn(
                "rounded-lg bg-gray-50 p-3",
                isCollapsed && "flex flex-col items-center"
              )}>
                {isCollapsed ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-9 w-9 cursor-pointer">
                          <AvatarImage src={user?.photoURL || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user?.email?.charAt(0).toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{user?.displayName || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => signOut()}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Sign Out
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.email?.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.displayName || "Admin User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn(
          "motion-layout",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}>
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={toggleMobileSidebar}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Link href="/admin" prefetch={false} className="text-gray-500 hover:text-gray-700 transition-colors">
                  Admin
                </Link>
                {pathname !== "/admin" && (
                  <>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{title}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Add global search or notifications here later */}
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 bg-white min-h-[calc(100vh-var(--header-height-mobile))]">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}