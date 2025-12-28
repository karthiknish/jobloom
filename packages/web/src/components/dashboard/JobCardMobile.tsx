"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Edit, 
  Trash2,
  ExternalLink,
  Sparkles,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { Application } from "@/types/dashboard";

interface JobCardMobileProps {
  application: Application;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
  onView: (application: Application) => void;
  className?: string;
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  interested: { color: "text-blue-600", bg: "bg-blue-100" },
  applied: { color: "text-blue-600", bg: "bg-blue-100" },
  offered: { color: "text-green-600", bg: "bg-green-100" },
  rejected: { color: "text-red-600", bg: "bg-red-100" },
  withdrawn: { color: "text-gray-600", bg: "bg-gray-100" },
};

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

/**
 * JobCardMobile - Swipeable job card for mobile
 * Swipe left to reveal delete, right to reveal edit
 * 
 * @example
 * <JobCardMobile
 *   application={app}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onView={handleView}
 * />
 */
export function JobCardMobile({
  application,
  onEdit,
  onDelete,
  onView,
  className,
}: JobCardMobileProps) {
  const [isRevealed, setIsRevealed] = useState<"left" | "right" | null>(null);
  const x = useMotionValue(0);
  
  const job = application.job;
  const status = application.status || "interested";
  const statusStyle = statusConfig[status] || statusConfig.interested;

  // Transform for action buttons opacity
  const leftActionOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0]);
  const rightActionOpacity = useTransform(x, [0, ACTION_WIDTH], [0, 1]);
  const leftActionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.8]);
  const rightActionScale = useTransform(x, [0, ACTION_WIDTH], [0.8, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swiped left - reveal delete
      setIsRevealed("left");
      triggerHaptic('light');
    } else if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swiped right - reveal edit
      setIsRevealed("right");
      triggerHaptic('light');
    } else {
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action: "edit" | "delete") => {
    triggerHaptic('medium');
    setIsRevealed(null);
    
    if (action === "edit") {
      onEdit(application);
    } else {
      onDelete(application);
    }
  };

  const handleCardClick = () => {
    if (isRevealed) {
      setIsRevealed(null);
    } else {
      triggerHaptic('light');
      onView(application);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("relative overflow-hidden rounded-xl", className)}>
          {/* Action buttons behind the card */}
          {/* Delete action (revealed on left swipe) */}
          <motion.div
            style={{ opacity: leftActionOpacity, scale: leftActionScale }}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500"
          >
            <button
              onClick={() => handleActionClick("delete")}
              className="flex flex-col items-center justify-center gap-1 text-white p-2"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-xs font-medium">Delete</span>
            </button>
          </motion.div>

          {/* Edit action (revealed on right swipe) */}
          <motion.div
            style={{ opacity: rightActionOpacity, scale: rightActionScale }}
            className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-primary"
          >
            <button
              onClick={() => handleActionClick("edit")}
              className="flex flex-col items-center justify-center gap-1 text-white p-2"
            >
              <Edit className="h-5 w-5" />
              <span className="text-xs font-medium">Edit</span>
            </button>
          </motion.div>

          {/* Main card content */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={{
              x: isRevealed === "left" ? -ACTION_WIDTH : isRevealed === "right" ? ACTION_WIDTH : 0,
            }}
            style={{ x }}
            onClick={handleCardClick}
            className={cn(
              "relative bg-card border rounded-xl p-4 space-y-3",
              "active:bg-muted/50 transition-colors cursor-pointer",
              "touch-pan-y" // Allow vertical scroll while enabling horizontal drag
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {job?.title || "Untitled Position"}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job?.company || "Unknown Company"}</span>
                </div>
              </div>
              
              {/* Status badge */}
              <Badge 
                variant="secondary"
                className={cn(
                  "shrink-0 text-xs capitalize",
                  statusStyle.bg,
                  statusStyle.color
                )}
              >
                {status}
              </Badge>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5">
              {job?.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{job.location}</span>
                </div>
              )}
              {job?.isSponsored && (
                <Badge variant="orange" className="text-xs gap-1 py-0">
                  <Sparkles className="h-2.5 w-2.5" />
                  Sponsor
                </Badge>
              )}
              {job?.remoteWork && (
                <Badge variant="teal" className="text-xs gap-1 py-0">
                  <Globe className="h-2.5 w-2.5" />
                  Remote
                </Badge>
              )}
            </div>

            {/* Swipe hint indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-8 h-1 rounded-full bg-muted-foreground/20" />
          </motion.div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onView(application)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(application)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={() => onDelete(application)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default JobCardMobile;
