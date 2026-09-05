"use client";

import { useEffect, useRef, useState } from "react";

import { NAV_ACTION, NAV_LINKS, SITE } from "@/content/site";
import type { SectionId } from "@/lib/scrollProgress";

import { GlassSurface } from "./GlassSurface";
import styles from "./Nav.module.css";

/** Scroll distance before the bar tightens and the glass comes in (px). */
const SCROLL_THRESHOLD = 80;

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
  const [glassMode, setGlassMode] = useState<"glass" | "css">("css");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        ref={navRef}
        className={styles.nav}
        data-scrolled={scrolled}
        data-ink={SCENE_INK[scene]}
        data-glass={glassMode}
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
        active={scrolled}
        targetRef={navRef}
        backgroundSelector="#stage-backdrop"
        onModeChange={setGlassMode}
      />
    </>
  );
}
