"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MobileDataTableColumn<T> {
  key: keyof T | string;
  label: string;
  /** Render custom content */
  render?: (item: T) => React.ReactNode;
  /** Show in header of card */
  isHeader?: boolean;
  /** Show as badge */
  isBadge?: boolean;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface MobileDataTableProps<T> {
  data: T[];
  columns: MobileDataTableColumn<T>[];
  /** Function to get unique key for each item */
  getKey: (item: T) => string;
  /** Called when an item is clicked */
  onItemClick?: (item: T) => void;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton count */
  skeletonCount?: number;
  /** Additional class for cards */
  cardClassName?: string;
}

/**
 * MobileDataTable - Card-based list view for mobile devices
 * 
 * @example
 * <MobileDataTable
 *   data={jobs}
 *   columns={[
 *     { key: 'title', label: 'Job Title', isHeader: true },
 *     { key: 'company', label: 'Company' },
 *     { key: 'status', label: 'Status', isBadge: true },
 *   ]}
 *   getKey={(job) => job.id}
 *   onItemClick={(job) => openJob(job)}
 * />
 */
export function MobileDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  getKey,
  onItemClick,
  emptyState,
  isLoading = false,
  skeletonCount = 5,
  cardClassName,
}: MobileDataTableProps<T>) {
  const getValue = (item: T, key: keyof T | string): unknown => {
    if (typeof key === 'string' && key.includes('.')) {
      // Handle nested keys like 'user.name'
      const keys = key.split('.');
      let result: unknown = item;
      for (const k of keys) {
        result = (result as Record<string, unknown>)?.[k];
      }
      return result;
    }
    return item[key as keyof T];
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div 
            key={i} 
            className="bg-card border rounded-xl p-4 space-y-3 animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return emptyState || (
      <div className="text-center py-12 text-muted-foreground">
        No items found
      </div>
    );
  }

  const headerColumn = columns.find(col => col.isHeader);
  const visibleColumns = columns.filter(col => !col.hideOnMobile && !col.isHeader);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={getKey(item)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          onClick={() => onItemClick?.(item)}
          className={cn(
            "bg-card border rounded-xl p-4 space-y-2 transition-all",
            "active:scale-[0.98] active:bg-muted/50",
            onItemClick && "cursor-pointer hover:border-primary/30 hover:shadow-md",
            cardClassName
          )}
        >
          {/* Header row */}
          {headerColumn && (
            <div className="font-semibold text-foreground text-base">
              {headerColumn.render 
                ? headerColumn.render(item)
                : String(getValue(item, headerColumn.key) ?? '')
              }
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-1.5">
            {visibleColumns.map((column) => {
              const value = getValue(item, column.key);
              const content = column.render 
                ? column.render(item)
                : String(value ?? '');

              if (column.isBadge && content) {
                return (
                  <div key={String(column.key)} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{column.label}:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={String(column.key)} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{column.label}:</span>
                  <span className="text-foreground truncate">{content}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default MobileDataTable;
