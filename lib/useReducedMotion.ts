"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** Server and first-hydration render: "we do not know yet". */
const getServerSnapshot = () => null;

/**
 * Tracks `prefers-reduced-motion`, including changes made while the page is
 * open.
 *
 * Returns `null` until the first client render. That third state matters: it
 * lets callers avoid mounting a WebGL canvas or a ScrollTrigger during the
 * server render and then tearing it down a frame later. Treat `null` as
 * "don't start anything yet".
 *
 * Written with useSyncExternalStore rather than useEffect + setState because a
 * media query is exactly the external store that API exists for — and because
 * the setState-in-effect version causes a cascading render on every mount.
 */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

/** Non-reactive read, for imperative code that runs once (GSAP setup). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}
