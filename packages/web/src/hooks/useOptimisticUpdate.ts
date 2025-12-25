"use client";

import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface OptimisticOptions<T, R = unknown> {
  /** The async function to execute */
  asyncFn: (newValue: T) => Promise<R>;
  /** Callback when operation succeeds */
  onSuccess?: (result: R, newValue: T) => void;
  /** Callback when operation fails (before rollback) */
  onError?: (error: Error, previousValue: T) => void;
  /** Custom toast messages */
  messages?: {
    pending?: string;
    success?: string;
    error?: string;
  };
  /** Whether to show toast notifications (default: true for errors) */
  showToast?: boolean | "error-only";
}

interface OptimisticState<T> {
  /** Current value (optimistically updated) */
  value: T;
  /** Whether an async operation is in progress */
  isPending: boolean;
  /** The previous value (for rollback) */
  previousValue: T | null;
  /** Error from the last failed operation */
  error: Error | null;
}

/**
 * Hook for optimistic UI updates
 * 
 * Updates the UI immediately, then executes the async operation.
 * Rolls back on error, shows appropriate feedback.
 * 
 * @example
 * ```tsx
 * const { value: status, update, isPending } = useOptimisticUpdate({
 *   initialValue: application.status,
 *   asyncFn: (newStatus) => updateApplicationStatus(id, newStatus),
 *   onSuccess: () => toast.success("Status updated"),
 * });
 * 
 * // UI updates immediately when update() is called
 * <Select value={status} onValueChange={update} disabled={isPending}>
 *   {isPending && <span className="text-xs text-muted-foreground">Saving...</span>}
 * </Select>
 * ```
 */
export function useOptimisticUpdate<T, R = unknown>(
  initialValue: T,
  options: OptimisticOptions<T, R>
) {
  const { asyncFn, onSuccess, onError, messages, showToast = "error-only" } = options;
  const toast = useToast();
  
  const [state, setState] = useState<OptimisticState<T>>({
    value: initialValue,
    isPending: false,
    previousValue: null,
    error: null,
  });

  // Track the latest value to handle rapid updates
  const latestValueRef = useRef<T>(initialValue);

  const update = useCallback(async (newValue: T) => {
    const previousValue = state.value;
    latestValueRef.current = newValue;

    // Optimistically update UI immediately
    setState(prev => ({
      ...prev,
      value: newValue,
      isPending: true,
      previousValue,
      error: null,
    }));

    try {
      const result = await asyncFn(newValue);
      
      // Only update if this is still the latest value (handles rapid updates)
      if (latestValueRef.current === newValue) {
        setState(prev => ({
          ...prev,
          isPending: false,
          previousValue: null,
        }));

        if (showToast === true && messages?.success) {
          toast.success(messages.success);
        }

        onSuccess?.(result, newValue);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Rollback to previous value
      setState(prev => ({
        ...prev,
        value: previousValue,
        isPending: false,
        previousValue: null,
        error: err,
      }));

      if (showToast === true || showToast === "error-only") {
        toast.error(messages?.error || "Failed to save changes. Please try again.");
      }

      onError?.(err, previousValue);
      
      throw err;
    }
  }, [state.value, asyncFn, onSuccess, onError, messages, showToast, toast]);

  const reset = useCallback((newValue?: T) => {
    const value = newValue ?? initialValue;
    latestValueRef.current = value;
    setState({
      value,
      isPending: false,
      previousValue: null,
      error: null,
    });
  }, [initialValue]);

  return {
    value: state.value,
    isPending: state.isPending,
    error: state.error,
    previousValue: state.previousValue,
    update,
    reset,
    // Convenience helpers
    isRolledBack: state.error !== null,
    hasUnsavedChanges: state.previousValue !== null,
  };
}

/**
 * Hook for optimistic list operations (add, remove, update items)
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  options: {
    addFn?: (item: Omit<T, "id">) => Promise<T>;
    removeFn?: (id: T["id"]) => Promise<void>;
    updateFn?: (id: T["id"], updates: Partial<T>) => Promise<T>;
    onError?: (error: Error) => void;
  }
) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<T["id"]>>(new Set());

  const addItem = useCallback(async (newItem: Omit<T, "id">) => {
    if (!options.addFn) return;

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}` as T["id"];
    const optimisticItem = { ...newItem, id: tempId } as T;

    setItems(prev => [...prev, optimisticItem]);
    setPendingIds(prev => new Set(prev).add(tempId));

    try {
      const savedItem = await options.addFn(newItem);
      
      // Replace temp item with saved item
      setItems(prev => prev.map(item => 
        item.id === tempId ? savedItem : item
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });

      return savedItem;
    } catch (error) {
      // Remove optimistic item on error
      setItems(prev => prev.filter(item => item.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      
      toast.error("Failed to add item");
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [options, toast]);

  const removeItem = useCallback(async (id: T["id"]) => {
    if (!options.removeFn) return;

    const itemToRemove = items.find(item => item.id === id);
    if (!itemToRemove) return;

    // Optimistically remove
    setItems(prev => prev.filter(item => item.id !== id));
    setPendingIds(prev => new Set(prev).add(id));

    try {
      await options.removeFn(id);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      // Restore item on error
      setItems(prev => [...prev, itemToRemove]);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      toast.error("Failed to remove item");
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [items, options, toast]);

  const updateItem = useCallback(async (id: T["id"], updates: Partial<T>) => {
    if (!options.updateFn) return;

    const originalItem = items.find(item => item.id === id);
    if (!originalItem) return;

    // Optimistically update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
    setPendingIds(prev => new Set(prev).add(id));

    try {
      const savedItem = await options.updateFn(id, updates);
      
      setItems(prev => prev.map(item =>
        item.id === id ? savedItem : item
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      return savedItem;
    } catch (error) {
      // Restore original item on error
      setItems(prev => prev.map(item =>
        item.id === id ? originalItem : item
      ));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      toast.error("Failed to update item");
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [items, options, toast]);

  return {
    items,
    pendingIds,
    isPending: (id: T["id"]) => pendingIds.has(id),
    addItem,
    removeItem,
    updateItem,
    setItems, // For external updates (e.g., after refetch)
  };
}
