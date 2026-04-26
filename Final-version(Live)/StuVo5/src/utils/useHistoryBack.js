/**
 * useHistoryBack.js
 * Push a history entry when an overlay opens so the browser back gesture
 * (or hardware back button) closes the overlay instead of navigating away.
 *
 * Handles:
 *  - React StrictMode double-mount (dev only)
 *  - React Router BrowserRouter sharing the same popstate listener
 *  - Inline arrow functions for onClose (ref-based, no effect churn)
 *  - Multiple simultaneous useHistoryBack hooks in one component
 *
 * Usage:
 *   useHistoryBack(isOpen, onClose);
 */
import { useEffect, useRef } from "react";

// Module-level flag: when WE trigger history.back() during cleanup,
// set this so any popstate it fires is ignored by all instances.
let suppressNext = false;

export function useHistoryBack(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Track whether WE have an active history entry right now
  const activeRef = useRef(false);

  // Stable popstate handler — stored in ref so it's never recreated
  const handlerRef = useRef(null);
  if (!handlerRef.current) {
    handlerRef.current = () => {
      if (suppressNext) {
        suppressNext = false;
        return;
      }
      if (activeRef.current) {
        activeRef.current = false;
        window.removeEventListener("popstate", handlerRef.current);
        onCloseRef.current();
      }
    };
  }

  useEffect(() => {
    if (!isOpen) {
      // Overlay just closed programmatically — pop our history entry if present
      if (activeRef.current) {
        activeRef.current = false;
        window.removeEventListener("popstate", handlerRef.current);
        // Suppress the popstate that history.back() will fire asynchronously
        // so neither our other hooks nor React Router react to it.
        suppressNext = true;
        window.history.back();
      }
      return;
    }

    // isOpen === true — push a history entry
    if (!activeRef.current) {
      window.history.pushState({ historyBack: true }, "");
      activeRef.current = true;
      window.addEventListener("popstate", handlerRef.current);
    }

    return () => {
      // Cleanup (StrictMode remount or real unmount)
      if (activeRef.current) {
        activeRef.current = false;
        window.removeEventListener("popstate", handlerRef.current);
        suppressNext = true;
        window.history.back();
      }
    };
  }, [isOpen]);
}