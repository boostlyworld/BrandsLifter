/**
 * BALLOON TUNING FILE
 * ============================================================================
 * Everything about how the balloon flies lives here. Nothing in this file is
 * layout logic — change any number and the only thing that changes is the
 * balloon's behaviour.
 *
 * The journey, in one sentence: the balloon sits beside the tree in the hero,
 * rises past the mountains through About, arrives in the sea of clouds at
 * Services — and STOPS there. It never climbs into the light-rays or night-sky
 * sections; those are content, not journey.
 *
 * Coordinates are FRACTIONS OF THE VIEWPORT, not pixels or world units:
 *   x: -0.5 = left edge, 0 = centre, +0.5 = right edge
 *   y: -0.5 = bottom edge, 0 = centre, +0.5 = top edge
 * Balloon.tsx multiplies them by the live three.js viewport, so the path holds
 * its shape on a phone and on an ultrawide without re-tuning.
 */

export type BalloonWaypoint = {
  /** Position along the journey, 0 = top of the hero, 1 = balloon parked. */
  at: number;
  /** Horizontal position as a fraction of viewport width. */
  x: number;
  /** Vertical position as a fraction of viewport height. */
  y: number;
  /** Height of the balloon as a fraction of viewport height, before BALLOON_SCALE. */
  scale: number;
};

/**
 * The flight path. Keep `at` ascending. Values between waypoints are eased and
 * interpolated, so four or five points is plenty — more points make the path
 * fussier, not smoother.
 */
export const BALLOON_PATH: BalloonWaypoint[] = [
  // Hero — tethered beside the tree, low against the hill.
  { at: 0.0, x: 0.19, y: -0.26, scale: 0.185 },
  // Clearing the treeline, still over the hero.
  { at: 0.26, x: 0.1, y: -0.1, scale: 0.2 },
  // Swings right BEFORE About is framed (which happens at about 0.44), because
  // the prose and the three ascent marks together occupy the left ~72% of that
  // section. Everything from here on has to stay right of that or the balloon
  // crosses the copy on its way past.
  { at: 0.44, x: 0.3, y: 0.06, scale: 0.222 },
  // About / mountains — level with the snowline, and the largest the balloon
  // ever gets. The ceiling is set two waypoints down, not here: it must not
  // then visibly shrink on its way into the clouds.
  { at: 0.7, x: 0.31, y: 0.2, scale: 0.235 },
  // The crest, as it rises into the cloud sea.
  { at: 0.86, x: 0.315, y: 0.3, scale: 0.233 },
  // Services / clouds — PARKED, in the open sky above and to the right of the
  // ledger. It settles slightly rather than stopping dead.
  //
  // THIS WAYPOINT SETS THE CEILING FOR THE WHOLE PATH. The band it has to fit
  // inside is the gap between the bottom of the nav and the top of the services
  // ledger — a little over 300px on a 900-tall viewport, and less on a short
  // one. Any bigger and the basket sits on row 01's copy and its "2–4 WEEKS"
  // meta column. Everything above is sized so the balloon never has to shrink
  // to arrive here, which is why the About waypoint is not larger still.
  { at: 1.0, x: 0.325, y: 0.25, scale: 0.23 },
];

/**
 * OVERALL BALLOON SIZE — the one knob.
 *
 * The waypoint `scale` values above describe the *shape* of the climb (the
 * balloon grows as it rises); this multiplies all of them at once, so making the
 * balloon bigger or smaller everywhere is a single number rather than five.
 *
 * Applied inside sampleBalloonPath, which is the only place the path is read —
 * so MOBILE_ADJUST.scaleFactor still composes on top of it.
 */
export const BALLOON_SCALE = 1.45;

/**
 * Idle float — the react-three-fiber part of the brief. Runs continuously and
 * independently of scroll, so the balloon is alive even when the page is still.
 * Two sine waves at unrelated speeds keep it from looking like a metronome.
 */
export const IDLE = {
  /** Vertical bob. Amplitude is in the same viewport fractions as the path. */
  bobSpeed: 0.55,
  bobAmount: 0.018,
  /** Horizontal sway — slower and shallower than the bob. */
  swaySpeed: 0.37,
  swayAmount: 0.011,
  /** Tilt, in radians, lagging the sway so the envelope leans into the drift. */
  tiltAmount: 0.05,
  tiltLag: 1.35,
  /** Slow breathing on the depth axis; adds parallax without obvious scaling. */
  driftSpeed: 0.23,
  driftAmount: 0.06,
};

/**
 * How hard the balloon chases its scroll target each frame, 0–1.
 * Lower = floatier and laggier. Higher = locked to the scrollbar.
 *
 * This is now the SECOND filter in a chain, not the only one: scrollProgress
 * .section is itself eased toward the scrollbar (SCROLL_DAMPING in Stage.tsx),
 * so the balloon lags a target that is already lagging. Two first-order filters
 * in series add their time constants, so keeping the balloon's total lag where
 * it was tuned means this one has to tighten by exactly what the damping added:
 * 1/0.075 ≈ 13.3 frames before, and 1/0.12 + 1/0.2 ≈ 13.3 frames now. The feel
 * is fractionally softer at the start of a move, which is the point, and no
 * laggier overall, which is not something to change by accident. Retune the
 * damping and this has to move with it.
 */
export const FOLLOW_LERP = 0.2;

/**
 * Narrow screens get a different balloon.
 *
 * The desktop path works because every section leaves a strip of sky beside its
 * copy for the balloon to climb through. On a phone there is no such strip —
 * the prose, the ascent marks and the services ledger all run the full width —
 * so the same path would drag the balloon across the text on every section.
 *
 * So on a phone the balloon is the hero's character and nothing more: it floats
 * beside the tree, and leaves as the About section arrives. The journey is a
 * wide-screen affordance, and pretending otherwise would cost legibility on the
 * device most people will actually read this on.
 *
 * Each waypoint is transformed as: x * xFactor + xOffset, y * yFactor + yOffset.
 */
export const MOBILE_ADJUST = {
  /** Below this viewport width (px) all of the below applies. */
  breakpoint: 768,
  xFactor: 0.9,
  /** Nudges the path right, off the tree and away from the copy. */
  xOffset: 0.06,
  /** Compresses the climb — the full range would fly off the top of a phone. */
  yFactor: 0.55,
  yOffset: 0.16,
  scaleFactor: 0.72,
  /** Section-space fade-out. Runs during the hero-to-About handover. */
  exit: { fadeStart: 0.55, fadeEnd: 0.9 },
};

/**
 * Where the balloon leaves the story.
 *
 * Both numbers are in SECTION SPACE, the shared coordinate the whole scroll
 * system runs on: 0 = hero framed, 1 = about framed, 2 = services framed,
 * 3 = testimonials framed, 4 = footer framed.
 *
 * So: the balloon holds its parked position through Services, then fades out
 * over the run-up to Testimonials — it is completely gone before that section
 * is even half on screen, as the brief asks. Past fadeEnd its canvas
 * stops rendering altogether, so the light-rays and footer scenes cost no GPU.
 */
export const BALLOON_EXIT = { fadeStart: 2.42, fadeEnd: 2.66 };

/**
 * How section space maps onto journey position (the 0–1 the flight path uses).
 * The balloon reaches the parked waypoint (at: 1) a little way into the Services
 * section rather than exactly at its top, so it visibly settles on arrival.
 */
export const JOURNEY_SPAN = 2.3;

/* ── Interpolation helpers ───────────────────────────────────────────────── */

const scaled = (w: BalloonWaypoint) => ({
  x: w.x,
  y: w.y,
  scale: w.scale * BALLOON_SCALE,
});

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Sample the flight path at a journey position (0–1).
 * Clamps outside the range rather than extrapolating, so the balloon parks
 * instead of flying off when the user overscrolls.
 */
export function sampleBalloonPath(progress: number): Omit<BalloonWaypoint, "at"> {
  const p = Math.min(1, Math.max(0, progress));
  const path = BALLOON_PATH;

  if (p <= path[0].at) return scaled(path[0]);
  if (p >= path[path.length - 1].at) return scaled(path[path.length - 1]);

  let i = 0;
  while (i < path.length - 2 && path[i + 1].at < p) i += 1;

  const a = path[i];
  const b = path[i + 1];
  const span = b.at - a.at;
  const t = easeInOut(span === 0 ? 0 : (p - a.at) / span);

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    scale: (a.scale + (b.scale - a.scale) * t) * BALLOON_SCALE,
  };
}
