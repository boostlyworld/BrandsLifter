# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-specified, not delegated: Next.js (App Router) + React on Node/npm, styled with plain CSS Modules and CSS custom properties. Three libraries are pinned by the brief and each must earn its place rather than be applied decoratively:

- `@react-three/fiber` — the hot air balloon's idle bob/sway, so it reads as floating rather than CSS-animated.
- `liquid-glass-js` — the nav bar's scrolled state only, for real frosted/liquid translucency.
- `@shadergradient/react` — the testimonials/light-rays section only, as a volumetric glow behind the content.

GSAP + ScrollTrigger drives the scroll journey. Language is TypeScript (confirmed). No CSS framework.

## Users

Mixed and deliberately so (confirmed): founders and owner-operators at small-to-mid companies who can describe their business perfectly out loud and not at all on their homepage, *and* marketing leads at larger companies who buy agency work regularly and evaluate on proof and process. Copy must land for both, so it stays plain and concrete rather than either folksy or procurement-flavored.

The job in both cases is the same: evaluating whether this agency is worth a first conversation, usually in a single scroll-through, often on a phone, often comparison-shopping against two or three other agencies in the same sitting.

## Product Purpose

BrandsLifter is a working web design and marketing agency (confirmed: a real business, not a spec build). The site is its single-page shopfront. Success is one thing only: a qualified inbound enquiry through the contact form. Everything else on the page exists to earn that.

## Positioning

The site's own argument is the differentiator: the agency's three disciplines are sequential, not a menu. Positioning is settled before design starts, the build is handed over as a system the client's own team can extend, and the engagement continues past launch rather than ending at it. A neighboring agency selling "web design, branding, and marketing" as three parallel checkboxes could not truthfully make the sequencing claim.

## Operating Context

Visitors arrive cold, scroll once, and decide. The site is a scroll-driven narrative: a hot air balloon lifts from a lone tree and rises through five scenes — hill, mountains, clouds (where it stops), light rays, night sky — each mapped to a section. The balloon's ascent *is* the positioning argument rendered literally; it stops at the clouds because that is the peak, both physically and narratively.

Consequences that constrain every later decision: the nav sits over five very different backgrounds and must stay legible on all of them; the whole page is one scroll with no internal navigation to fall back on; and the experience must degrade to something coherent on a phone and under `prefers-reduced-motion`.

## Capabilities and Constraints

- Single page, five sections: Hero, About Us, Services, Testimonials + Contact, Footer. No other routes.
- The contact form is client-side only for this build (confirmed): validation plus a success state, no network call and no backend. Wiring it to a real destination is a deliberate later decision.
- Five painterly background scenes and one alpha-channel balloon sprite exist in `Scenes/try1/` and are the fixed visual language. They are 1376×768 — soft when stretched full-bleed on a large display, and regenerating at 2× is an open item.
- The codebase will be hand-tuned extensively after this build. Every color, spacing, size, and animation timing that is not core layout logic must be a named, commented CSS custom property or exported constant. Locatability outranks cleverness.
- No CMS, no analytics, no third-party embeds established.

## Brand Commitments

Binding, all user-specified:

- Name and wordmark: **BrandsLifter**, plain text, no logo mark.
- Typefaces: Aboreto (headings, wordmark), Arapey italic (accent text, the word "Lift", testimonial quotes), Work Sans 400/500/600/700 (body, form, nav).
- The painterly teal-green-to-warm palette of the supplied scenes is the established visual language. Any new color must be drawn from it, not introduced arbitrarily.
- The hero heading is fixed: "Lift your brand / from the ground up", with "Lift" set in Arapey italic in a neon accent.
- One dominant CTA ("Contact Us") with "See Our Work" strictly subordinate to it.

## Evidence on Hand

Real: the six scene and sprite assets in `Scenes/try1/`, and the name.

**Absent and not to be fabricated as fact.** There are no real testimonials, client names, case studies, metrics, or press. The brief asks for believable testimonial copy, so this build ships invented quotes with invented attributions, plus service descriptions and the "90 days minimum" retainer claim, all as placeholder. Because BrandsLifter is a real business, every one of these is collected in `content/site.ts` and flagged as requiring the owner's sign-off or replacement before launch. No future work may treat them as verified.

Contact details are placeholders by decision: `hello@brandslifter.com` and placeholder social links, to be swapped.

## Product Principles

1. **The enquiry is the only conversion.** Any element that does not move a cold visitor toward the contact form is decoration and must justify itself.
2. **The ascent is the argument.** The scroll narrative carries the positioning; when a section's layout and the balloon's altitude disagree, the narrative wins.
3. **Legible over every scene.** Five wildly different backgrounds sit behind the same chrome. Contrast is handled per scene, never averaged into one compromise.
4. **Built to be hand-tuned.** The person who edits this next is the owner, not its author. Named tokens and one obvious place per concern beat clever abstraction.
5. **Claim nothing unearned.** With no real proof on hand, copy stays specific about method and honest about the absence of case studies.

## Accessibility & Inclusion

- `prefers-reduced-motion: reduce` must yield a coherent, complete site: sections fade in, no pinning, no scroll-scrubbing.
- Visible keyboard focus states on every interactive element; semantic HTML throughout.
- Fully responsive to mobile; scroll-pinning simplifies or disables rather than breaking layout.
