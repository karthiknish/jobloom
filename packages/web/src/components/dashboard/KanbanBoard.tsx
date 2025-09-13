"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const statusBadge: Record<KanbanStatus, React.ReactNode> = {
    interested: <Badge>Interested</Badge>,
    applied: <Badge variant="yellow">Applied</Badge>,
    interviewing: <Badge variant="purple">Interviewing</Badge>,
    offered: <Badge variant="green">Offered</Badge>,
    rejected: <Badge variant="destructive">Rejected</Badge>,
    withdrawn: <Badge variant="secondary">Withdrawn</Badge>,
  } as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {columns.map((col) => (
        <Card key={col} className="min-h-[320px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="capitalize">{col}</CardTitle>
            {statusBadge[col]}
          </CardHeader>
          <CardContent>
            <div
              onDragOver={onDragOver}
              onDrop={onDrop(col)}
              className="min-h-[240px] rounded-md border border-dashed border-border p-2 bg-muted/30"
            >
              <ul className="space-y-2">
                {/* Top drop zone */}
                <li
                  onDragOver={onDragOver}
                  onDrop={onDropBefore(col, byCol[col][0]?._id ?? null)}
                  className="h-3"
                />
                {byCol[col].map((a, idx) => (
                  <React.Fragment key={a._id}>
                    <li
                      draggable
                      onDragStart={onDragStart(a._id)}
                      className="rounded-md bg-card text-card-foreground border p-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="text-sm font-medium truncate">{a.job?.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.job?.company} • {a.job?.location}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onChangeStatus(a._id, col)}
                        >
                          Move here
                        </Button>
                        {onView && (
                          <Button size="sm" variant="ghost" onClick={() => onView(a)}>
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
                      className="h-3"
                    />
                  </React.Fragment>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
