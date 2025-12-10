import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcutsRef.current) {
        const metaMatch = shortcut.meta ? event.metaKey || event.ctrlKey : true;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey || !!shortcut.shift;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    shortcuts,
  };
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'meta' | 'ctrl' | 'shift' | 'alt'>): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.ctrl) {
    parts.push('Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  // Format the key
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === 'Delete' || shortcut.key === 'Backspace') keyDisplay = isMac ? '⌫' : 'Del';
  if (shortcut.key === 'Enter') keyDisplay = '↵';
  if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
  if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
  if (shortcut.key === 'ArrowLeft') keyDisplay = '←';
  if (shortcut.key === 'ArrowRight') keyDisplay = '→';

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}

/**
 * Common dashboard keyboard shortcuts factory
 */
export function createDashboardShortcuts(actions: {
  onSearch?: () => void;
  onNewJob?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  onSelectAll?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      meta: true,
      action: actions.onSearch,
      description: 'Open search',
      category: 'Navigation',
    });
  }

  if (actions.onNewJob) {
    shortcuts.push({
      key: 'n',
      meta: true,
      action: actions.onNewJob,
      description: 'Add new job',
      category: 'Actions',
    });
  }

  if (actions.onImport) {
    shortcuts.push({
      key: 'i',
      meta: true,
      action: actions.onImport,
      description: 'Import jobs',
      category: 'Actions',
    });
  }

  if (actions.onExport) {
    shortcuts.push({
      key: 'e',
      meta: true,
      action: actions.onExport,
      description: 'Export jobs',
      category: 'Actions',
    });
  }

  if (actions.onDelete) {
    shortcuts.push({
      key: 'Delete',
      action: actions.onDelete,
      description: 'Delete selected',
      category: 'Actions',
    });
    shortcuts.push({
      key: 'Backspace',
      action: actions.onDelete,
      description: 'Delete selected',
      category: 'Actions',
    });
  }

  if (actions.onEscape) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onEscape,
      description: 'Clear selection / Close modal',
      category: 'Navigation',
    });
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: '?',
      action: actions.onHelp,
      description: 'Show keyboard shortcuts',
      category: 'Help',
    });
  }

  if (actions.onSelectAll) {
    shortcuts.push({
      key: 'a',
      meta: true,
      action: actions.onSelectAll,
      description: 'Select all',
      category: 'Selection',
    });
  }

  return shortcuts;
}
