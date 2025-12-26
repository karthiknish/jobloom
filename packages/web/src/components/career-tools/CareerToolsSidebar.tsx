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
} from "lucide-react";

export type CareerToolsSection = 
  | "ai-generator"
  | "manual-builder" 
  | "import"
  | "analyze"
  | "history"
  | "cover-letter";

interface NavItem {
  id: CareerToolsSection;
  label: string;
  icon: React.ReactNode;
  description?: string;
  group?: string;
}

const navItems: NavItem[] = [
  // Build group
  { id: "ai-generator", label: "AI Generator", icon: <Sparkles className="h-4 w-4" />, group: "Build", description: "Create resume with AI" },
  { id: "manual-builder", label: "Manual Builder", icon: <PenLine className="h-4 w-4" />, group: "Build", description: "Build step by step" },
  { id: "import", label: "Import Resume", icon: <Upload className="h-4 w-4" />, group: "Build", description: "Import from file" },
  // Analyze group
  { id: "analyze", label: "Analyze CV", icon: <Search className="h-4 w-4" />, description: "Get ATS score & feedback" },
  { id: "history", label: "History", icon: <History className="h-4 w-4" />, description: "View past analyses" },
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

  // Group items by their group property
  const buildItems = navItems.filter(item => item.group === "Build");
  const otherItems = navItems.filter(item => !item.group);

  const renderNavItem = (item: NavItem, isSubItem = false) => {
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
          isSubItem && "pl-8",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          isSubItem && !isActive && "text-muted-foreground/90"
        )}
      >
        <span className={cn(
          "flex-shrink-0",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          {item.icon}
        </span>
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
        {isActive && (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
      </motion.button>
    );
  };

  const sidebarContent = (
    <nav className="space-y-1">
      {/* Build Section with sub-items */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Build Resume
        </div>
        {buildItems.map(item => renderNavItem(item, true))}
      </div>

      <div className="my-4 border-t border-border" />

      {/* Other items */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tools
        </div>
        {otherItems.map(item => renderNavItem(item))}
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
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:block w-64 flex-shrink-0",
        className
      )}>
        <div className="sticky top-24">
          <div className="bg-background/80 backdrop-blur-sm rounded-xl border border-border p-4 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
            {sidebarContent}
          </div>
        </div>
      </div>
    </>
  );
}
