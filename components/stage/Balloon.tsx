"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import { SRGBColorSpace, type Mesh, type MeshBasicMaterial } from "three";

import {
  BALLOON_EXIT,
  FOLLOW_LERP,
  IDLE,
  MOBILE_ADJUST,
  sampleBalloonPath,
} from "@/lib/balloonPath";
import { lerp, ramp, scrollProgress } from "@/lib/scrollProgress";

/** Aspect of public/balloon.png (424 × 586), cropped to the sprite's bounds. */
const SPRITE_ASPECT = 424 / 586;

/**
 * The balloon itself: one textured plane, driven every frame.
 *
 * Two motions are composited:
 *   1. the flight path, chased with a lerp so it lags the scrollbar slightly
 *      and reads as something being carried rather than dragged;
 *   2. a continuous idle float — bob, sway and a lagging tilt — which never
 *      stops, so the balloon is alive even on a still page.
 *
 * All of it happens inside useFrame against refs. This component never
 * re-renders after mount.
 */
export function Balloon() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  /* Where the balloon actually is, as opposed to where the path says it should
     be. The gap between the two is the float. */
  const current = useRef({ x: 0, y: 0, scale: 0.2, primed: false });

  /* The sprite is a finished painting, so it has to be read as sRGB or it comes
     out washed against the backgrounds it is meant to sit in. Applied through
     the loader callback rather than by mutating the hook's return value. */
  const texture = useTexture("/balloon.png", (loaded) => {
    const tex = Array.isArray(loaded) ? loaded[0] : loaded;
    tex.colorSpace = SRGBColorSpace;
  });

  const viewport = useThree((state) => state.viewport);

  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const t = state.clock.elapsedTime;
    const narrow = state.size.width < MOBILE_ADJUST.breakpoint;

    /* ── 1. Target from the flight path ───────────────────────────────── */
    const target = sampleBalloonPath(scrollProgress.journey);
    const targetX = narrow
      ? target.x * MOBILE_ADJUST.xFactor + MOBILE_ADJUST.xOffset
      : target.x;
    /* The services camera pans down inside its pin; the ledger rises, and the
       balloon rises with it so the corridor between them holds. Zero everywhere
       else, and on narrow screens the balloon has already left by then. */
    const targetY =
      (narrow
        ? target.y * MOBILE_ADJUST.yFactor + MOBILE_ADJUST.yOffset
        : target.y) + scrollProgress.pan;
    const targetScale = narrow
      ? target.scale * MOBILE_ADJUST.scaleFactor
      : target.scale;

    // On the very first frame, snap rather than easing in from the origin.
    if (!current.current.primed) {
      current.current = { x: targetX, y: targetY, scale: targetScale, primed: true };
    }

    current.current.x = lerp(current.current.x, targetX, FOLLOW_LERP);
    current.current.y = lerp(current.current.y, targetY, FOLLOW_LERP);
    current.current.scale = lerp(current.current.scale, targetScale, FOLLOW_LERP);

    /* ── 2. Idle float ────────────────────────────────────────────────── */
    const bob = Math.sin(t * IDLE.bobSpeed) * IDLE.bobAmount;
    const sway = Math.sin(t * IDLE.swaySpeed) * IDLE.swayAmount;
    // The envelope leans into the drift a beat after the basket moves.
    const tilt = Math.sin(t * IDLE.swaySpeed - IDLE.tiltLag) * IDLE.tiltAmount;
    const drift = Math.sin(t * IDLE.driftSpeed) * IDLE.driftAmount;

    /* ── 3. Commit ────────────────────────────────────────────────────── */
    mesh.position.x = (current.current.x + sway) * viewport.width;
    mesh.position.y = (current.current.y + bob) * viewport.height;
    mesh.position.z = drift;
    mesh.rotation.z = tilt;

    const height = current.current.scale * viewport.height;
    mesh.scale.set(height * SPRITE_ASPECT, height, 1);

    /* ── 4. Exit ──────────────────────────────────────────────────────────
       On a wide screen the balloon's story ends in the clouds and it fades out
       over the run-up to the testimonials. On a phone it leaves much earlier —
       right after the hero — because there is no strip of sky beside the copy
       for it to travel through. See MOBILE_ADJUST. */
    const exit = narrow ? MOBILE_ADJUST.exit : BALLOON_EXIT;
    material.opacity =
      1 - ramp(scrollProgress.section, exit.fadeStart, exit.fadeEnd);
    mesh.visible = material.opacity > 0.01;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        /* The sprite is already a finished painting — no tone mapping, no
           lighting model, or it stops matching the backgrounds. */
        toneMapped={false}
        depthWrite={false}
        opacity={1}
      />
    </mesh>
  );
}
