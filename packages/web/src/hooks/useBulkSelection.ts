import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing bulk selection of items in a list
 * @param allIds - Array of all available item IDs
 */
export function useBulkSelection<T extends string = string>(allIds: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  /**
   * Toggle selection of a single item
   */
  const toggleSelection = useCallback((id: T) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Select a single item (without toggling)
   */
  const select = useCallback((id: T) => {
    setSelectedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Deselect a single item
   */
  const deselect = useCallback((id: T) => {
    setSelectedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Select all items
   */
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Toggle all selections (select all if not all selected, otherwise clear)
   */
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, allIds.length, clearSelection, selectAll]);

  /**
   * Check if an item is selected
   */
  const isSelected = useCallback((id: T) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  /**
   * Computed values
   */
  const selectedCount = selectedIds.size;
  const isAllSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < allIds.length;
  const hasSelection = selectedIds.size > 0;

  /**
   * Get array of selected IDs
   */
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    // State
    selectedIds,
    selectedArray,
    selectedCount,
    
    // Computed
    isAllSelected,
    isPartiallySelected,
    hasSelection,
    
    // Actions
    toggleSelection,
    select,
    deselect,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isSelected,
  };
}

export type BulkSelectionReturn<T extends string = string> = ReturnType<typeof useBulkSelection<T>>;
