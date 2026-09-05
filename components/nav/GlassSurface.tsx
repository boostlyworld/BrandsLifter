"use client";

import { useEffect, useRef, useState } from "react";

import type { LiquidGlass as LiquidGlassClass } from "liquid-glass-js";

import { GLASS_BAR } from "@/lib/glassMaterial";
import { glassElements } from "@/lib/liquidGlassElements";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* The bar's own geometry. Every optical value comes from the shared material
   in lib/glassMaterial.ts — the nav used to keep a private copy of the numbers,
   which is why retuning the glass elsewhere never changed the bar. */
const GLASS = {
  ...GLASS_BAR,
  radius: 0, // full-bleed strip: no corners to round
};

/** Below this width the clone-and-refract cost is not worth it — CSS instead. */
const GLASS_MIN_WIDTH = 900;

/**
 * The bar's box, measured so that a transform on it is ignored.
 *
 * getBoundingClientRect() would be the obvious call and is the wrong one here.
 * The bar translates off the top of the screen over the footer, and a rect taken
 * during that — the resize this schedules can easily land inside the bar's own
 * 360ms transition — reports a negative top and drags the glass up with it. It
 * then stays there, because nothing re-measures until the next state change: the
 * bar comes back on the way up and its glass does not, leaving the wordmark and
 * the links sitting unbacked on whatever section is scrolling underneath.
 *
 * offsetTop / offsetLeft / offsetWidth / offsetHeight are layout, not painting,
 * so they are untouched by the transform. The bar is fixed at the top of the
 * viewport, so its layout box is the whole answer.
 */
function barBox(nav: HTMLElement) {
  return {
    left: nav.offsetLeft,
    top: nav.offsetTop,
    width: Math.ceil(nav.offsetWidth),
    height: Math.ceil(nav.offsetHeight),
  };
}

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
      const box = barBox(nav);
      glass.set({ width: box.width, height: box.height });
      glass.moveTo(box.left, box.top);
    };

    void (async () => {
      try {
        const mod = await import("liquid-glass-js");
        if (cancelled) return;

        const LiquidGlass = mod.default ?? mod.LiquidGlass;
        const background = document.querySelector(backgroundSelector);
        const nav = targetRef.current;
        if (!background || !nav) throw new Error("glass target missing");

        const box = barBox(nav);
        glass = new LiquidGlass({
          ...GLASS,
          background,
          width: box.width,
          height: box.height,
          x: box.left,
          y: box.top,
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
      const box = barBox(nav);
      glass.set({ width: box.width, height: box.height });
      glass.moveTo(box.left, box.top);
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
