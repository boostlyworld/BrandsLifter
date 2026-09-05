/**
 * THE GLASS, AS A LIVE SETTING
 * ============================================================================
 * The optical parameters of the two liquid-glass surfaces in the testimonials
 * section — the contact card, and whichever review is open. The nav's glass is
 * deliberately NOT driven from here: it is a different surface doing a
 * different job (a full-bleed strip whose bezels run off the edges of the
 * screen), and it keeps its own constants in components/nav/GlassSurface.tsx.
 *
 * A mutable module object with a subscribe list rather than React state, for
 * the same reason as lib/scrollProgress.ts: it is read inside a render loop and
 * written by a dragged slider, and putting React in the middle of that would
 * re-render the section on every frame of the drag for nothing.
 *
 * The tuner that writes to it (components/dev/GlassTuner.tsx) only exists in
 * development. In a production build nothing ever calls setGlassSettings, and
 * these defaults are simply the values the site ships with — so tune them on
 * screen, hit Copy settings, and paste the result over GLASS_DEFAULTS below.
 */

/** Every knob liquid-glass-js exposes, minus the ones we own (size, position). */
export type GlassParams = {
  scale: number;
  depth: number;
  curvature: number;
  convexity: number;
  chroma: number;
  blur: number;
  glow: number;
  edge: number;
  specAngle: number;
  tint: number;
  tintColor: string;
};

/* ── Tuning ─────────────────────────────────────────────────────────────────
   Deliberately the nav's numbers with two changes, so the whole site reads as
   one material — a deeper bezel, because these are small panels seen whole
   rather than a strip whose bezels run off the edges of the screen, and a
   little more frost, since there is type sitting directly on them. */
export const GLASS_DEFAULTS: GlassParams = {
  scale: 26, // refraction strength (max edge displacement, px)
  depth: 34, // how far the curved bezel reaches in from the edge
  curvature: 2.6, // ~2 spherical, ~4 squircle
  convexity: 1, // convex, so the edge magnifies
  chroma: 0.06, // a whisper of chromatic aberration; more looks like a bug
  blur: 18, // the frost
  glow: 0.06,
  edge: 0.42, // specular highlight strength
  specAngle: 118,
  tint: 0.1,
  tintColor: "#fbf3e2", // --c-cream: these sit on a pale painting, not a dark one
};

/**
 * What the tuner draws, in the order it draws it. Ranges are the library's own
 * documented bounds (see its README's parameter table), widened only where the
 * documented range is a suggestion rather than a limit — `depth` and `blur` are
 * plain pixels with no ceiling of their own.
 */
export const GLASS_CONTROLS = [
  { key: "scale", label: "Refraction", min: 0, max: 90, step: 1, hint: "Max edge displacement, px" },
  { key: "depth", label: "Bezel depth", min: 0, max: 120, step: 1, hint: "How far the curve reaches in" },
  { key: "curvature", label: "Curvature", min: 1.2, max: 6, step: 0.05, hint: "~2 spherical, ~4 squircle" },
  { key: "convexity", label: "Convexity", min: -1, max: 1, step: 0.05, hint: "+1 magnifies, −1 shrinks" },
  { key: "chroma", label: "Chromatic", min: 0, max: 0.6, step: 0.01, hint: "Colour fringing at the edge" },
  { key: "blur", label: "Frost", min: 0, max: 40, step: 1, hint: "Backdrop blur, px" },
  { key: "glow", label: "Glow", min: 0, max: 1, step: 0.01, hint: "Inner/outer bloom" },
  { key: "edge", label: "Specular", min: 0, max: 1, step: 0.01, hint: "Highlight strength" },
  { key: "specAngle", label: "Light angle", min: 0, max: 360, step: 1, hint: "Degrees" },
  { key: "tint", label: "Tint", min: 0, max: 1, step: 0.01, hint: "Opacity of the tint colour" },
] as const satisfies readonly {
  key: Exclude<keyof GlassParams, "tintColor">;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}[];

let current: GlassParams = { ...GLASS_DEFAULTS };
const listeners = new Set<(params: GlassParams) => void>();

/** The values in force right now. */
export function getGlassSettings(): GlassParams {
  return current;
}

/** Change one or more, and tell every live surface about it. */
export function setGlassSettings(partial: Partial<GlassParams>) {
  current = { ...current, ...partial };
  listeners.forEach((listener) => listener(current));
}

/** Back to what the site ships with. */
export function resetGlassSettings() {
  setGlassSettings(GLASS_DEFAULTS);
}

/** Returns its own unsubscribe, so an effect can just return it. */
export function subscribeGlass(listener: (params: GlassParams) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
