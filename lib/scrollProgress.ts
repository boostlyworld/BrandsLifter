/**
 * The one piece of state the scroll journey shares.
 *
 * Deliberately a plain mutable module object rather than React state or a
 * context: GSAP writes to it up to 60 times a second and react-three-fiber
 * reads it inside useFrame. Routing that through React would re-render the
 * whole tree on every scroll tick, for nothing.
 */
export const scrollProgress = {
  /**
   * SECTION SPACE — the coordinate the whole scroll system runs on.
   *   0 = hero framed        1 = about framed       2 = services framed
   *   3 = testimonials framed 4 = footer framed
   * Fractional values interpolate between two sections, so 2.5 means "halfway
   * from services to testimonials". Section heights differ wildly and the
   * services section gets pinned, so measuring in section space rather than
   * pixels keeps every downstream number stable.
   */
  section: 0,
  /**
   * Where the scrollbar actually is, in the same coordinate. `section` chases
   * this rather than being set to it: the whole narrative — crossfades, the
   * balloon, the Services reveal — is eased toward the scrollbar instead of
   * tracking it 1:1, so it keeps moving for a few frames after a wheel notch
   * stops rather than halting with it.
   *
   * Only components/stage/Stage.tsx should write either of these. Everything
   * downstream reads `section` and inherits the easing for free.
   */
  sectionRaw: 0,
  /** Journey position for the balloon, 0–1. Derived from `section`. */
  journey: 0,
  /**
   * How far the services camera has currently panned, as a fraction of viewport
   * height, positive upward. The balloon adds it to its own position.
   *
   * The pan slides the ledger up inside the pin so the fourth row can arrive on
   * screen (see .track in Services.module.css). The balloon lives on the fixed
   * stage and knows nothing about that, so without this the ledger would climb
   * out from under it and straight through the one corner of that section the
   * balloon is allowed to rest in. Moving both together is also the honest
   * reading: if the camera pans down, everything in frame rises, balloon
   * included.
   */
  pan: 0,
};

/** Names in section-space order. Index matches the integer part of `section`. */
export const SECTION_IDS = [
  "home",
  "about",
  "services",
  "testimonials",
  "footer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A per-frame lerp rate, corrected for how long the frame actually took.
 *
 * `lerp(a, b, 0.12)` every frame is not one speed, it is one speed per display:
 * a 120Hz screen applies it twice as often and arrives twice as fast. This
 * converts a rate that means "0.12 at 60fps" into the fraction to use for a
 * frame of `dt` seconds, so the motion feels the same on every machine.
 */
export const damp = (rate: number, dt: number) => 1 - Math.pow(1 - rate, dt * 60);

/** Clamp to a range. */
export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));

/** Map `v` from [inMin, inMax] onto [0, 1], clamped. */
export const ramp = (v: number, inMin: number, inMax: number) =>
  clamp(inMax === inMin ? 0 : (v - inMin) / (inMax - inMin));

/** Smoothstep — a ramp with eased ends, for crossfades that do not click. */
export const smoothRamp = (v: number, inMin: number, inMax: number) => {
  const t = ramp(v, inMin, inMax);
  return t * t * (3 - 2 * t);
};
