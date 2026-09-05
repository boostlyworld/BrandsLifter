"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

import { useReducedMotion } from "@/lib/useReducedMotion";

import styles from "./Testimonials.module.css";

/* ── Tuning ─────────────────────────────────────────────────────────────────
   The animated glow behind the testimonials. Its whole job is to make the
   painted light rays look like they are actually moving through the air, so the
   colours are pulled straight out of that painting rather than chosen freshly:
   the bright core, the warm band either side of it, and one cool note so the
   warmth has something to sit against. */
const GLOW = {
  color1: "#fef7da", // sampled from the centre of the sunburst
  color2: "#f4cda3", // --c-horizon, the warm band
  color3: "#a4c1e0", // sampled from that painting's own blue sky — a cool
  //                   note so the warmth has something to sit against.
  //                   The mint accent was tried here and cast green.
  /** Speed of the drift. Slow: this is atmosphere, not a screensaver. */
  uSpeed: 0.16,
  uStrength: 2.6,
  uDensity: 1.1,
  uFrequency: 5.5,
  /** Camera. Wide and close so the gradient fills the frame with no seams. */
  cDistance: 3.4,
  cPolarAngle: 115,
  cAzimuthAngle: 180,
  cameraZoom: 9.1,
  brightness: 1.25,
};

/**
 * The volumetric glow behind the testimonials and contact form.
 *
 * Loaded through next/dynamic with `ssr: false` from Testimonials.tsx —
 * @shadergradient/react bundles its own copy of three.js, so it must not be
 * anywhere near the first payload. `lazyLoad` is the library's own
 * IntersectionObserver: the WebGL context is not created until the section is
 * genuinely close to the viewport.
 *
 * Under reduced motion this renders nothing at all; the painted rays already
 * carry the section on their own.
 */
export default function RayGlow() {
  const reduced = useReducedMotion();
  if (reduced !== false) return null;

  return (
    <div className={styles.glow} aria-hidden="true">
      <ShaderGradientCanvas
        style={{ position: "absolute", inset: 0 }}
        pixelDensity={1}
        fov={40}
        pointerEvents="none"
        lazyLoad
        rootMargin="200px"
        powerPreference="low-power"
      >
        <ShaderGradient
          control="props"
          type="waterPlane"
          animate="on"
          /* 3d lighting rather than an environment preset: `env` would fetch an
             HDR map from a CDN, and this page has enough to download. */
          lightType="3d"
          grain="off"
          {...GLOW}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
