import type { LiquidGlass } from "liquid-glass-js";

/**
 * liquid-glass-js builds two fixed-position elements per instance and appends
 * them straight to <body>: `.lqg-lens`, which carries the refracted clone of the
 * background, and `.lqg-glass`, which adds the frost, tint and specular
 * highlight on top of it. Neither lives inside any React tree, so showing,
 * hiding or restyling the glass means reaching for them directly.
 *
 * The library keeps both on the instance but does not declare them in its type
 * definitions, so this is the one place that cast is made. Reach for them this
 * way rather than with `document.querySelector(".lqg-lens")`: this site now runs
 * more than one instance — the nav bar, the contact card, and the open
 * testimonial — and a document-wide query returns whichever happens to have been
 * appended first, which is not necessarily yours.
 */
type LiquidGlassInternals = {
  lensEl?: HTMLElement;
  glassEl?: HTMLElement;
};

export function glassElements(glass: LiquidGlass): HTMLElement[] {
  const internals = glass as unknown as LiquidGlassInternals;
  return [internals.lensEl, internals.glassEl].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
}
