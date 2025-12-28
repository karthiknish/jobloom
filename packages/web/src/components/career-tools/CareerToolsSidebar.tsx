"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PenLine,
  Upload,
  Search,
  History,
  FileText,
  ChevronRight,
  Menu,
  X,
  BarChart3,
} from "lucide-react";

export type CareerToolsSection = 
  | "dashboard"
  | "ai-generator"
  | "manual-builder" 
  | "import"
  | "cv-optimizer"
  | "cover-letter";

interface NavItem {
  id: CareerToolsSection;
  label: string;
  icon: React.ReactNode;
  description?: string;
  group?: string;
}

const navItems: NavItem[] = [
  // Dashboard
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" />, description: "Stats & Insights" },
  // Build group
  { id: "ai-generator", label: "AI Generator", icon: <Sparkles className="h-4 w-4" />, group: "Build", description: "Create resume with AI" },
  { id: "manual-builder", label: "Manual Builder", icon: <PenLine className="h-4 w-4" />, group: "Build", description: "Build step by step" },
  { id: "import", label: "Import Resume", icon: <Upload className="h-4 w-4" />, group: "Build", description: "Import from file" },
  // Analyze group
  { id: "cv-optimizer", label: "Resume Optimizer", icon: <Search className="h-4 w-4" />, description: "ATS score & history" },
  // Cover Letter
  { id: "cover-letter", label: "Cover Letter", icon: <FileText className="h-4 w-4" />, description: "AI-powered letters" },
];

interface CareerToolsSidebarProps {
  activeSection: CareerToolsSection;
  onSectionChange: (section: CareerToolsSection) => void;
  className?: string;
}

export function CareerToolsSidebar({ 
  activeSection, 
  onSectionChange,
  className 
}: CareerToolsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<CareerToolsSection | null>(null);

  // Group items by their group property
  const buildItems = navItems.filter(item => item.group === "Build");
  const otherItems = navItems.filter(item => !item.group);

  const renderNavItem = (item: NavItem, isSubItem = false, isDesktop = false) => {
    const isActive = activeSection === item.id;
    const isHovered = hoveredItem === item.id;
    
    return (
      <div 
        key={item.id}
        className="relative"
        onMouseEnter={() => isDesktop && setHoveredItem(item.id)}
        onMouseLeave={() => isDesktop && setHoveredItem(null)}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onSectionChange(item.id);
            setIsOpen(false);
          }}
          className={cn(
            "flex items-center rounded-xl transition-all duration-200",
            isDesktop 
              ? "w-10 h-10 justify-center mx-auto" 
              : "w-full gap-3 px-3 py-2.5 text-left",
            isActive 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isDesktop && isActive && "ring-2 ring-primary/20"
          )}
        >
          <span className={cn(
            "flex-shrink-0",
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {item.icon}
          </span>
          
          {!isDesktop && (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.label}</div>
              {item.description && !isSubItem && (
                <div className={cn(
                  "text-xs truncate",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {item.description}
                </div>
              )}
            </div>
          )}
          
          {!isDesktop && isActive && (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
        </motion.button>

        {/* Desktop Hover Tooltip/Card */}
        {isDesktop && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full ml-3 top-0 z-50"
              >
                <div className="bg-popover text-popover-foreground border border-border shadow-xl rounded-xl p-3 w-48 backdrop-blur-md">
                  <div className="font-bold text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div>
                  )}
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                      <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                      Active Section
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  const sidebarContent = (isDesktop = false) => (
    <nav className={cn("space-y-6", isDesktop ? "flex flex-col items-center" : "space-y-1")}>
      {/* Build Section */}
      <div className={cn("space-y-2", isDesktop && "w-full")}>
        {!isDesktop && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Build Resume
          </div>
        )}
        <div className={cn("space-y-1", isDesktop && "flex flex-col items-center gap-2")}>
          {buildItems.map(item => renderNavItem(item, !isDesktop, isDesktop))}
        </div>
      </div>

      {isDesktop ? (
        <div className="w-8 h-[1px] bg-border/50" />
      ) : (
        <div className="my-4 border-t border-border" />
      )}

      {/* Other items */}
      <div className={cn("space-y-2", isDesktop && "w-full")}>
        {!isDesktop && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tools
          </div>
        )}
        <div className={cn("space-y-1", isDesktop && "flex flex-col items-center gap-2")}>
          {otherItems.map(item => renderNavItem(item, false, isDesktop))}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden fixed bottom-[6.5rem] right-4 z-30">
        <Button
          size="icon"
          className="rounded-full shadow-lg h-12 w-12"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
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
              {sidebarContent(false)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - Icon Bar */}
      <div className={cn(
        "hidden lg:block w-16 flex-shrink-0 transition-all duration-300 relative z-[100]",
        className
      )}>
        <div className="sticky top-24">
          <div className="bg-background/40 backdrop-blur-md rounded-2xl border border-border/50 p-3 shadow-sm flex flex-col items-center gap-4">
            {sidebarContent(true)}
          </div>
        </div>
      </div>
    </>
  );
}
