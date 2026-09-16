"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { TESTIMONIALS, type Testimonial } from "@/content/site";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useReveal } from "@/lib/useReveal";

import { ContactForm } from "./ContactForm";
import { SectionGlass, type GlassMode } from "./SectionGlass";
import styles from "./Testimonials.module.css";

/* @shadergradient/react bundles its own copy of three.js, so it is kept well
   away from the first payload and never rendered on the server. */
const RayGlow = dynamic(() => import("./RayGlow"), { ssr: false });

/**
 * How large each testimonial opens, as a fraction of --open-cap (which is
 * itself sized against the column the circles have to fit inside — see
 * Testimonials.module.css). Two sizes on purpose: four identical circles in two
 * columns is a grid, and a grid is the thing this layout is trying not to be.
 *
 * Desktop only. The stack below 1025px sizes every card alike.
 */
const OPEN_SCALES = [1, 0.86, 0.86, 1];

/**
 * How long the circle takes to expand. The glass waits this out before fading
 * in, so it lands on a finished circle instead of blooming at full diameter
 * around a disc that is still growing. Matches the transition in the CSS.
 */
const EXPAND_MS = 460;

/**
 * Below this the orbit becomes a horizontal stack of cards: one scroll rail,
 * snap points, tap to expand. A circle wide enough to hold a sentence does not
 * fit, and there is no pointer to open it with.
 *
 * It is the breakpoint and not the input type on purpose — a desktop window
 * dragged this narrow gets the stack, and would otherwise be left hovering
 * cards that are laid out to be tapped.
 */
const STACK_QUERY = "(max-width: 1024px)";

export function Testimonials() {
  const ref = useReveal<HTMLElement>();

  /* One piece of state drives hover, focus and tap alike. It has to be state
     rather than a CSS `:hover` rule for two reasons: `aria-expanded` has to
     stay truthful, and the glass has to know which circle to aim at. */
  const [open, setOpen] = useState<number | null>(null);
  const [glassMode, setGlassMode] = useState<GlassMode>("css");

  /* Which layout is running. Only ever used to choose event handlers, never to
     decide what is in the DOM — see lib/useMediaQuery.ts. */
  const stack = useMediaQuery(STACK_QUERY);

  const formRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const glassBoxes = useRef<(HTMLElement | null)[]>([]);
  const openBox = useRef<HTMLElement | null>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);

  /* Which box the testimonial glass is currently aimed at. A ref, so re-aiming
     it does not tear the glass down and rebuild it. */
  useEffect(() => {
    openBox.current = open === null ? null : glassBoxes.current[open] ?? null;
  }, [open]);

  const close = useCallback(
    (index: number) => setOpen((current) => (current === index ? null : current)),
    []
  );

  /* Both surfaces report the same mode, and they will always agree — same
     breakpoint, same motion query, same library. */
  const handleMode = useCallback((mode: GlassMode) => setGlassMode(mode), []);

  /* Tap outside to close. Only mounted while something is open, so the page
     carries no listeners at rest.

     Taps that land inside the open card are left alone, so that the button's
     own click handler is the only thing that answers them — closing here first
     would flip the state, re-render, and let the click that followed read the
     card as shut and open it straight back up.

     A swipe of the row deliberately does not close anything. It looks like it
     should, but opening a card scrolls it to the middle, and a listener on the
     rail cannot tell that scroll from a finger — it would shut the card on the
     same gesture that opened it. Tapping outside the card, which a swipe of the
     row usually starts with anyway, is what closes it. */
  useEffect(() => {
    if (open === null) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const card = cards.current[open];
      if (target && card?.contains(target)) return;
      setOpen(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <section
      id="testimonials"
      ref={ref}
      className={styles.testimonials}
      data-glass={glassMode}
      aria-labelledby="testimonials-heading"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(null);
      }}
    >
      <RayGlow />

      {/* Two panes of the same glass: the card you type into, and whichever
          testimonial is open. Both refract the painted backdrop rather than the
          shadergradient glow — the glow is a WebGL canvas, and the library
          refracts a clone, which for a canvas is blank. The glow is masked away
          from behind the form for the same reason (see .glow in the CSS). */}
      <SectionGlass
        active
        targetRef={formRef}
        sectionRef={ref}
        backgroundSelector="#stage-backdrop"
        radius={8}
        onModeChange={handleMode}
      />
      {/* The round lens belongs to the orbit. In the stack the cards are
          rectangles carrying the CSS version of the same material, and
          .glassBox — the box this would aim at — is display:none, so between
          900 and 1024px, where the library does run, there is nothing to point
          it at. */}
      <SectionGlass
        active={!stack && open !== null}
        targetRef={openBox}
        sectionRef={ref}
        backgroundSelector="#stage-backdrop"
        radius="round"
        showDelay={EXPAND_MS - 160}
      />

      <div className={styles.head}>
        <h2 id="testimonials-heading" className={styles.eyebrow} data-reveal>
          {TESTIMONIALS.eyebrow}
        </h2>
      </div>

      <div className={styles.orbit}>
        {/* display: contents in the orbit, a scroll rail in the stack. The two
            lists stay two lists either way — snap positions come from the
            <li>s, and a scroll container takes them from any descendant, not
            only from its own children. */}
        <div className={styles.rail} ref={railRef}>
          <ul className={`${styles.side} ${styles.sideLeft}`}>
            {TESTIMONIALS.items.slice(0, 2).map((item, index) => (
              <Circle
                key={item.name}
                item={item}
                index={index}
                open={open === index}
                stack={stack}
                onOpen={setOpen}
                onClose={close}
                boxRef={glassBoxes}
                cardRef={cards}
              />
            ))}
          </ul>

          <ul className={`${styles.side} ${styles.sideRight}`}>
            {TESTIMONIALS.items.slice(2, 4).map((item, index) => (
              <Circle
                key={item.name}
                item={item}
                index={index + 2}
                open={open === index + 2}
                stack={stack}
                onOpen={setOpen}
                onClose={close}
                boxRef={glassBoxes}
                cardRef={cards}
              />
            ))}
          </ul>
        </div>

        <ScrollDots railRef={railRef} count={TESTIMONIALS.items.length} />

        <div className={styles.formCell} id="contact" ref={formRef}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

/**
 * Where you are along the row.
 *
 * Decorative: the cards are already the keyboard path, and dots that could be
 * tabbed to would only be a second set of stops onto the same four things.
 *
 * Fed by one IntersectionObserver rooted on the rail, insetting its own left and
 * right by 35% so that only the card crossing the middle of the row reports in.
 * It fires when the answer changes rather than on every frame of a scroll, which
 * is what keeps React out of a scroll handler.
 */
function ScrollDots({
  railRef,
  count,
}: {
  railRef: React.RefObject<HTMLDivElement | null>;
  count: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || typeof IntersectionObserver === "undefined") return;

    const items = Array.from(rail.querySelectorAll<HTMLElement>("[data-card]"));
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = items.indexOf(entry.target as HTMLElement);
          if (index !== -1) setActive(index);
        });
      },
      { root: rail, rootMargin: "0px -35% 0px -35%", threshold: 0.01 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [railRef]);

  return (
    <div className={styles.dots} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={styles.dot}
          data-on={index === active ? "true" : undefined}
        />
      ))}
    </div>
  );
}

/**
 * One testimonial: an avatar that opens into the full review.
 *
 * In the orbit the circle is always in the DOM at its open diameter and simply
 * sized down when closed, so nothing is mounted or unmounted mid-interaction and
 * the transition always has two ends to run between. It is absolutely positioned
 * inside a slot the size of the avatar, so opening one never reflows its
 * neighbours — it floats over them.
 *
 * The stack keeps that arrangement and changes only the geometry: the slot is
 * the collapsed card, and the surface inside it grows downward into headroom the
 * rail reserves. The row's height never changes, so the contact form never
 * moves and the section's measured height — which the sky's crossfade schedule
 * is keyed to — stays what ScrollTrigger last read.
 */
function Circle({
  item,
  index,
  open,
  stack,
  onOpen,
  onClose,
  boxRef,
  cardRef,
}: {
  item: Testimonial;
  index: number;
  open: boolean;
  stack: boolean;
  onOpen: (index: number) => void;
  onClose: (index: number) => void;
  boxRef: React.RefObject<(HTMLElement | null)[]>;
  cardRef: React.RefObject<(HTMLElement | null)[]>;
}) {
  const panelId = `${useId()}-review`;
  const reduced = useReducedMotion();
  const surfaceRef = useRef<HTMLElement>(null);

  /* The open card's height, in pixels, measured from the content rather than
     guessed at: `height: auto` does not transition, and one max-height large
     enough for the longest quote would leave every shorter card finishing its
     ease early and then jumping.

     Cleared whenever this is not an open card in the stack, so the CSS owns the
     collapsed height, a resize re-reads it, and a window dragged back up past
     the breakpoint does not leave a pixel height stranded on a circle that is
     sized in rem.

     scrollHeight is the content's height at the card's current width, which is
     exactly its open height — nothing else constrains the surface. */
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    if (!stack || !open) {
      surface.style.height = "";
      return;
    }

    /* Measure at the natural height without animating to it: suppress the
       transition, let the card size to its content, read that, then hand it
       back to the CSS collapsed height and force the reflow that makes the
       browser treat what follows as a change to transition rather than as part
       of the same frame. */
    surface.style.transition = "none";
    surface.style.height = "auto";
    const target = surface.getBoundingClientRect().height;
    surface.style.height = "";
    void surface.offsetHeight;
    surface.style.transition = "";
    surface.style.height = `${target}px`;
  }, [open, stack]);

  /* Bring an opened card to the middle of the row. `block: "nearest"` is doing
     real work — without it the browser also scrolls the page vertically to
     centre the card in the viewport, dragging the whole section under the thumb
     that just tapped it. */
  useEffect(() => {
    if (!open || !stack) return;
    cardRef.current[index]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [open, stack, reduced, cardRef, index]);

  return (
    <li
      className={styles.slot}
      data-card
      data-reveal
      data-open={open ? "true" : undefined}
      ref={(el) => {
        cardRef.current[index] = el;
      }}
      style={
        {
          "--open-scale": String(OPEN_SCALES[index] ?? 1),
          "--reveal-delay": `${index * 120}ms`,
        } as React.CSSProperties
      }
      /* pointerenter/leave rather than a :hover rule so the same state drives
         aria-expanded. Guarded by pointerType, or a tap would leave a phone
         stuck in a hover it can never leave — and guarded by the layout, or a
         narrow desktop window would hover-open cards laid out to be tapped. */
      onPointerEnter={(event) => {
        if (!stack && event.pointerType === "mouse") onOpen(index);
      }}
      onPointerLeave={(event) => {
        if (!stack && event.pointerType === "mouse") onClose(index);
      }}
      /* React's focus events bubble, so these catch the button inside. In the
         stack the button is the whole card and focus is not the disclosure —
         pressing it is — so closing on blur would only fight it. */
      onFocus={() => {
        if (!stack) onOpen(index);
      }}
      onBlur={() => {
        if (!stack) onClose(index);
      }}
    >
      {/* What the glass is aimed at: the open diameter, always, whatever the
          circle is currently doing. Sizing the lens off the circle itself would
          rebuild its displacement map on every frame of the expansion. */}
      <span
        className={styles.glassBox}
        aria-hidden="true"
        ref={(el) => {
          boxRef.current[index] = el;
        }}
      />

      <figure className={styles.circle} id={panelId} ref={surfaceRef}>
        <blockquote className={styles.quote}>{item.quote}</blockquote>
        <figcaption className={styles.attribution}>
          {item.name}
          <span className={styles.role}>{item.role}</span>
        </figcaption>
      </figure>

      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose(index) : onOpen(index))}
      >
        <span className={styles.disc} aria-hidden="true">
          {item.avatar ? (
            /* A decorative portrait at a fixed 88px inside a fixed stage — the
               optimiser's layout machinery buys nothing here. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar} alt="" className={styles.photo} />
          ) : (
            initials(item.name)
          )}
        </span>
        <span className="srOnly">
          {open ? "Hide" : "Read"} {item.name}’s review
        </span>
      </button>
    </li>
  );
}

/** Fallback for a missing portrait: the person's initials, up to two. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
