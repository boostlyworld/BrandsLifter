"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiquidGlass as LiquidGlassClass } from "liquid-glass-js";

import { GLASS_PANEL } from "@/lib/glassMaterial";
import { glassElements } from "@/lib/liquidGlassElements";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Below this width the clone-and-refract cost is not worth it — CSS instead. */
const GLASS_MIN_WIDTH = 900;

/**
 * The lens has to paint above the fixed <Stage> and below <main>.
 *
 * Both the stage and this sit at z 0, and the stage comes first in the DOM, so
 * the lens wins against it on document order alone. Every section is
 * `z-index: var(--z-content)` — 1 — and therefore a stacking context, which is
 * the important half: nothing inside a section can ever climb above a
 * body-level element with a higher z, so a lens at, say, 40 would paint straight
 * over the contact form's own inputs.
 *
 * Read from the token rather than restated here, so every z on the site is
 * still settled in one place (globals.css).
 */
function glassZ() {
  const token = getComputedStyle(document.documentElement).getPropertyValue(
    "--z-section-glass"
  );
  const parsed = Number.parseInt(token, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export type GlassMode = "glass" | "css";

export type SectionGlassProps = {
  /** Whether the glass should be showing at all. */
  active: boolean;
  /**
   * The element whose bounds the glass should match. A ref object rather than an
   * element so the caller can re-aim it — the testimonial glass follows whichever
   * circle is open — without this component being torn down and rebuilt.
   *
   * Point it at something whose size is *stable*: `set()` rebuilds the
   * displacement map, so a target that is mid-transition would rebuild it every
   * frame. The testimonials use a hidden box at the open diameter for exactly
   * this reason.
   */
  targetRef: React.RefObject<HTMLElement | null>;
  /** CSS selector for the element to refract. */
  backgroundSelector: string;
  /** Element the position loop should only run while on screen. */
  sectionRef: React.RefObject<HTMLElement | null>;
  /** `"round"` makes the radius half the shorter side — a circle. */
  radius?: number | "round";
  /** Milliseconds to wait before fading in, so it can land with an animation. */
  showDelay?: number;
  /** Told whether real glass is running, so the section can style its fallback. */
  onModeChange?: (mode: GlassMode) => void;
};

/**
 * liquid-glass-js for a surface that scrolls.
 *
 * The nav's GlassSurface has the easy version of this problem: its target is
 * fixed, so it only re-syncs when the bar changes height. These targets move
 * with the page, so the glass is glued to them by a `requestAnimationFrame`
 * loop — gated by an IntersectionObserver on the section, so it costs nothing
 * once the section is off screen.
 *
 * `moveTo` only writes transforms and is cheap enough to call every frame.
 * `set()` regenerates the displacement map, so it is called only when the
 * target's measured size actually changes.
 *
 * Falls back to a CSS `backdrop-filter` (see the `[data-glass="css"]` rules in
 * Testimonials.module.css) when the viewport is narrow, motion is reduced, or
 * the import fails — the same three conditions as the nav.
 */
export function SectionGlass({
  active,
  targetRef,
  backgroundSelector,
  sectionRef,
  radius = 16,
  showDelay = 0,
  onModeChange,
}: SectionGlassProps) {
  const reduced = useReducedMotion();
  const glassRef = useRef<LiquidGlassClass | null>(null);
  const [failed, setFailed] = useState(false);

  /* Kept as state rather than read once so that resizing back up above the
     breakpoint re-runs the setup effect and rebuilds the glass. */
  const [wideEnough, setWideEnough] = useState(false);
  const [ready, setReady] = useState(false);

  /* Whether the section is on screen at all.
     Not only an optimisation. The lens and its pane are fixed elements on
     <body>, positioned by the loop below — and the loop stops when the section
     leaves, which freezes them wherever they last were. Scroll up from the
     testimonials quickly enough and the contact card's pane is left parked over
     the hero, a rectangle of frost and refraction sitting on a painting it has
     nothing to do with. So being on screen is part of being visible, not just
     part of being worth updating. */
  const [onScreen, setOnScreen] = useState(false);

  /* Last size the displacement map was built for. Kept across renders so the
     loop can tell a genuine resize from the 60 frames a second where nothing
     about the target's geometry has changed. */
  const built = useRef({ width: 0, height: 0 });

  /**
   * Point the glass at its target. Returns false when there is nothing to aim
   * at, which is what keeps a freshly-built lens — 1×1 at the top left corner —
   * from being faded in over the top of the page.
   */
  const aim = useCallback(
    (glass: LiquidGlassClass) => {
      const target = targetRef.current;
      if (!target) return false;

      /* offsetWidth/Height rather than the rect's, so a target that is being
         scaled or is mid-transition does not force a map rebuild every frame.
         The rect still gives the centre, which is what a scale preserves. */
      const width = Math.max(1, Math.ceil(target.offsetWidth));
      const height = Math.max(1, Math.ceil(target.offsetHeight));
      const rect = target.getBoundingClientRect();

      if (width !== built.current.width || height !== built.current.height) {
        built.current = { width, height };
        glass.set({
          width,
          height,
          radius: radius === "round" ? Math.min(width, height) / 2 : radius,
        });
      }

      glass.moveTo(
        rect.left + rect.width / 2 - width / 2,
        rect.top + rect.height / 2 - height / 2
      );
      return true;
    },
    [targetRef, radius]
  );

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${GLASS_MIN_WIDTH}px)`);
    const sync = () => setWideEnough(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced !== false || failed) return;
    if (!wideEnough) {
      onModeChange?.("css");
      return;
    }

    let cancelled = false;
    let glass: LiquidGlassClass | null = null;

    void (async () => {
      try {
        const mod = await import("liquid-glass-js");
        if (cancelled) return;

        const LiquidGlass = mod.default ?? mod.LiquidGlass;
        const background = document.querySelector(backgroundSelector);
        if (!background) throw new Error("glass background missing");

        glass = new LiquidGlass({
          ...GLASS_PANEL,
          background,
          width: 1,
          height: 1,
          radius: 0,
          x: 0,
          y: 0,
          zIndex: glassZ(),
          draggable: false, // it is a panel on a page, not a toy
        });

        /* Start hidden and stay untouchable. The pane is only here for its
           frost and tint — its rim and bloom are drawn on the real element by
           the --lg3-* tokens in globals.css, which strips the library's own. */
        glassElements(glass).forEach((el) => {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        });

        aim(glass);

        glassRef.current = glass;
        onModeChange?.("glass");
        setReady(true);
      } catch {
        if (!cancelled) {
          setFailed(true);
          onModeChange?.("css");
        }
      }
    })();

    return () => {
      cancelled = true;
      glassRef.current?.destroy();
      glassRef.current = null;
      setReady(false);
    };
  }, [reduced, failed, wideEnough, backgroundSelector, onModeChange, aim]);

  /* Glue the glass to its target for as long as the section is on screen. */
  useEffect(() => {
    if (!ready) return;
    const glass = glassRef.current;
    const section = sectionRef.current;
    if (!glass || !section) return;

    let frame = 0;
    let running = false;

    const tick = () => {
      aim(glass);
      if (running) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.isIntersecting);
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
    observer.observe(section);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      setOnScreen(false);
    };
  }, [ready, sectionRef, aim]);

  /* Show and hide. The delay lets the glass land as an expansion finishes
     rather than blooming at full size while the circle is still growing. */
  useEffect(() => {
    const glass = glassRef.current;
    if (!glass || !ready) return;

    const visible = active && onScreen;

    const show = () => {
      /* Re-aim first: the target may have moved, or may not have existed when
         the lens was built. If there is still nothing to aim at, stay hidden
         rather than showing a 1×1 pane in the corner of the page. */
      const placed = aim(glass);
      glassElements(glass).forEach((el) => {
        el.style.transition = "opacity 320ms var(--ease-out)";
        el.style.opacity = visible && placed ? "1" : "0";
      });
    };

    if (!visible || showDelay === 0) {
      show();
      return;
    }
    const timer = window.setTimeout(show, showDelay);
    return () => window.clearTimeout(timer);
  }, [active, onScreen, ready, showDelay, aim]);

  return null;
}
