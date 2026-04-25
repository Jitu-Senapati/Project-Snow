/**
 * useHistoryBack.js
 * When an overlay/modal/sub-page opens, push a history entry so the browser
 * back gesture closes the overlay instead of navigating away.
 *
 * Usage:
 *   useHistoryBack(isOpen, onClose);
 *
 * When isOpen becomes true → pushState so back gesture calls onClose
 * When user presses back  → onClose() is called, stays on current page
 * When isOpen becomes false programmatically → pops our history entry cleanly
 */
import { useEffect, useRef } from "react";

export function useHistoryBack(isOpen, onClose) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      // Push a history entry without changing the URL
      window.history.pushState({ historyBack: true }, "");
      pushedRef.current = true;

      const onPopState = () => {
        pushedRef.current = false;
        onClose();
      };
      window.addEventListener("popstate", onPopState, { once: true });

      return () => {
        window.removeEventListener("popstate", onPopState);
        // If closed programmatically (not via back), clean up the pushed entry
        if (pushedRef.current) {
          pushedRef.current = false;
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);
}