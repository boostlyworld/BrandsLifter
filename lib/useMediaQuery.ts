"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a media query, including changes made while the page is open.
 *
 * The same `useSyncExternalStore` shape as `useReducedMotion` — a media query is
 * exactly the external store that API exists for, and the useEffect + setState
 * version causes a cascading render on every mount (and is rejected by the React
 * Compiler lint).
 *
 * Unlike `useReducedMotion` this reports `false` on the server rather than a
 * third "don't know yet" state, because its callers use it to pick an event
 * handler rather than to decide whether to mount a canvas. Nothing is hidden or
 * unmounted on the strength of it, so the one frame before hydration corrects it
 * is invisible.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
