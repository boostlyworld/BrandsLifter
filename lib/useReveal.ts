"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/* useLayoutEffect on the client, useEffect on the server. The hide-then-reveal
   handoff has to happen before the browser paints, or every section flashes in
   at full opacity and then jumps back to hidden. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * How far into the viewport an element must come before it reveals. The
 * negative bottom keeps things from firing while they are still only just
 * peeking over the fold.
 */
const ROOT_MARGIN = "0px 0px -10% 0px";

/**
 * Reveals every `[data-reveal]` descendant of the returned ref once it enters
 * the viewport, by flipping the attribute to `"in"`. The transition itself is
 * CSS (see the `[data-reveal]` rules in globals.css), so reduced motion is
 * handled there rather than here.
 *
 * One observer per section rather than one per element, and each element is
 * unobserved after it fires — this runs on five sections, not five hundred, and
 * nothing should re-animate on the way back up.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* Opt this subtree into hiding. The CSS only hides [data-reveal] elements
       inside a [data-reveal-root], so until this line runs the content is
       plainly visible — which is what should happen if the bundle never
       arrives. */
    root.setAttribute("data-reveal-root", "");

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (targets.length === 0) return;

    const reveal = (el: Element) => el.setAttribute("data-reveal", "in");

    // No IntersectionObserver (very old browser): show everything immediately
    // rather than leaving the page blank.
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: 0.05 }
    );

    /* Anything already on screen at load is revealed outright, measured against
       the real viewport rather than the observer's inset root. Otherwise
       elements that happen to sit inside that negative bottom margin — the
       hero's buttons on a short phone screen, for one — stay invisible until
       the user scrolls, which for above-the-fold content means never. A frame's
       delay so the browser has painted the hidden state and can transition
       from it. */
    const frame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight;
      targets.forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.top < viewportHeight && box.bottom > 0) reveal(el);
        else observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return ref;
}
