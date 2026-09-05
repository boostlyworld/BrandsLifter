/**
 * THE GLASS, AS ONE MATERIAL
 * ============================================================================
 * The optical parameters of every liquid-glass surface on the site: the nav
 * bar, the contact card, and whichever testimonial is open.
 *
 * These are liquid-glass-js's own knobs. The library models a real height field
 * and refracts what is behind it, so `scale` is genuine displacement in pixels
 * rather than a blur radius, and `edge` is a normal-based specular highlight
 * rather than a border.
 *
 * They are tuned against public/lg3.jpg — a near-clear body you can read
 * straight through, a bright specular arc, a whisper of colour split, and only
 * enough frost to soften what is behind it. The *rim* and the *bloom* are
 * deliberately not here: the library draws those as a box-shadow on an element
 * it appends to <body>, which cannot follow content or take a radius from it.
 * They live in the `.lg3` skin in app/globals.css instead, on the real elements.
 *
 * Two entries, not one, because the two surfaces have genuinely different
 * geometry — but every value that can be shared is shared, so the whole site
 * reads as one piece of glass.
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
   Shared by both surfaces. Change these to change the material everywhere. */
const MATERIAL = {
  scale: 34, // refraction strength (max edge displacement, px)
  curvature: 3.4, // squircle: the bend is concentrated close to the rim
  convexity: 1, // convex, so the edge magnifies
  chroma: 0.1, // the faint colour split visible along lg3's rim
  blur: 7, // lg3's interior is only slightly soft, not frosted
  glow: 0, // the bloom is CSS (.lg3 in globals.css), not a library shadow
  edge: 0.78, // the bright specular arc
  specAngle: 118,
} as const;

/**
 * The nav bar: a full-bleed strip whose left and right bezels run off the edges
 * of the screen. What you actually see is the bottom lip, so the bezel is kept
 * shallow — a deep one would push the curve halfway up a 62px bar.
 */
export const GLASS_BAR: GlassParams = {
  ...MATERIAL,
  depth: 20,
  tint: 0.05,
  tintColor: "#1d4a4c", // --c-deep-teal
};

/**
 * The contact card and the open testimonial: small panels seen whole, so the
 * bezel can reach further in before it meets itself.
 */
export const GLASS_PANEL: GlassParams = {
  ...MATERIAL,
  depth: 26,
  tint: 0.05,
  tintColor: "#fbf3e2", // --c-cream: these sit on a pale painting, not a dark one
};
