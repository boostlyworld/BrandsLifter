# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint — pass explicit paths, bare `eslint` scans the world
npm run assets     # one-time: crop the balloon sprite, copy the scenes into public/
```

There is no test suite. Verification on this project is visual and measured — see
**Verifying a change** below.

`npm run lint` with no arguments is slow enough to hit a timeout; use
`npx eslint app components lib content scripts`.

## What this is

A single-page marketing site for BrandsLifter, a web design and marketing
agency. A hot air balloon rises through five painted scenes as you scroll —
hill, mountains, cloud sea (where it stops), light rays, night sky — one per
section. The scroll narrative *is* the positioning argument; when a section's
layout and the balloon's altitude disagree, the narrative wins.

`PRODUCT.md` holds the confirmed product record: users, positioning, brand
commitments, and what is placeholder. `README.md` is written for the human
maintainer and covers the same architecture from a tuning angle.

## Architecture

### Two layers, and that is the whole thing

`app/page.tsx` renders exactly two things over each other:

- **`<Stage>`** — `position: fixed`, full viewport, `z-index: 0`. Holds the five
  painted backdrops and the balloon's WebGL canvas. Never scrolls.
- **`<main>`** — the five sections, ordinary scrolling content at `z-index: 1`.

That is what makes the balloon read as travelling across one continuous sky
rather than hopping between five pictures, and why the backgrounds hold still
through each section without any of them being pinned.

The only state crossing between them is which scene is framed, which the nav
needs to recolour itself.

### Section space

Everything downstream runs on one number, `scrollProgress.section`
(`lib/scrollProgress.ts`), a plain mutable module object rather than React
state — GSAP writes it up to 60×/s and `useFrame` reads it, so React must not be
involved:

```
0 = hero framed   1 = about   2 = services   3 = testimonials   4 = footer
```

Fractional values interpolate. Sections differ wildly in height and one is
pinned, so section space keeps the crossfades, the balloon, the nav ink and the
Services reveal stable when any section's content changes length.

`components/stage/Stage.tsx` owns the conversion and is the only place that
touches GSAP. There is exactly **one** `ScrollTrigger.pin`, on Services, scoped
to ≥768px via `gsap.matchMedia`.

### Non-obvious invariants

These each cost real time to rediscover:

- **Measure the pin-spacer, not the pinned element.** GSAP moves the spacer's
  padding from below the element to above it once you scroll past the pin, so
  reading `#services` directly makes the Services span collapse and the About
  span swallow the pin distance.
- **Scene opacities are CSS custom properties on `:root`, never inline styles.**
  `liquid-glass-js` refracts a *clone* of the backdrop; a clone inherits `:root`
  variables and so crossfades for free. Inline styles would freeze at clone time
  and need a re-clone every frame.
- **Legibility washes live on the scene, not the section** (`scenes.ts`). A wash
  attached to a section stays at full strength while its scene crossfades away,
  and the boundary reads as a hard line ruled across the sky.
- **The crossfade is keyed to the incoming section's arrival** (`XFADE_ENTER` /
  `XFADE_SETTLE`), not to a fraction of the outgoing section. About is one
  viewport on desktop and ~1.5 on a phone; keyed to a fraction, the sky finished
  turning while that section's own copy was still mid-screen. `XFADE_HOLD` is the
  floor under that: the hero's span IS one viewport, so `ENTER` alone put its
  handover at scroll 0 and the sky began turning on the first pixel.
- **The journey is damped, not tracked.** `scrollProgress.section` chases
  `sectionRaw` (`SCROLL_DAMPING` in `Stage.tsx`), so everything downstream eases.
  The balloon's own `FOLLOW_LERP` is the second filter in that chain and was
  retuned against it — change one and change the other, or the balloon's lag
  doubles.
- **Copy scrims must reach transparent inside their own box.** `.content::before`
  in Hero, `.intro::before` / `.marks::before` in About. Size the element
  generously and keep the gradient's transparent stop well inside it — a
  gradient still opaque at the element's edge draws a hard horizontal band
  across the painting. This is the trap in this codebase most likely to be
  reintroduced.
- **Measure the nav bar with `offset*`, not `getBoundingClientRect()`.** The bar
  translates off the top of the screen over the footer, and a rect taken during
  that transition reports a negative top and parks the glass there — the bar
  comes back on the way up and its glass does not.
- **A section's glass is only visible while its section is.** The lens and pane
  are fixed elements on `<body>`, positioned by a loop that stops when the
  section leaves; whatever position they last had is where they stay. Scroll up
  from the testimonials fast enough and the contact card's pane is left sitting
  on the hero.
- **The balloon's corridor is a contract between two files.** `BALLOON_PATH` x
  values and the `width` caps on `About .marks` and `Services .ledger` are tuned
  against each other. Widen either content block and the balloon starts crossing
  the copy; move a waypoint left and the same. Re-check at 1280, 1440 and 1920.
- **Content is never hidden by JavaScript alone.** The reveal only applies inside
  `[data-reveal-root]`, an attribute added at runtime by `lib/useReveal.ts`, so a
  slow or failed bundle leaves plain visible HTML. The hook also reveals anything
  already on screen at load outright, because the observer's negative bottom
  margin otherwise strands above-the-fold content forever.
- **`useReducedMotion` returns `null` until the first client render** — a third
  state meaning "don't start anything yet", so a WebGL canvas or ScrollTrigger is
  never mounted during SSR and torn down a frame later. It is a
  `useSyncExternalStore`, not `useEffect` + `setState`; the React Compiler lint
  rejects the latter.
- **Don't mutate values returned from hooks.** `react-hooks/immutability` will
  fail the build. Texture colour space is set through drei's `useTexture` loader
  callback, not by assigning to the returned texture.

### The three libraries

Each solves one problem:

- **react-three-fiber** (`components/stage/Balloon.tsx`) — one textured plane.
  Idle bob, sway and lagging tilt run continuously in `useFrame`; the flight path
  is chased with a lerp so it lags the scrollbar. No React state, no re-renders
  after mount. The canvas unmounts entirely once the balloon leaves the story.
- **liquid-glass-js** — three surfaces: the scrolled nav (`nav/GlassSurface`),
  the contact card and the open testimonial (`sections/SectionGlass`). Their
  optical parameters are one shared material in `lib/glassMaterial.ts`. The
  library appends its own fixed elements to `<body>` and positions them in
  screen coordinates, so both components render `null` and just measure their
  target — which is also why the library only ever supplies the *refraction*
  here. Its rim and bloom are a uniform box-shadow on an element behind the
  surface, half a frame out of date while the page scrolls; the real rim, sheen
  and bloom are the `--lg3-*` tokens in `globals.css`, drawn on the real
  elements. Falls back to CSS `backdrop-filter` under 900px, under reduced
  motion, or on import failure.
- **@shadergradient/react** (`components/sections/RayGlow.tsx`) — the glow behind
  the testimonials only. It bundles its own copy of three.js, so it is
  `next/dynamic` with `ssr: false` plus its own lazy-load observer, and blended
  into the painted rays with `mix-blend-mode: soft-light`.

GSAP is likewise imported on demand, and only when motion is allowed.

### Where to change things

| File | Owns |
|---|---|
| `app/globals.css` | Every colour, size, space, radius, duration |
| `lib/balloonPath.ts` | Flight path, idle float, mobile behaviour, exit |
| `content/site.ts` | Every string on the site |
| `components/stage/scenes.ts` | Scene↔section mapping, crops, washes, crossfade |
| `lib/glassMaterial.ts` | The glass: refraction, frost, specular, tint |

The palette was sampled pixel-by-pixel from the supplied paintings in `Scenes/`.
The comment on each token says which part of which painting it came from —
new colours should be drawn from there, not invented.

## Content and launch state

`content/site.ts` marks several items `PLACEHOLDER`: every testimonial and
attribution, the "ninety days minimum" commitment, the service scopes, and the
contact details. BrandsLifter is a real business, so these need sign-off or
replacement before launch. Never present them as verified.

**The contact form does not send anything.** It validates, shows a pending state
and shows the success state. `ContactForm.tsx` marks where to wire a real
destination. Until then the success copy tells a visitor of a real business that
their note was received when it was not.

## Verifying a change

The dev server compiles lazily — wait ~8s after `domcontentloaded` before
measuring anything, or you will record a page that has not hydrated.

- Screenshot and probe with Puppeteer driving the user's real Chrome. `page.screenshot({clip})`
  takes **document** coordinates; once the page is scrolled, a viewport-relative
  clip silently samples the wrong region. Capture the full frame and crop.
- Contrast has to be measured against the *rendered* backdrop (hide the text,
  screenshot, average), not against a CSS background value — the text sits on
  paintings. Check the element is settled (effective opacity 1) first, and don't
  measure mid-crossfade.
- `node ~/.claude/skills/impeccable/scripts/detect.mjs --json app components content`
  is the design detector; it should return `[]`. A hook in
  `.claude/settings.local.json` also runs it after UI edits and on stop.
- Check `prefers-reduced-motion: reduce` renders a complete site: no
  `.pin-spacer`, zero `<canvas>`, the static `img[src="/balloon.png"]` present.

## Version control

The working copy is pushed to GitHub automatically. A Stop hook in
`.claude/settings.json` runs `scripts/auto-push.mjs` when a turn ends: it stages
everything, makes one commit naming the files that moved, and pushes. So there
is normally no need to commit by hand, and the tree is normally clean.

It only ever adds — no pull, rebase, reset, force or amend — so it cannot lose
work or rewrite pushed history. Nothing to commit, no remote, or no network all
exit quietly; a failed push is reported and the commit is left safe locally.

To pause it, remove the hook from `.claude/settings.json`, or use `/hooks`.

## Known limitation

The source paintings are 1376×768 and go soft when stretched full-bleed on a
large display. Only regenerating them at 2× fixes this; nothing in code can
recover detail that is not there.
