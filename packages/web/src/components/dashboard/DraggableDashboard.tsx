"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  visible: boolean;
  required?: boolean; // Some widgets might be required
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  onLayoutChange: (layout: string[]) => void;
  savedLayout?: string[];
  className?: string;
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  onToggleVisibility: (id: string) => void;
  customizing: boolean;
  onRequestCustomize: () => void;
}

function SortableWidget({ widget, onToggleVisibility, customizing, onRequestCustomize }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`${
        isDragging
          ? 'shadow-overlay scale-105 border-primary/50'
          : 'shadow-soft shadow-hover-strong'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted/50 active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Reorder widget"
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg font-semibold">
                {widget.title}
              </CardTitle>
            </div>
            {!widget.required && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!customizing) {
                    onRequestCustomize();
                    return;
                  }
                  onToggleVisibility(widget.id);
                }}
                className="h-8 w-8 p-0 hover:bg-muted/50"
                aria-label={customizing ? "Hide widget" : "Customize dashboard"}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {widget.component}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function normalizeLayout(widgetIds: string[], widgets: DashboardWidget[]) {
  const allowed = new Set(widgets.map((w) => w.id));
  const requiredIds = widgets.filter((w) => w.required).map((w) => w.id);

  const next: string[] = [];
  for (const id of widgetIds) {
    if (!allowed.has(id)) continue;
    if (next.includes(id)) continue;
    next.push(id);
  }

  for (const id of requiredIds) {
    if (!next.includes(id)) next.unshift(id);
  }

  return next;
}

function getDefaultVisibleIds(widgets: DashboardWidget[]) {
  return widgets.filter((w) => w.visible || w.required).map((w) => w.id);
}

export function DraggableDashboard({
  widgets,
  onLayoutChange,
  savedLayout,
  className = ""
}: DraggableDashboardProps) {
  const defaultVisibleIds = getDefaultVisibleIds(widgets);
  const defaultLayout = normalizeLayout(defaultVisibleIds, widgets);

  const [layout, setLayout] = useState<string[]>(
    normalizeLayout(savedLayout ?? defaultLayout, widgets)
  );
  const [customizing, setCustomizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update layout when savedLayout changes
  useEffect(() => {
    if (savedLayout) {
      setLayout(normalizeLayout(savedLayout, widgets));
    }
  }, [savedLayout, widgets]);

  // One-time migration: older saved layouts only stored ordering and may omit
  // newer default widgets (e.g. Job Statistics). We append default-visible
  // widgets once, then persist the updated layout.
  useEffect(() => {
    if (!savedLayout) return;
    if (typeof window === "undefined") return;

    const MIGRATION_KEY = "hireall:dashboardLayout:migrated_v2";
    const alreadyMigrated = window.localStorage.getItem(MIGRATION_KEY) === "1";
    if (alreadyMigrated) return;

    const merged = normalizeLayout(
      [...savedLayout, ...defaultVisibleIds],
      widgets
    );

    if (merged.join("|") !== normalizeLayout(savedLayout, widgets).join("|")) {
      setLayout(merged);
      onLayoutChange(merged);
    }

    window.localStorage.setItem(MIGRATION_KEY, "1");
  }, [savedLayout, widgets, defaultVisibleIds, onLayoutChange]);

  // Filter and sort widgets based on current layout
  const visibleWidgets = widgets
    .filter((widget) => layout.includes(widget.id))
    .sort((a, b) => layout.indexOf(a.id) - layout.indexOf(b.id));

  const optionalWidgets = widgets.filter((w) => !w.required);
  const isWidgetShown = (widgetId: string) => layout.includes(widgetId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.indexOf(active.id as string);
      const newIndex = layout.indexOf(over.id as string);

      const newLayout = arrayMove(layout, oldIndex, newIndex);
      setLayout(newLayout);
      onLayoutChange(newLayout);
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || widget.required) return;

    const nextLayout = isWidgetShown(widgetId)
      ? layout.filter((id) => id !== widgetId)
      : normalizeLayout([...layout, widgetId], widgets);

    setLayout(nextLayout);
    onLayoutChange(nextLayout);
  };

  const resetToDefault = () => {
    setLayout(defaultLayout);
    onLayoutChange(defaultLayout);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Customization Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            Dashboard Layout
          </h2>
          <Badge
            variant={customizing ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setCustomizing(!customizing)}
          >
            {customizing ? "Done" : "Customize"}
          </Badge>
        </div>

        {customizing && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </Button>
        )}
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggleVisibility={toggleWidgetVisibility}
                customizing={customizing}
                onRequestCustomize={() => setCustomizing(true)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Customize Panel */}
      {customizing && optionalWidgets.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Show/Hide Widgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalWidgets.map((w) => (
              <label
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30"
              >
                <span className="text-sm font-medium text-foreground">{w.title}</span>
                <Checkbox
                  checked={isWidgetShown(w.id)}
                  onCheckedChange={() => toggleWidgetVisibility(w.id)}
                />
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {customizing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <GripVertical className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Customize Your Dashboard</h4>
              <p className="text-sm text-blue-700 mt-1">
                Drag widgets using the grip handle to reorder them.
                Click the settings icon on a card to hide it, or use the panel above to show/hide widgets.
                Your layout will be saved automatically.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
