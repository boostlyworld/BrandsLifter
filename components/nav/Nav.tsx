"use client";

import { useEffect, useRef, useState } from "react";

import { NAV_ACTION, NAV_LINKS, SITE } from "@/content/site";
import type { SectionId } from "@/lib/scrollProgress";

import { GlassSurface } from "./GlassSurface";
import styles from "./Nav.module.css";

/** Scroll distance before the bar tightens and the glass comes in (px). */
const SCROLL_THRESHOLD = 80;

/**
 * How much of the screen the footer has to take before the bar leaves.
 *
 * The footer repeats the wordmark at full width and lists the same four
 * sections the bar does, so once you are in it the bar is pure duplication
 * laid across the top of the night sky. It leaves rather than competing.
 *
 * Read this as "shrink the root to its top 40%": the footer counts as arrived
 * only once it covers the bottom 60% of the screen, not the moment its top edge
 * appears. Cutting the top of the root instead — which is the intuitive way to
 * write it and the wrong one — fires while the contact form is still the thing
 * being looked at.
 */
const FOOTER_MARGIN = "0px 0px -60% 0px";

/**
 * Which ink each scene needs. The cloud sea and the light rays are bright
 * enough that cream type disappears into them; the other three are not.
 * Checked against the actual paintings, not guessed from their names.
 */
const SCENE_INK: Record<SectionId, "light" | "dark"> = {
  home: "light",
  about: "light",
  services: "dark",
  testimonials: "dark",
  footer: "light",
};

export type NavProps = {
  /** The section currently framed, from the Stage. */
  scene: SectionId;
};

export function Nav({ scene }: NavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [glassMode, setGlassMode] = useState<"glass" | "css">("css");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Stand down over the footer. An observer rather than a scroll threshold
     because the footer's own height is the thing that matters, and that changes
     with the viewport and with how the three columns stack. */
  useEffect(() => {
    const footer = document.getElementById("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setAtFooter(entry.isIntersecting),
      { rootMargin: FOOTER_MARGIN }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={navRef}
        className={styles.nav}
        data-scrolled={scrolled}
        data-hidden={atFooter}
        data-ink={SCENE_INK[scene]}
        data-glass={glassMode}
        /* Not merely invisible: a bar that has translated off the top of the
           screen must not still be the next tab stop. Nothing is lost — the
           footer underneath carries the same four links. */
        inert={atFooter}
      >
        <div className={styles.inner}>
          <a className={styles.wordmark} href="#home">
            {SITE.wordmark}
          </a>

          <nav aria-label="Primary">
            <ul className={styles.links}>
              {NAV_LINKS.map((link) => (
                <li key={link.id} data-nav-id={link.id}>
                  <a
                    className={styles.link}
                    href={`#${link.id}`}
                    /* aria-current="true" rather than "page": this is a
                       single page and these are in-page landmarks. */
                    aria-current={scene === link.id ? "true" : undefined}
                  >
                    <span className={styles.labelFull}>{link.label}</span>
                    <span className={styles.labelShort}>{link.short}</span>
                  </a>
                </li>
              ))}

              {/* The enquiry is the only conversion on the page, so it is the
                  only thing in the nav that looks like an action. */}
              <li>
                <a className={styles.action} href={`#${NAV_ACTION.id}`}>
                  {NAV_ACTION.label}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Renders nothing itself — it drives liquid-glass-js, whose elements
          live on <body> and are positioned to match the bar above. */}
      <GlassSurface
        active={scrolled && !atFooter}
        targetRef={navRef}
        backgroundSelector="#stage-backdrop"
        onModeChange={setGlassMode}
      />
    </>
  );
}
