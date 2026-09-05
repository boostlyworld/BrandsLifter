"use client";

import { HERO } from "@/content/site";
import { useReveal } from "@/lib/useReveal";
import { useSectionProgress } from "@/lib/useSectionProgress";

import styles from "./Hero.module.css";

export function Hero() {
  const ref = useReveal<HTMLElement>();
  /* Publishes --section-progress on the cue so it can fade out as the hero
     scrolls away, rather than riding up and sitting under the nav bar. */
  const cueRef = useSectionProgress<HTMLDivElement>(0);

  return (
    <section id="home" ref={ref} className={styles.hero}>
      <div className={styles.content}>
        <p className={styles.eyebrow} data-reveal>
          {HERO.eyebrow}
        </p>

        <h1
          className={styles.heading}
          data-reveal
          style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
        >
          <span className={styles.line}>
            <em className={styles.lift}>{HERO.headingLead}</em>{" "}
            {HERO.headingRest}
          </span>
          <span className={styles.line}>{HERO.headingLine2}</span>
        </h1>

        <div
          className={styles.actions}
          data-reveal
          style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
        >
          <a className={styles.primary} href={HERO.primaryCta.href}>
            {HERO.primaryCta.label}
          </a>

          <a className={styles.secondary} href={HERO.secondaryCta.href}>
            {HERO.secondaryCta.label}
            <svg
              className={styles.arrow}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* The illustrated journey is the whole idea of this site. Anyone who
            cannot see it should still be told what it is. */}
        <p className="srOnly">{HERO.sceneAlt}</p>
      </div>

      <div ref={cueRef} className={styles.cue} aria-hidden="true">
        <span className={styles.cueTrack} />
        Scroll
      </div>
    </section>
  );
}
