import { useEffect, useRef } from "react";

/**
 * Restores focus to the previously focused element when a controlled dialog closes.
 * Useful for dialogs opened programmatically (without DialogTrigger) to avoid focus loss.
 */
export function useRestoreFocus(isOpen: boolean) {
  const lastFocusedElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen) {
      lastFocusedElementRef.current = document.activeElement;
      return;
    }

    if (!isOpen && lastFocusedElementRef.current instanceof HTMLElement) {
      lastFocusedElementRef.current.focus({ preventScroll: true });
      lastFocusedElementRef.current = null;
    }
  }, [isOpen]);
}
