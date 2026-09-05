"use client";

import { useEffect, useRef } from "react";

import { clamp, scrollProgress } from "./scrollProgress";
import { prefersReducedMotion } from "./useReducedMotion";

/**
 * Publishes how far the visitor is through one section as a CSS custom property
 * on the returned element — `--section-progress`, 0 to 1.
 *
 * This is what lets the Services section use its pin for something: while the
 * section is held still, its four offerings arrive one at a time, keyed off this
 * value in CSS rather than off a JS animation.
 *
 * The read loop only runs while the section is on screen, and it writes a
 * string to one element per frame — no React state is involved.
 */
export function useSectionProgress<T extends HTMLElement>(
  /** Index in section space: 0 hero, 1 about, 2 services, 3 testimonials. */
  index: number,
  /** How much of the section span the progress should be spread over. */
  span = 1
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Under reduced motion the journey never advances, so anything keyed off
       this value would stay hidden forever. Pin it to "finished" and stop. */
    if (prefersReducedMotion()) {
      el.style.setProperty("--section-progress", "1");
      return;
    }

    let frame = 0;
    let running = false;

    const tick = () => {
      const p = clamp((scrollProgress.section - index) / span);
      el.style.setProperty("--section-progress", p.toFixed(3));
      if (running) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          tick();
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { rootMargin: "20% 0px" }
    );

    observer.observe(el);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [index, span]);

  return ref;
}
