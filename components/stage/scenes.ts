import type { SectionId } from "@/lib/scrollProgress";

/**
 * The five painted backdrops, in journey order.
 *
 * They live in one fixed, full-viewport stage behind the whole page rather than
 * one background per section — that is what makes the balloon appear to travel
 * across a continuous sky instead of jumping between five separate pictures.
 *
 * `objectPosition` is the tuning knob here. The paintings are 16:9, so on a
 * portrait phone a lot of each one is cropped away; these values decide which
 * part survives. Landscape and portrait are set separately because the
 * interesting part of a picture moves when you rotate the crop.
 */
export type Scene = {
  id: SectionId;
  src: string;
  /** What the painting shows. Documentation only — the backdrop is decorative
   *  and hidden from assistive tech; the concept is described in the hero. */
  description: string;
  /** CSS custom property the Stage writes this layer's opacity into. */
  cssVar: string;
  /**
   * The legibility wash for THIS painting, positioned where THIS section's
   * copy sits.
   *
   * It lives on the scene rather than on the section on purpose: a wash
   * attached to a section would stay at full strength while its scene was
   * crossfading away, and the boundary would read as a hard horizontal line
   * drawn across the sky. Riding the layer's opacity, it arrives and leaves
   * exactly when its painting does.
   *
   * The alphas are measurements, not guesses. Text on the two dark scenes was
   * sampled against the actual rendered backdrop and came in around 2.3–3.0:1
   * before these were raised. Lower them and re-measure before you ship.
   */
  wash: string;
  /** object-position on wide screens. */
  position: string;
  /** object-position on narrow/portrait screens. */
  positionMobile: string;
};

export const SCENES: Scene[] = [
  {
    id: "home",
    src: "/scenes/hero-tree.png",
    description: "A lone tree on a grassy hill at sunrise, a rope swing hanging from one branch, under a teal sky.",
    cssVar: "--scene-hero-o",
    /* An ellipse over the copy, not a diagonal across the picture. A linear
       wash strong enough to carry 11px type at the top of the block was also
       dimming the tree and the balloon; this concentrates the same darkness on
       the lower left and falls away before it reaches either. Move the centre
       if you move the copy. */
    wash: `radial-gradient(ellipse 62% 78% at 18% 92%,
      rgb(var(--rgb-earth) / 0.62) 0%,
      rgb(var(--rgb-earth) / 0.46) 38%,
      rgb(var(--rgb-earth) / 0.2) 66%,
      transparent 88%)`,
    position: "50% 50%",
    // Keep the tree and the horizon glow in frame on a phone.
    positionMobile: "52% 62%",
  },
  {
    id: "about",
    src: "/scenes/about-mountains.png",
    description: "A snow-capped peak above receding blue mountain ridges, with a warm horizon behind them.",
    cssVar: "--scene-about-o",
    /* Two layers. The diagonal covers the prose in the upper left and leaves
       the peak and the balloon's corridor open on the right; the second is a
       band along the bottom for the three ascent marks, which run wide enough
       to reach the bright side of the painting. Neither touches the top right,
       where the balloon climbs. */
    wash: `linear-gradient(104deg,
        rgb(var(--rgb-earth) / 0.5) 0%,
        rgb(var(--rgb-earth) / 0.3) 40%,
        rgb(var(--rgb-earth) / 0.1) 66%,
        transparent 86%),
      linear-gradient(0deg,
        rgb(var(--rgb-earth) / 0.42) 0%,
        rgb(var(--rgb-earth) / 0.26) 24%,
        rgb(var(--rgb-earth) / 0.08) 40%,
        transparent 54%)`,
    position: "50% 50%",
    // Bias upward so the peak survives the portrait crop.
    positionMobile: "50% 42%",
  },
  {
    id: "services",
    src: "/scenes/services-clouds.png",
    description: "A sea of sunlit cloud tops stretching to a pale blue sky.",
    cssVar: "--scene-services-o",
    /* The clouds are bright but the darker bellies would swallow dark ink. */
    wash: `linear-gradient(180deg,
      rgb(255 255 255 / 0.3) 0%,
      rgb(255 255 255 / 0.48) 46%,
      rgb(255 255 255 / 0.26) 100%)`,
    position: "50% 50%",
    positionMobile: "50% 50%",
  },
  {
    id: "testimonials",
    src: "/scenes/testimonials-rays.png",
    description: "Golden light breaking through a bank of clouds in long rays.",
    cssVar: "--scene-rays-o",
    /* Concentrated behind the contact card, open at the corners so the rays
       themselves stay vivid. */
    wash: `radial-gradient(ellipse 72% 62% at 50% 50%,
      rgb(255 255 255 / 0.32) 0%,
      rgb(255 255 255 / 0.18) 62%,
      rgb(255 255 255 / 0) 100%)`,
    position: "50% 50%",
    // Keep the burst of light roughly behind the contact form.
    positionMobile: "50% 46%",
  },
  {
    id: "footer",
    src: "/scenes/footer-night.png",
    description: "A star field above night clouds, with a faint warm glow along the bottom.",
    cssVar: "--scene-night-o",
    /* Just enough darkness at the base to hold the footer's small print. */
    wash: `linear-gradient(180deg,
      transparent 0%,
      rgb(var(--rgb-night) / 0.38) 58%,
      rgb(var(--rgb-night) / 0.76) 100%)`,
    position: "50% 50%",
    positionMobile: "50% 40%",
  },
];

/* ── Crossfade shape ────────────────────────────────────────────────────────
   When one scene hands over to the next, measured in viewports of the INCOMING
   section rather than as a fraction of the outgoing one.

   That distinction matters more than it sounds. Sections differ a lot in height
   — About is one viewport on a desktop and nearly one and a half on a phone,
   where its three ascent marks stack. Keyed to a fraction of the outgoing
   section, the sky finished turning while that section's own copy was still
   mid-screen, and the cream ink written for the mountains ended up sitting on
   the bright cloud painting. Keyed to the incoming section's arrival, the
   handover lands in the same place on every screen.

   Both are distances back from the INCOMING section's top edge, measured in
   viewports: the crossfade runs from `ENTER` before that edge to `SETTLE`
   before it. The distance between them IS the length of the dissolve, and it
   is the one knob for how gradual the handover feels — 0.92 of a viewport of
   scroll here, up from the 0.7 this started at.

   Two limits, and between them there is not much room, which is why widening
   the dissolve means moving both ends rather than one:

     ENTER cannot exceed 1
       A section is a viewport tall, so its top edge appears at the BOTTOM of
       the screen exactly one viewport of scroll before it reaches the top.
       Setting ENTER above 1 reaches back further than that — past the top of
       the page at the first boundary, where it would leave the hero already
       part-way faded into the mountains before a single pixel has been
       scrolled. 1 is the moment the incoming section first appears, and that
       is as early as the sky can honestly start to turn.

     SETTLE cannot go far below 0.1
       This is where the fade finishes, and by then the incoming section has
       climbed most of the way up the screen. Its copy is written for its own
       painting — the cream ink of the mountains is unreadable on the bright
       cloud sea — so finishing much later than this leaves a section's own
       words sitting on the previous section's sky. Every section centres its
       content, which buys a little slack at the top of the box, and 0.08 spends
       most of it.

   Lengthen the dissolve further and you are trading against one of those two.
   Whichever you move, measure the incoming section's text contrast against the
   rendered backdrop partway through before shipping it. */
export const XFADE_ENTER = 1.0;
export const XFADE_SETTLE = 0.08;

/**
 * The floor under ENTER: how much of a section's OWN span it holds its sky
 * before the handover is allowed to start, as a fraction of that span.
 *
 * ENTER alone has a hole in it, and the hero falls straight through it. ENTER
 * reaches back one viewport from the incoming section's top edge — but the hero
 * and About are both `min-height: 100svh`, so their measured tops are exactly
 * one viewport apart, and `nextTop - vh * 1.0` lands on zero. The sky therefore
 * began turning at the first pixel of scroll: measured on a 695px viewport, the
 * hero was down to 0.55 opacity by y = 300, with its own copy still mid-screen.
 * Coming back up it re-formed over the mountains, and because the hero's hill is
 * far closer than the mountains' recessed one, the picture read as cropping in.
 *
 * Keyed to the section's own span rather than to a viewport, this only bites
 * where the span IS a viewport — which is the hero and nothing else. About,
 * Services and Testimonials measured 862 / 1401 / 902px against a 695px
 * viewport, so their starts are unchanged and the long dissolve argued for
 * above is preserved everywhere it already existed.
 */
export const XFADE_HOLD = 0.35;

/**
 * The shortest a dissolve may be, in viewports. Only reachable if HOLD and
 * SETTLE are pushed until they cross; it stops that from becoming a hard cut
 * rather than being a knob worth turning.
 */
export const XFADE_MIN = 0.15;
