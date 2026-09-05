# BrandsLifter

A single-page, scroll-driven site for a web design and marketing agency. A hot
air balloon lifts from a lone tree and rises through five painted scenes —
hill, mountains, cloud sea, light rays, night sky — one per section of the site.
It stops in the clouds. That is the argument the page is making, rendered
literally.

```bash
npm install
npm run assets   # one-time: crops the balloon sprite, copies the scenes
npm run dev      # http://localhost:3000
```

---

## Where to change things

Three files carry almost everything you will want to hand-tune. Nothing here is
clever; it is all named constants with comments saying what they control.

| File | Owns |
|---|---|
| **`app/globals.css`** | Every colour, size, space, radius and duration. The seven palette colours were sampled out of the actual paintings — the comment on each says which part of which. |
| **`lib/balloonPath.ts`** | The balloon: its flight path, its idle bob and sway, how hard it chases the scroll, where it leaves, and how all of that changes on a phone. |
| **`content/site.ts`** | Every string on the site. |

Two more, less often:

| File | Owns |
|---|---|
| `components/stage/scenes.ts` | Which painting belongs to which section, how each is cropped on desktop and on mobile, its legibility wash, and the crossfade timing between scenes. |
| `lib/glassMaterial.ts` | The optical parameters of every glass surface — refraction, frost, chromatic aberration, specular, tint. The rim, sheen and bloom that go on top of them are the `--lg3-*` tokens in `app/globals.css`. |

> **Before launch:** `content/site.ts` marks several items `PLACEHOLDER`. Every
> testimonial, the client names, the "ninety days minimum" commitment, and the
> contact details were written to be *believable*, not *true*. Replace or
> approve each one. `PRODUCT.md` records why.

---

## How the scroll works

There is one **stage** — `position: fixed`, full viewport, behind everything —
holding the five paintings and the balloon's WebGL canvas. The five sections are
ordinary scrolling content on top of it.

That is what makes the balloon read as travelling across one continuous sky
rather than hopping between five separate pictures. It also means the
backgrounds hold still through each section without any of them being pinned.

Everything downstream runs on one number, **section space** (`lib/scrollProgress.ts`):

```
0 = hero framed   1 = about   2 = services   3 = testimonials   4 = footer
```

Fractional values interpolate. Sections differ wildly in height and one is
pinned, so measuring in section space rather than pixels keeps the scene
crossfades, the balloon's position, the nav's ink colour and the Services
reveal all stable when any section's content changes length.

**One section is genuinely pinned**: Services, for `SERVICES_PIN_EXTRA_VH` of a
viewport (`components/stage/Stage.tsx`), while its four offerings arrive one at
a time and the balloon settles into the clouds. The pin is dropped below 768px.

### The three libraries, and what each is actually for

- **react-three-fiber** renders the balloon as one textured plane. Its idle bob,
  sway and lagging tilt run continuously in `useFrame`, so it is alive on a
  still page; the flight path is chased with a lerp so it lags the scrollbar and
  reads as carried rather than dragged. No React state is involved in either.
- **liquid-glass-js** is the refraction under three surfaces: the scrolled nav,
  the contact card, and whichever testimonial is open. It refracts a *clone* of
  the backdrop — which is why every scene opacity is a CSS custom property on
  `:root` rather than an inline style: the clone inherits those variables and so
  crossfades along with the original for free. It is also why `Stage.tsx` will
  not write one of those variables twice with the same value; each write re-runs
  a full-viewport SVG filter over five cloned paintings, once per live lens.
  Everything you actually *see* at the edge of a glass surface — the rim, the
  sheen, the bloom — is CSS on the real element, not the library.
- **@shadergradient/react** is the animated glow behind the testimonials only.
  It bundles its own copy of three.js, so it is loaded through `next/dynamic`
  with `ssr: false` and its own lazy-load observer, and blended into the painted
  rays with `mix-blend-mode: soft-light` rather than laid on top of them.

---

## The parts that will surprise you

- **Section washes live on the scene, not the section** (`scenes.ts`). A wash
  attached to a section stays at full strength while its scene is crossfading
  away, and the boundary reads as a hard line ruled across the sky.
- **The crossfade is measured against the incoming section's arrival**
  (`XFADE_ENTER` / `XFADE_SETTLE`), not as a fraction of the outgoing one.
  Sections differ a lot in height — About is one viewport on a desktop and
  nearly one and a half on a phone — and keyed to a fraction, the sky finished
  turning while that section's own copy was still mid-screen. If you retune
  these, check the incoming section's text contrast partway through the
  handover.
- **The About marks and the Services ledger both stop short of the right edge.**
  That strip of sky is the corridor the balloon climbs through. Widen either and
  the balloon will start crossing the copy.
- **On a phone the balloon leaves after the hero.** No section leaves a free
  corridor at 390px, so rather than dragging it across the text the balloon
  stays the hero's character and fades out. See `MOBILE_ADJUST`.
- **Content is never hidden by JavaScript alone.** The reveal animation only
  applies inside a `[data-reveal-root]`, an attribute added by `lib/useReveal.ts`
  at runtime — so a slow or failed bundle leaves plain, visible HTML.
- **The contact form does not send anything.** It validates, shows a pending
  state and shows the success state. `components/sections/ContactForm.tsx` says
  exactly where to wire a real destination. Until you do, the success message
  tells a visitor of a real business that you have their note when you do not —
  wire it or pull the section before launch.
- **The nav's Contact pill is the only persistent route to the form.** Without
  it, a visitor convinced at Services has to remember a button from the hero or
  scroll to the bottom. On phones the Home link is dropped so it fits; the
  wordmark is already the link home. The bar is measured to fit down to 360px —
  a sixth item will break that width first.
- **`scroll-behavior` is `auto`, deliberately.** Over five thousand pixels,
  native smooth scrolling turns an anchor click into a multi-second scrub
  through every scene.

---

## Accessibility

`prefers-reduced-motion: reduce` yields a complete, coherent site: no GSAP, no
pin, no scroll-scrubbing, no WebGL. The backdrop swaps per section on an
IntersectionObserver, the balloon becomes a still image, and sections fade in.

Focus is visible on every interactive element (`--c-lift`, with a dark halo so
it survives the bright cloud and light-ray scenes as well as the dark ones).

## Known limitation

The source paintings are 1376×768. Stretched full-bleed they are soft on a
large display. Regenerating them at 2× is the only fix; nothing in the code can
recover detail that is not there.
