"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type KanbanStatus =
  | "interested"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  dateFound?: string | number;
}

export interface Application {
  _id: string;
  jobId: string;
  userId: string;
  status: KanbanStatus | string;
  notes?: string;
  job?: Job;
  order?: number;
}

export function KanbanBoard({
  applications,
  onChangeStatus,
  onReorder,
  onView,
}: {
  applications: Application[];
  onChangeStatus: (id: string, status: KanbanStatus) => Promise<void> | void;
  onReorder?: (
    draggedId: string,
    targetStatus: KanbanStatus,
    beforeId: string | null
  ) => Promise<void> | void;
  onView?: (application: Application) => void;
}) {
  const columns: KanbanStatus[] = [
    "interested",
    "applied",
    "interviewing",
    "offered",
    "rejected",
    "withdrawn",
  ];

  const [draggedId, setDraggedId] = React.useState<string | null>(null);

  const byCol: Record<KanbanStatus, Application[]> = React.useMemo(() => {
    const map: Record<KanbanStatus, Application[]> = {
      interested: [],
      applied: [],
      interviewing: [],
      offered: [],
      rejected: [],
      withdrawn: [],
    };
    for (const a of applications) {
      const s = (a.status as KanbanStatus) || "interested";
      if (map[s]) map[s].push(a);
    }
    // Sort each column by order asc, fallback to job title
    (Object.keys(map) as KanbanStatus[]).forEach((k) => {
      map[k].sort((a, b) => {
        const ao = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return (a.job?.title || "").localeCompare(b.job?.title || "");
      });
    });
    return map;
  }, [applications]);

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (status: KanbanStatus) => async (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;
    if (onReorder) await onReorder(id, status, null);
    else await onChangeStatus(id, status);
    setDraggedId(null);
  };

  const onDropBefore = (
    status: KanbanStatus,
    beforeId: string | null
  ) =>
    async (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id) return;
      if (onReorder) await onReorder(id, status, beforeId);
      else await onChangeStatus(id, status);
      setDraggedId(null);
    };

  // ...existing code...
  const statusBadge: Record<KanbanStatus, React.ReactNode> = {
    interested: <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Interested</Badge>,
    applied: <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Applied</Badge>,
    interviewing: <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200">Interviewing</Badge>,
    offered: <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Offered</Badge>,
    rejected: <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200">Rejected</Badge>,
    withdrawn: <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Withdrawn</Badge>,
  } as const;

  const statusTooltips: Record<KanbanStatus, string> = {
    interested: "Jobs you're considering applying to",
    applied: "Applications you've submitted",
    interviewing: "Actively interviewing with the company",
    offered: "You've received an offer!",
    rejected: "Applications that weren't successful",
    withdrawn: "Applications you chose to withdraw",
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4 min-w-max pb-2">
      {columns.map((col) => (
        <div key={col} className="w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-xl border border-border/50 max-h-[calc(100vh-220px)]">
          <TooltipProvider>
            <div className="p-3 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <span className="font-semibold text-sm capitalize text-foreground/80">{col}</span>
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                      {byCol[col].length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusTooltips[col]}</p>
                </TooltipContent>
              </Tooltip>
              <div className="scale-90 origin-right">
                {statusBadge[col]}
              </div>
            </div>
          </TooltipProvider>
          
          <div
            onDragOver={onDragOver}
            onDrop={onDrop(col)}
            className="flex-1 p-2 overflow-y-auto custom-scrollbar"
          >
            <ul className="space-y-2 min-h-[100px]">
              {/* Top drop zone */}
              <li
                onDragOver={onDragOver}
                onDrop={onDropBefore(col, byCol[col][0]?._id ?? null)}
                className="h-1"
              />
              {byCol[col].map((a, idx) => (
                <React.Fragment key={a._id}>
                  <li
                    draggable
                    onDragStart={onDragStart(a._id)}
                    className={`
                      group relative rounded-lg bg-card border border-border/60 p-3 shadow-sm 
                      hover:shadow-md hover:border-primary/30 motion-surface cursor-grab active:cursor-grabbing
                      ${draggedId === a._id ? 'opacity-50 ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    <div className="font-medium text-sm text-foreground mb-1 line-clamp-2 leading-tight">
                      {a.job?.title}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1 truncate">
                      <span className="font-medium text-foreground/70">{a.job?.company}</span>
                      {a.job?.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{a.job?.location}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(a.job?.dateFound || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      {onView && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(a);
                          }}
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </li>
                  {/* Drop zone below each item */}
                  <li
                    onDragOver={onDragOver}
                    onDrop={onDropBefore(
                      col,
                      byCol[col][idx + 1]?._id ?? null
                    )}
                    className="h-1"
                  />
                </React.Fragment>
              ))}
              {byCol[col].length === 0 && (
                <div className="h-24 border-2 border-dashed border-border/40 rounded-lg flex items-center justify-center text-muted-foreground/40 text-xs">
                  Drop here
                </div>
              )}
            </ul>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
