"use client";

import { useEffect, useRef, useState } from "react";

import type { LiquidGlass as LiquidGlassClass } from "liquid-glass-js";

import { glassElements } from "@/lib/liquidGlassElements";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ── Tuning ─────────────────────────────────────────────────────────────────
   The optical parameters of the nav's glass. These are liquid-glass-js's own
   knobs; the library models a real height field and refracts what is behind it,
   so `scale` is genuine displacement in pixels rather than a blur radius.

   The bar is full-bleed, so its left and right bezels are off screen — what you
   actually see is the bottom lip, where the scene passing underneath is
   magnified and split into colour. `depth` controls how far up from that edge
   the curve reaches. */
const GLASS = {
  radius: 0, // full-bleed strip: no corners to round
  scale: 26, // refraction strength (max edge displacement, px)
  depth: 22, // how far the curved bezel reaches in from the edge
  curvature: 2.6, // ~2 spherical, ~4 squircle
  convexity: 1, // convex, so the edge magnifies
  chroma: 0.06, // a whisper of chromatic aberration; more looks like a bug
  blur: 14, // the frost
  glow: 0.06,
  edge: 0.42, // specular highlight strength
  specAngle: 118,
  tint: 0.16,
  tintColor: "#1d4a4c", // --c-deep-teal
};

/** Below this width the clone-and-refract cost is not worth it — CSS instead. */
const GLASS_MIN_WIDTH = 900;

export type GlassSurfaceProps = {
  /** Whether the glass should be showing at all. */
  active: boolean;
  /** The element whose bounds the glass should match — the nav bar. */
  targetRef: React.RefObject<HTMLElement | null>;
  /** CSS selector for the element to refract. */
  backgroundSelector: string;
  /** Told whether real glass is running, so the nav can style its fallback. */
  onModeChange?: (mode: "glass" | "css") => void;
};

/**
 * Wraps liquid-glass-js and keeps it glued to the nav bar.
 *
 * Two things about the library shape this component:
 *
 * 1. It appends its own fixed-position elements to <body> and positions them in
 *    screen coordinates. So this renders nothing itself — it just measures the
 *    nav and calls `moveTo`/`set` to match.
 *
 * 2. It refracts a *clone* of the background element. A clone is a snapshot of
 *    the DOM, which would normally go stale the moment the scene crossfades —
 *    which is why every scene opacity on this site is a CSS custom property on
 *    :root rather than an inline style. The clone inherits those variables and
 *    therefore crossfades along with the original, for free. `refresh()` is only
 *    needed when the layout itself changes.
 *
 * Falls back to a CSS `backdrop-filter` (styled in Nav.module.css) when the
 * viewport is narrow, motion is reduced, WebGL-ish features are missing, or the
 * import simply fails.
 */
export function GlassSurface({
  active,
  targetRef,
  backgroundSelector,
  onModeChange,
}: GlassSurfaceProps) {
  const reduced = useReducedMotion();
  const glassRef = useRef<LiquidGlassClass | null>(null);
  const [failed, setFailed] = useState(false);

  /* Whether the viewport is currently wide enough for real glass. Kept as state
     rather than read once, so that resizing back up above the breakpoint
     re-runs the setup effect and rebuilds the glass — previously it was
     destroyed on the way down and never came back. */
  const [wideEnough, setWideEnough] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${GLASS_MIN_WIDTH}px)`);
    const sync = () => setWideEnough(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* The library's elements are created asynchronously, long after the first
     render — so the visibility effect below runs once against nothing. Flipping
     this on creation re-runs it with the real elements in place. Without it the
     glass shows at the top of the page, before any scroll has happened. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced !== false || failed) return;
    if (!wideEnough) {
      onModeChange?.("css");
      return;
    }

    let cancelled = false;
    let glass: LiquidGlassClass | null = null;

    const sync = () => {
      const nav = targetRef.current;
      if (!glass || !nav) return;
      const rect = nav.getBoundingClientRect();
      glass.set({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
      glass.moveTo(rect.left, rect.top);
    };

    void (async () => {
      try {
        const mod = await import("liquid-glass-js");
        if (cancelled) return;

        const LiquidGlass = mod.default ?? mod.LiquidGlass;
        const background = document.querySelector(backgroundSelector);
        const nav = targetRef.current;
        if (!background || !nav) throw new Error("glass target missing");

        const rect = nav.getBoundingClientRect();
        glass = new LiquidGlass({
          ...GLASS,
          background,
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
          x: rect.left,
          y: rect.top,
          zIndex: 40, // matches --z-glass; the pane itself lands at 41
          draggable: false, // it is a nav bar, not a toy
        });
        glassRef.current = glass;
        onModeChange?.("glass");
        sync();
        setReady(true);

        window.addEventListener("resize", onResize);
      } catch {
        if (!cancelled) {
          setFailed(true);
          onModeChange?.("css");
        }
      }
    })();

    /* Only a resize needs a re-clone: the scene crossfade rides on inherited
       CSS variables and updates inside the clone by itself. Crossing the
       breakpoint is handled by `wideEnough` above, which tears this effect
       down and builds it back up in either direction. */
    let resizeTimer: number | undefined;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sync();
        glassRef.current?.refresh();
        sync();
      }, 160);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      glassRef.current?.destroy();
      glassRef.current = null;
      setReady(false);
    };
  }, [reduced, failed, wideEnough, targetRef, backgroundSelector, onModeChange]);

  /* Show and hide by driving the library's own elements, since they live
     outside this component's tree. The bar height also changes when the nav
     collapses, so re-sync on every state change. */
  useEffect(() => {
    const glass = glassRef.current;
    if (!glass) return;

    applyVisibility(glass, active);

    const nav = targetRef.current;
    if (!nav) return;
    /* Wait out the nav's own height transition before matching it. */
    const timer = window.setTimeout(() => {
      const rect = nav.getBoundingClientRect();
      glass.set({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
      glass.moveTo(rect.left, rect.top);
    }, 380);
    return () => window.clearTimeout(timer);
  }, [active, ready, targetRef]);

  return null;
}

/**
 * liquid-glass-js appends two fixed elements to <body> — the lens that carries
 * the refracted image and the pane that adds frost, tint and specular. Neither
 * is inside any React tree, so showing and hiding the glass means reaching for
 * them directly — via the instance, never via a document-wide query. The
 * testimonials section runs glass of its own, and a `querySelector(".lqg-lens")`
 * here would silently start driving whichever pair happens to come first.
 */
function applyVisibility(glass: LiquidGlassClass, visible: boolean) {
  glassElements(glass).forEach((el) => {
    el.style.transition = "opacity var(--dur-nav) var(--ease-out)";
    el.style.opacity = visible ? "1" : "0";
    el.style.pointerEvents = "none";
  });
}
