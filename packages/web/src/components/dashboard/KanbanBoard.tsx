"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Loader2, Move, DownloadCloud, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { 
  Job, 
  Application, 
  KanbanStatus 
} from "@/types/dashboard";

export type { Job, Application, KanbanStatus };

export function KanbanBoard({
  applications,
  onChangeStatus,
  onReorder,
  onView,
  isSaving = false,
  savingApplicationId,
  resizable = true,
}: {
  applications: Application[];
  onChangeStatus: (id: string, status: KanbanStatus) => Promise<void> | void;
  onReorder?: (
    draggedId: string,
    targetStatus: KanbanStatus,
    beforeId: string | null
  ) => Promise<void> | void;
  onView?: (application: Application) => void;
  isSaving?: boolean;
  savingApplicationId?: string | null;
  resizable?: boolean;
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
  const [activeDrop, setActiveDrop] = React.useState<
    { status: KanbanStatus; beforeId: string | null } | null
  >(null);

  // Check if we're on desktop for resizable panels
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const byCol: Record<KanbanStatus, Application[]> = React.useMemo(() => {
    const map: Record<KanbanStatus, Application[]> = {
      interested: [],
      applied: [],
      interviewing: [],
      offered: [],
      rejected: [],
      withdrawn: [],
    } as Record<KanbanStatus, Application[]>;
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
    if (isSaving) return;
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (isSaving) return;
    e.preventDefault();
  };

  const onDrop = (status: KanbanStatus) => async (e: React.DragEvent) => {
    if (isSaving) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;
    if (onReorder) await onReorder(id, status, null);
    else await onChangeStatus(id, status);
    setDraggedId(null);
    setActiveDrop(null);
  };

  const onDropBefore = (
    status: KanbanStatus,
    beforeId: string | null
  ) =>
    async (e: React.DragEvent) => {
      if (isSaving) return;
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id) return;
      if (onReorder) await onReorder(id, status, beforeId);
      else await onChangeStatus(id, status);
      setDraggedId(null);
      setActiveDrop(null);
    };

  const statusBadge: Record<KanbanStatus, React.ReactNode> = {
    interested: <ApplicationStatusBadge status="interested" />,
    applied: <ApplicationStatusBadge status="applied" />,
    interviewing: <ApplicationStatusBadge status="interviewing" />,
    offered: <ApplicationStatusBadge status="offered" />,
    rejected: <ApplicationStatusBadge status="rejected" />,
    withdrawn: <ApplicationStatusBadge status="withdrawn" />,
  } as const;

  const statusTooltips: Record<KanbanStatus, string> = {
    interested: "Jobs you're considering applying to",
    applied: "Applications you've submitted",
    interviewing: "You've been invited for an interview!",
    offered: "You've received an offer!",
    rejected: "Applications that weren't successful",
    withdrawn: "Applications you chose to withdraw",
  };

  const renderColumn = (col: KanbanStatus) => (
    <div className="w-full min-w-0 flex flex-col bg-muted/30 rounded-xl border border-border/50 h-full">
      <TooltipProvider>
        <div className="p-3 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help min-w-0">
                <span className="font-semibold text-sm capitalize text-foreground/80 truncate">{col}</span>
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {byCol[col].length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusTooltips[col]}</p>
            </TooltipContent>
          </Tooltip>
          <div className="scale-90 origin-right flex-shrink-0">
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
            onDragEnter={() => setActiveDrop({ status: col, beforeId: byCol[col][0]?._id ?? null })}
            className={
              draggedId
                ? "h-3 rounded-md transition-colors " +
                  (activeDrop?.status === col && activeDrop?.beforeId === (byCol[col][0]?._id ?? null)
                    ? "bg-primary/30"
                    : "bg-transparent")
                : "h-1"
            }
          />
          {byCol[col].map((a, idx) => (
            <React.Fragment key={a._id}>
              <li
                draggable={!isSaving && savingApplicationId !== a._id}
                onDragStart={onDragStart(a._id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setActiveDrop(null);
                }}
                className={`
                  group relative rounded-lg bg-card border border-border/60 p-3 shadow-sm min-w-0
                  hover:shadow-md hover:border-primary/30 motion-surface cursor-grab active:cursor-grabbing transition-all
                  ${draggedId === a._id ? 'opacity-50 ring-2 ring-primary ring-offset-2' : ''}
                  ${savingApplicationId === a._id ? 'animate-pulse border-primary/40 pointer-events-none ring-1 ring-primary/20' : ''}
                `}
              >
                {/* Saving Overlay */}
                {savingApplicationId === a._id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xxs font-bold text-primary uppercase tracking-wider">Saving</span>
                    </div>
                  </div>
                )}

                <div className="font-medium text-sm text-foreground mb-1 line-clamp-2 leading-tight break-words">
                  {a.job?.title}
                </div>
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1 min-w-0">
                  <span className="font-medium text-foreground/70 truncate">{a.job?.company}</span>
                  {a.job?.location && (
                    <>
                      <span className="flex-shrink-0">•</span>
                      <span className="truncate">{a.job?.location}</span>
                    </>
                  )}
                </div>

                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <div className="text-xxs text-muted-foreground">
                    {new Date(a.job?.dateFound || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  {onView && (
                    <Button 
                      type="button"
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      disabled={savingApplicationId === a._id}
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
                onDragEnter={() => setActiveDrop({ status: col, beforeId: byCol[col][idx + 1]?._id ?? null })}
                className={
                  draggedId
                    ? "h-3 rounded-md transition-colors " +
                      (activeDrop?.status === col && activeDrop?.beforeId === (byCol[col][idx + 1]?._id ?? null)
                        ? "bg-primary/30"
                        : "bg-transparent")
                    : "h-1"
                }
              />
            </React.Fragment>
          ))}
          {byCol[col].length === 0 && (
            <div
              onDragOver={onDragOver}
              onDrop={onDrop(col)}
              onDragEnter={() => setActiveDrop({ status: col, beforeId: null })}
              className={cn(
                "h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-xs transition-all duration-200",
                draggedId
                  ? activeDrop?.status === col
                    ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm"
                    : "border-primary/30 bg-primary/5 text-primary/70"
                  : "border-border/40 bg-background/40 text-muted-foreground/60"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "p-2 rounded-full mb-1 transition-colors",
                  draggedId && activeDrop?.status === col ? "bg-primary/20" : "bg-muted/50"
                )}>
                  {draggedId ? (
                    <DownloadCloud className={cn("h-5 w-5", activeDrop?.status === col ? "text-primary" : "text-primary/60")} />
                  ) : (
                    <Move className="h-5 w-5 opacity-40" />
                  )}
                </div>
                <span className="font-semibold px-4 text-center">
                  {draggedId 
                    ? activeDrop?.status === col ? "Release to drop" : "Drop here to move"
                    : `No ${col} applications`}
                </span>
                <span className="text-xxs text-muted-foreground/70 px-4 text-center">
                  {draggedId 
                    ? "We'll update the status automatically" 
                    : "Drag cards here to update status"}
                </span>
              </div>
            </div>
          )}
        </ul>
      </div>
    </div>
  );

  // Resizable layout for desktop
  if (resizable && isDesktop) {
    return (
      <div className="pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative">
          {isSaving && (
            <div className="absolute inset-0 z-20 rounded-xl bg-background/40 backdrop-blur-[1px] flex items-start justify-end p-3 pointer-events-none">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving changes…
              </div>
            </div>
          )}

          <ResizablePanelGroup
            orientation="horizontal"
            className="gap-0 max-h-[calc(100vh-var(--header-height-desktop)-var(--dashboard-header-height)-var(--dashboard-tabs-height)-2rem)]"
          >
            {columns.map((col, idx) => (
              <React.Fragment key={col}>
                <ResizablePanel
                  defaultSize={20}
                  minSize={12}
                  className="min-w-0"
                >
                  {renderColumn(col)}
                </ResizablePanel>
                {idx < columns.length - 1 && (
                  <ResizableHandle withHandle className="mx-1 bg-transparent hover:bg-primary/20 transition-colors" />
                )}
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }

  // Grid layout for mobile/tablets or when resizable is disabled
  return (
    <div className="pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="relative">
        {isSaving && (
          <div className="absolute inset-0 z-20 rounded-xl bg-background/40 backdrop-blur-[1px] flex items-start justify-end p-3 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving changes…
            </div>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 pb-2">
          {columns.map((col) => (
            <div key={col} className="max-h-[calc(100vh-var(--header-height-desktop)-var(--dashboard-header-height)-var(--dashboard-tabs-height)-2rem)]">
              {renderColumn(col)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
