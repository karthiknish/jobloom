"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface MobileFABProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Show expanded label on FAB */
  expanded?: boolean;
}

/**
 * MobileFAB - Floating Action Button for mobile
 * Fixed position above bottom navigation
 * 
 * @example
 * <MobileFAB onClick={() => setShowJobForm(true)} label="Add Job" />
 */
export function MobileFAB({
  onClick,
  label = "Add",
  icon,
  className,
  expanded = false,
}: MobileFABProps) {
  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        "fixed z-50 md:hidden",
        "bottom-[calc(var(--mobile-nav-height,64px)+env(safe-area-inset-bottom,0px)+16px)]",
        "right-4",
        "flex items-center justify-center gap-2",
        "min-h-[56px] min-w-[56px]",
        expanded ? "px-5 rounded-full" : "rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/25",
        "active:scale-95 transition-transform",
        className
      )}
      aria-label={label}
    >
      {icon || <Plus className="h-6 w-6" />}
      {expanded && (
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          className="font-semibold text-sm whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}

export default MobileFAB;
