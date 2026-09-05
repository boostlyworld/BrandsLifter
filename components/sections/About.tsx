"use client";

import { ABOUT } from "@/content/site";
import { useReveal } from "@/lib/useReveal";

import styles from "./About.module.css";

export function About() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="about" ref={ref} className={styles.about} aria-labelledby="about-heading">
      <div className={styles.intro}>
        <span className={styles.eyebrow} data-reveal>
          {ABOUT.eyebrow}
        </span>

        <h2
          id="about-heading"
          className={styles.heading}
          data-reveal
          style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
        >
          {ABOUT.heading}
        </h2>

        <div
          className={styles.body}
          data-reveal
          style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
        >
          {ABOUT.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>

      <ol className={styles.marks}>
        {ABOUT.marks.map((mark, index) => (
          <li
            key={mark.n}
            className={styles.mark}
            data-reveal
            style={{ "--reveal-delay": `${index * 120}ms` } as React.CSSProperties}
          >
            <span className={styles.markNumber}>{mark.n}</span>
            <h3 className={styles.markTitle}>{mark.title}</h3>
            <p className={styles.markBody}>{mark.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
