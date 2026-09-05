"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { TESTIMONIALS, type Testimonial } from "@/content/site";
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
 */
const OPEN_SCALES = [1, 0.86, 0.86, 1];

/**
 * How long the circle takes to expand. The glass waits this out before fading
 * in, so it lands on a finished circle instead of blooming at full diameter
 * around a disc that is still growing. Matches the transition in the CSS.
 */
const EXPAND_MS = 460;

export function Testimonials() {
  const ref = useReveal<HTMLElement>();

  /* One piece of state drives hover, focus and tap alike. It has to be state
     rather than a CSS `:hover` rule for two reasons: `aria-expanded` has to
     stay truthful, and the glass has to know which circle to aim at. */
  const [open, setOpen] = useState<number | null>(null);
  const [glassMode, setGlassMode] = useState<GlassMode>("css");

  const formRef = useRef<HTMLDivElement>(null);
  const glassBoxes = useRef<(HTMLElement | null)[]>([]);
  const openBox = useRef<HTMLElement | null>(null);

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
      <SectionGlass
        active={open !== null}
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
        <ul className={`${styles.side} ${styles.sideLeft}`}>
          {TESTIMONIALS.items.slice(0, 2).map((item, index) => (
            <Circle
              key={item.name}
              item={item}
              index={index}
              open={open === index}
              onOpen={setOpen}
              onClose={close}
              boxRef={glassBoxes}
            />
          ))}
        </ul>

        <div className={styles.formCell} id="contact" ref={formRef}>
          <ContactForm />
        </div>

        <ul className={`${styles.side} ${styles.sideRight}`}>
          {TESTIMONIALS.items.slice(2, 4).map((item, index) => (
            <Circle
              key={item.name}
              item={item}
              index={index + 2}
              open={open === index + 2}
              onOpen={setOpen}
              onClose={close}
              boxRef={glassBoxes}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * One testimonial: an avatar that opens into the full review.
 *
 * The circle is always in the DOM at its open diameter and simply sized down
 * when closed, so nothing is mounted or unmounted mid-interaction and the
 * transition always has two ends to run between. It is absolutely positioned
 * inside a slot the size of the avatar, so opening one never reflows its
 * neighbours — it floats over them.
 */
function Circle({
  item,
  index,
  open,
  onOpen,
  onClose,
  boxRef,
}: {
  item: Testimonial;
  index: number;
  open: boolean;
  onOpen: (index: number) => void;
  onClose: (index: number) => void;
  boxRef: React.RefObject<(HTMLElement | null)[]>;
}) {
  const panelId = `${useId()}-review`;

  return (
    <li
      className={styles.slot}
      data-reveal
      data-open={open ? "true" : undefined}
      style={
        {
          "--open-scale": String(OPEN_SCALES[index] ?? 1),
          "--reveal-delay": `${index * 120}ms`,
        } as React.CSSProperties
      }
      /* pointerenter/leave rather than a :hover rule so the same state drives
         aria-expanded. Guarded by pointerType, or a tap would leave a phone
         stuck in a hover it can never leave. */
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onOpen(index);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onClose(index);
      }}
      /* React's focus events bubble, so these catch the button inside. */
      onFocus={() => onOpen(index)}
      onBlur={() => onClose(index)}
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

      <figure className={styles.circle} id={panelId}>
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
