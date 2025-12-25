"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface AutoSaveOptions<T> {
  /** Storage key for localStorage */
  key: string;
  /** Debounce delay in ms (default: 1000) */
  delay?: number;
  /** Callback when save occurs */
  onSave?: (data: T) => void;
  /** Callback when restored from storage */
  onRestore?: (data: T) => void;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Hook for auto-saving form data to localStorage
 * 
 * Features:
 * - Debounced saving to avoid excessive writes
 * - Restores data when component mounts
 * - Tracks save state for UI indicators
 * - Clears storage on successful form submission
 * 
 * @example
 * ```tsx
 * const { save, clear, state, restore } = useAutoSave({
 *   key: "resume-builder-draft",
 *   onRestore: (data) => setFormData(data),
 * });
 * 
 * // Call save whenever form data changes
 * useEffect(() => { save(formData); }, [formData, save]);
 * 
 * // Clear after successful submission
 * const handleSubmit = async () => {
 *   await submitForm(formData);
 *   clear();
 * };
 * 
 * // Show indicator
 * {state.hasUnsavedChanges && <span>Unsaved changes</span>}
 * {state.isSaving && <span>Saving...</span>}
 * ```
 */
export function useAutoSave<T>(options: AutoSaveOptions<T>) {
  const { key, delay = 1000, onSave, onRestore, enabled = true } = options;
  
  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");

  // Restore from localStorage on mount
  const restore = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved) as T;
        onRestore?.(data);
        return data;
      }
    } catch (error) {
      console.warn("Failed to restore auto-saved data:", error);
    }
    return null;
  }, [key, onRestore]);

  // Save to localStorage (debounced)
  const save = useCallback((data: T) => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (serialized === lastDataRef.current) return;
    
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      try {
        setState(prev => ({ ...prev, isSaving: true }));
        
        localStorage.setItem(key, serialized);
        lastDataRef.current = serialized;
        
        setState({
          lastSaved: new Date(),
          isSaving: false,
          hasUnsavedChanges: false,
        });
        
        onSave?.(data);
      } catch (error) {
        console.warn("Failed to auto-save:", error);
        setState(prev => ({ ...prev, isSaving: false }));
      }
    }, delay);
  }, [key, delay, onSave, enabled]);

  // Immediate save (no debounce)
  const saveNow = useCallback((data: T) => {
    if (!enabled) return;
    
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      lastDataRef.current = serialized;
      
      setState({
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      });
      
      onSave?.(data);
    } catch (error) {
      console.warn("Failed to save:", error);
    }
  }, [key, onSave, enabled]);

  // Clear saved data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastDataRef.current = "";
      setState({
        lastSaved: null,
        isSaving: false,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.warn("Failed to clear auto-saved data:", error);
    }
  }, [key]);

  // Check if there's saved data
  const hasSavedData = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) !== null;
  }, [key]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    saveNow,
    restore,
    clear,
    state,
    hasSavedData,
  };
}

/**
 * Auto-save indicator component
 */
export function AutoSaveIndicator({ state }: { state: AutoSaveState }) {
  if (state.isSaving) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Saving...
      </span>
    );
  }

  if (state.lastSaved) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Saved
      </span>
    );
  }

  if (state.hasUnsavedChanges) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }

  return null;
}
