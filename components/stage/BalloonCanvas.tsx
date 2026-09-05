"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

import { Balloon } from "./Balloon";
import styles from "./BalloonCanvas.module.css";

/* ── Tuning ─────────────────────────────────────────────────────────────────
   Camera. A perspective camera rather than orthographic so the balloon's slow
   drift on the z axis produces a real, if tiny, change in size. Raise the fov
   or pull the camera back and the flight path keeps its shape — waypoints are
   fractions of the viewport, not world units. */
const CAMERA = { fov: 50, position: [0, 0, 5] as [number, number, number] };

/** Cap the device pixel ratio. Retina at 3x costs a lot for one sprite. */
const DPR: [number, number] = [1, 2];

/**
 * The WebGL shell for the balloon.
 *
 * Under `prefers-reduced-motion` no canvas is created at all: the same sprite
 * is rendered as a plain image, parked beside the tree. That is both the
 * accessible answer and the cheap one.
 */
export function BalloonCanvas() {
  const reduced = useReducedMotion();

  // Undecided on the first paint — render nothing rather than mounting a
  // canvas we might have to tear straight back down.
  if (reduced === null) return null;

  if (reduced) {
    /* Deliberately a plain <img>, not next/image: this is a decorative sprite
       sized in viewport units inside a fixed stage, so the optimiser's layout
       and sizing machinery buys nothing and only complicates the positioning. */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/balloon.png"
        alt=""
        className={styles.staticBalloon}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={styles.canvasWrap}>
      <Canvas
        camera={CAMERA}
        dpr={DPR}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        /* The stage is decorative and already aria-hidden; nothing here should
           be reachable by keyboard or pointer. */
        tabIndex={-1}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <Balloon />
        </Suspense>
      </Canvas>
    </div>
  );
}
