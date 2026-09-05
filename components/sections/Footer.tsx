"use client";

import { FOOTER, NAV_LINKS, SITE } from "@/content/site";
import { useReveal } from "@/lib/useReveal";

import styles from "./Footer.module.css";

export function Footer() {
  const ref = useReveal<HTMLElement>();

  return (
    /* id="footer" so the Stage can find it: it is the fifth and last point in
       section space, and the night sky is its scene. */
    <footer id="footer" ref={ref} className={styles.footer}>
      {/* The name at full width, as the last thing the page says.
          SVG rather than CSS type because it has to fill the measure exactly:
          textLength with lengthAdjust="spacing" fits the string to the box by
          opening or closing the tracking, whatever the glyphs happen to
          measure. A vw font-size cannot do that — and it would break outright
          during the font's swap window, when Aboreto has not arrived and Times
          New Roman is standing in with completely different metrics.
          The viewBox is arbitrary units; only its ratio matters. */}
      <svg
        className={styles.mark}
        viewBox="0 0 1000 132"
        role="img"
        aria-label={SITE.wordmark}
        data-reveal
      >
        <text
          className={styles.markText}
          x="500"
          y="104"
          textAnchor="middle"
          textLength="1000"
          lengthAdjust="spacing"
        >
          {SITE.wordmark}
        </text>
      </svg>

      <div className={styles.inner}>
        <div className={styles.brand} data-reveal>
          <p className={styles.tagline}>{FOOTER.tagline}</p>

          {/* Peak-end: whatever else the last screen of a five-thousand-pixel
              page does, it should not be a dead end for someone who has read
              the whole thing and not yet written. */}
          <a className={styles.closer} href={FOOTER.closer.href}>
            {FOOTER.closer.label}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d="M5 12h13M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <nav aria-label="Footer" data-reveal>
          <h3 className={styles.colTitle}>Sections</h3>
          <ul className={styles.list}>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a className={styles.link} href={`#${link.id}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div data-reveal>
          <h3 className={styles.colTitle}>Get in touch</h3>
          <ul className={styles.list}>
            <li>
              <a className={`${styles.link} ${styles.email}`} href={`mailto:${FOOTER.email}`}>
                {FOOTER.email}
              </a>
            </li>
            {FOOTER.socials.map((social) => (
              <li key={social.label}>
                {/* Placeholder hrefs are "#" until real profiles exist. A "#"
                    with target="_blank" opens a blank duplicate of this page,
                    which reads as a bug rather than as an unfinished link — so
                    the new tab is only requested for a real destination. */}
                <a
                  className={styles.link}
                  href={social.href}
                  {...(social.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.base}>
        <span>{FOOTER.legal}</span>
        <span>{FOOTER.colophon}</span>
      </div>
    </footer>
  );
}
