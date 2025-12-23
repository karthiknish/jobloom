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
}

function SortableWidget({ widget, onToggleVisibility }: SortableWidgetProps) {
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
                onClick={() => onToggleVisibility(widget.id)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
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

export function DraggableDashboard({
  widgets,
  onLayoutChange,
  savedLayout,
  className = ""
}: DraggableDashboardProps) {
  const [layout, setLayout] = useState<string[]>(
    savedLayout || widgets.filter(w => w.visible).map(w => w.id)
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
      setLayout(savedLayout);
    }
  }, [savedLayout]);

  // Filter and sort widgets based on current layout
  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => {
      const aIndex = layout.indexOf(a.id);
      const bIndex = layout.indexOf(b.id);
      return aIndex - bIndex;
    });

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

    const newLayout = widget.visible
      ? layout.filter(id => id !== widgetId)
      : [...layout, widgetId];

    setLayout(newLayout);
    onLayoutChange(newLayout);
  };

  const resetToDefault = () => {
    const defaultLayout = widgets.filter(w => w.visible).map(w => w.id);
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
                Click the settings icon to hide/show optional widgets.
                Your layout will be saved automatically.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
