"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  /** Side for mobile sheet: 'bottom' | 'right' */
  mobileSide?: "bottom" | "right";
  /** Max width for desktop dialog */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

/**
 * ResponsiveModal - Uses Sheet on mobile, Dialog on desktop
 * 
 * @example
 * <ResponsiveModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Item"
 *   description="Update the item details"
 * >
 *   <form>...</form>
 * </ResponsiveModal>
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  className,
  mobileSide = "bottom",
  maxWidth = "lg",
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Desktop: Use Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden ${className}`}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          <ScrollArea className="flex-1 overflow-y-auto max-h-[70vh]">
            {children}
          </ScrollArea>
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Sheet (bottom drawer)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={mobileSide} 
        className={`max-h-[90vh] ${mobileSide === "bottom" ? "h-auto rounded-t-2xl" : ""} ${className}`}
      >
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <ScrollArea className="flex-1 overflow-y-auto my-4">
          {children}
        </ScrollArea>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

export default ResponsiveModal;
