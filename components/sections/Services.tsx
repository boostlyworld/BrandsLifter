"use client";

import { SERVICES } from "@/content/site";
import { useSectionProgress } from "@/lib/useSectionProgress";

import styles from "./Services.module.css";

/**
 * How far through the section each row waits before arriving, as a fraction of
 * the section's own span. Spread them further apart for a slower reveal; set
 * them all to 0 to have the ledger simply appear.
 */
const ROW_THRESHOLDS = [0, 0.07, 0.14, 0.21];

export function Services() {
  /* Section index 2 in section space. The ref publishes --section-progress,
     which is what staggers the rows while the section is pinned. */
  const ref = useSectionProgress<HTMLElement>(2);

  return (
    <section
      id="services"
      ref={ref}
      className={styles.services}
      aria-labelledby="services-heading"
    >
      {/* The camera. Everything in the section rides on this one element so it
          can be panned up inside the pin — see .track in Services.module.css. */}
      <div className={styles.track} data-services-track>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{SERVICES.eyebrow}</span>
          <h2 id="services-heading" className={styles.heading}>
            {SERVICES.heading}
          </h2>
          <p className={styles.intro}>{SERVICES.intro}</p>
        </div>

        <ol className={styles.ledger}>
          {SERVICES.items.map((item, index) => (
            <li
              key={item.n}
              className={styles.row}
              style={
                {
                  "--row-at": String(ROW_THRESHOLDS[index] ?? 0),
                } as React.CSSProperties
              }
            >
              <span className={styles.rowNumber} aria-hidden="true">
                {item.n}
              </span>

              <div>
                <h3 className={styles.rowName}>{item.name}</h3>
                <p className={styles.rowSummary}>{item.summary}</p>
              </div>

              <p className={styles.rowBody}>{item.body}</p>

              <span className={styles.rowMeta}>{item.meta}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
