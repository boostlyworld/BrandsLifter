"use client";

import { useEffect, useRef, useState } from "react";

import { BALLOON_EXIT, JOURNEY_SPAN } from "@/lib/balloonPath";
import {
  clamp,
  SECTION_IDS,
  scrollProgress,
  smoothRamp,
  type SectionId,
} from "@/lib/scrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

import { BalloonCanvas } from "./BalloonCanvas";
import { SceneBackdrop } from "./SceneBackdrop";
import { SCENES, XFADE_ENTER, XFADE_SETTLE } from "./scenes";
import styles from "./Stage.module.css";

/* ── Tuning ─────────────────────────────────────────────────────────────────
   The one genuine ScrollTrigger pin on the page. The Services section holds
   still for this fraction of a viewport of extra scroll while its four
   offerings reveal in sequence and the balloon settles into the clouds.
   Raise it for a longer hold, set it to 0 to remove the pin entirely. */
const SERVICES_PIN_EXTRA_VH = 0.85;

/** Below this viewport width the pin is dropped and Services simply scrolls. */
const PIN_MIN_WIDTH = 768;

/** Breathing room left below the last services row once the camera has panned. */
const SERVICES_PAN_SLACK = 24;

/**
 * The window, in the Services section's own 0–1 progress, over which the camera
 * pans. Must match the clamp on .track in Services.module.css — the CSS spends
 * the distance and this tells the balloon to travel with it.
 */
const SERVICES_PAN_WINDOW = { start: 0.07, span: 0.205 };

/** A little past the balloon's fade-out, the canvas stops rendering. */
const BALLOON_UNMOUNT_AT = BALLOON_EXIT.fadeEnd + 0.15;

export type StageProps = {
  /** Fires when the framed section changes, so the nav can recolour itself. */
  onSceneChange?: (id: SectionId) => void;
};

/**
 * Owns the entire scroll journey:
 *   · measures where each section sits and converts scroll into section space
 *   · crossfades the five painted backdrops
 *   · feeds the balloon its journey position
 *   · pins the Services section (the only pin on the page)
 *
 * Under `prefers-reduced-motion` none of that runs: an IntersectionObserver
 * swaps the backdrop for whichever section is on screen, nothing is pinned and
 * nothing is scrubbed.
 */
export function Stage({ onSceneChange }: StageProps) {
  const reduced = useReducedMotion();
  const [balloonMounted, setBalloonMounted] = useState(true);

  /* Refs, not state — these are read and written inside a scroll callback and
     must never cause a render. */
  const sceneRef = useRef<SectionId>("home");
  const balloonMountedRef = useRef(true);

  /* ── Reduced motion: discrete backdrop swap, no GSAP, no pin ──────────── */
  useEffect(() => {
    if (reduced !== true) return;

    const root = document.documentElement;
    const sections = SECTION_IDS.map((id) => document.getElementById(id));

    const show = (id: SectionId) => {
      SCENES.forEach((scene) => {
        root.style.setProperty(scene.cssVar, scene.id === id ? "1" : "0");
      });
      if (sceneRef.current !== id) {
        sceneRef.current = id;
        onSceneChange?.(id);
      }
    };

    // The balloon stays parked in the hero; it simply never travels.
    scrollProgress.section = 0;
    scrollProgress.journey = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const framed = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (framed?.target.id) show(framed.target.id as SectionId);
      },
      { threshold: [0.2, 0.5, 0.8] }
    );

    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reduced, onSceneChange]);

  /* ── Full motion: GSAP ScrollTrigger ──────────────────────────────────── */
  useEffect(() => {
    if (reduced !== false) return;

    let cancelled = false;
    let cleanup = () => {};

    // GSAP is only needed in the browser, and only when motion is allowed, so
    // it is fetched on demand rather than shipped in the first payload.
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const root = document.documentElement;
      const sections = SECTION_IDS.map((id) => document.getElementById(id));

      /** Document-space top of each section. Re-read after every layout. */
      let tops: number[] = [];

      const measure = () => {
        tops = sections.map((el) => {
          if (!el) return 0;
          /* A pinned section lives inside a GSAP pin-spacer, and GSAP moves the
             spacer's padding from below the element to above it once you scroll
             past the pin. Measuring the element itself would therefore make the
             Services span collapse and the About span swallow the pin distance.
             The spacer is the stable box. */
          const parent = el.parentElement;
          const box =
            parent && parent.classList.contains("pin-spacer") ? parent : el;
          return box.getBoundingClientRect().top + window.scrollY;
        });
      };

      /**
       * Raw scroll position → section space (see lib/scrollProgress.ts).
       * Sections have very different heights and one of them is pinned, so this
       * normalises within each span rather than assuming a uniform page.
       */
      const toSectionSpace = (y: number) => {
        if (tops.length === 0) return 0;
        if (y <= tops[0]) return 0;
        for (let i = 0; i < tops.length - 1; i += 1) {
          if (y < tops[i + 1]) {
            const span = tops[i + 1] - tops[i];
            return i + (span > 0 ? (y - tops[i]) / span : 0);
          }
        }
        return tops.length - 1;
      };

      const update = () => {
        const y = window.scrollY;
        const s = toSectionSpace(y);
        scrollProgress.section = s;
        scrollProgress.journey = clamp(s / JOURNEY_SPAN);

        /* Ride the services camera. Same window as the CSS, converted to the
           viewport fractions the flight path is written in. */
        scrollProgress.pan =
          servicesPan === 0
            ? 0
            : (servicesPan / window.innerHeight) *
              clamp((s - 2 - SERVICES_PAN_WINDOW.start) / SERVICES_PAN_WINDOW.span);

        /* Crossfade. Only ever two layers are non-zero: the outgoing scene
           holds, hands over, and the incoming one holds — so boundaries
           dissolve instead of cutting.

           The window is measured against the *incoming* section's arrival on
           screen, not as a fraction of the outgoing section's height. See the
           note on XFADE_ENTER in scenes.ts for why. */
        const index = Math.min(SCENES.length - 1, Math.floor(s));
        const nextTop = tops[index + 1];
        const vh = window.innerHeight;
        const handover =
          nextTop === undefined
            ? 0
            : smoothRamp(
                y,
                nextTop - vh * XFADE_ENTER,
                nextTop - vh * XFADE_SETTLE
              );

        SCENES.forEach((scene, i) => {
          const o = i === index ? 1 - handover : i === index + 1 ? handover : 0;
          root.style.setProperty(scene.cssVar, o.toFixed(4));
        });

        /* Nav contrast follows the crossfade rather than the section boundary:
           the nav has to recolour when the painting behind it changes, which is
           the moment the handover passes halfway — not the moment the next
           section's top edge crosses the fold. */
        const framed = SECTION_IDS[handover > 0.5 ? index + 1 : index];
        if (framed && framed !== sceneRef.current) {
          sceneRef.current = framed;
          onSceneChange?.(framed);
        }

        /* Stop rendering the balloon once it is well clear of the story.
           Guarded by a ref so this does not call setState 60 times a second. */
        const shouldMount = s < BALLOON_UNMOUNT_AT;
        if (shouldMount !== balloonMountedRef.current) {
          balloonMountedRef.current = shouldMount;
          setBalloonMounted(shouldMount);
        }
      };

      /* How far the Services camera has to travel for its last row to clear the
         bottom of the pinned frame. That section centres its content, so half of
         any overflow hangs below the fold; that half plus a little slack is the
         distance. It is published as a custom property and spent by .track in
         Services.module.css, and only ever set while the pin is actually live —
         so the pan is inert on narrow screens and under reduced motion. */
      let measureServicesPan = () => {};
      /** The distance itself, in px. Zero whenever the pin is not running. */
      let servicesPan = 0;

      /* The one real pin, scoped to wide screens by gsap.matchMedia — which
         also tears it down cleanly when the viewport crosses the breakpoint. */
      const mm = gsap.matchMedia();
      if (SERVICES_PIN_EXTRA_VH > 0) {
        mm.add(`(min-width: ${PIN_MIN_WIDTH}px)`, () => {
          const servicesEl = document.getElementById("services");
          if (!servicesEl) return;

          measureServicesPan = () => {
            const track = servicesEl.querySelector<HTMLElement>(
              "[data-services-track]"
            );
            if (!track) return;
            const box = getComputedStyle(servicesEl);
            const needed =
              track.getBoundingClientRect().height +
              parseFloat(box.paddingTop) +
              parseFloat(box.paddingBottom);
            const pan = Math.max(
              0,
              (needed - window.innerHeight) / 2 + SERVICES_PAN_SLACK
            );
            servicesPan = Math.round(pan);
            servicesEl.style.setProperty("--services-pan", `${servicesPan}px`);
          };
          measureServicesPan();

          const pin = ScrollTrigger.create({
            trigger: servicesEl,
            start: "top top",
            end: () => `+=${window.innerHeight * SERVICES_PIN_EXTRA_VH}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          });

          return () => {
            pin.kill();
            measureServicesPan = () => {};
            servicesPan = 0;
            scrollProgress.pan = 0;
            servicesEl.style.removeProperty("--services-pan");
          };
        });
      }

      /* A document-spanning trigger used purely as a scroll callback that is
         already synchronised with the pin's layout. */
      const driver = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: update,
      });

      /* `refresh` fires after every trigger — the pin included — has
         recalculated, which is the only safe moment to read section offsets. */
      const onRefresh = () => {
        measure();
        measureServicesPan();
        update();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      measure();
      update();
      ScrollTrigger.refresh();

      cleanup = () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        driver.kill();
        mm.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduced, onSceneChange]);

  return (
    <div className={styles.stage} aria-hidden="true">
      <SceneBackdrop id="stage-backdrop" />
      {balloonMounted && <BalloonCanvas />}
    </div>
  );
}
