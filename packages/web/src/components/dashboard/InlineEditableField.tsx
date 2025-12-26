"use client";

import React, { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, X, Pencil, Loader2 } from "lucide-react";

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
  showEditIcon?: boolean;
}

export function InlineEditableField({
  value,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  className,
  inputClassName,
  maxLength,
  minLength = 0,
  disabled = false,
  showEditIcon = true,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Removed: useEffect that synced editValue with value prop
  // The value is already set correctly in handleStartEdit, which is where sync
  // actually needs to happen. The previous useEffect was an anti-pattern.

  // Focus input when editing starts - using callback in handleStartEdit instead
  const focusInput = useCallback(() => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value); // Sync value here - only when starting edit
    setError(null);
    focusInput(); // Focus via callback instead of useEffect
  }, [disabled, value, focusInput]);


  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // Validation
    if (minLength > 0 && trimmedValue.length < minLength) {
      setError(`Minimum ${minLength} characters required`);
      return;
    }

    // No change, just cancel
    if (trimmedValue === value) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, minLength, onSave, handleCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline]
  );

  const handleBlur = useCallback(() => {
    // Only auto-save on blur if there's a change and no error
    if (editValue.trim() !== value && !error) {
      handleSave();
    } else {
      handleCancel();
    }
  }, [editValue, value, error, handleSave, handleCancel]);

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;

    return (
      <div className={cn("relative", className)}>
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(
            "pr-16",
            error && "border-destructive focus-visible:ring-destructive",
            inputClassName
          )}
          rows={multiline ? 3 : undefined}
        />
        
        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="p-1 hover:bg-primary/10 rounded transition-colors"
                title="Save (Enter)"
                aria-label="Save"
              >
                <Check className="h-4 w-4 text-primary" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 hover:bg-destructive/10 rounded transition-colors"
                title="Cancel (Escape)"
                aria-label="Cancel"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 cursor-pointer rounded px-2 py-1 -mx-2",
        !disabled && "hover:bg-muted/50 transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleStartEdit}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      <span
        className={cn(
          "flex-1",
          !value && "text-muted-foreground italic"
        )}
      >
        {value || placeholder}
      </span>
      {showEditIcon && !disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

/**
 * Inline editable status badge
 */
interface InlineStatusSelectProps {
  value: string;
  options: { value: string; label: string; color?: string }[];
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
}

export function InlineStatusSelect({
  value,
  options,
  onSave,
  disabled = false,
}: InlineStatusSelectProps) {
  const [isSaving, setIsSaving] = useState(false);

  const currentOption = options.find((opt) => opt.value === value);

  const handleChange = async (newValue: string) => {
    if (newValue === value) return;
    setIsSaving(true);
    try {
      await onSave(newValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled || isSaving}
      className={cn(
        "text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer",
        "bg-muted hover:bg-muted/80 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
