"use client";

import { useState } from "react";

import {
  GLASS_CONTROLS,
  getGlassSettings,
  resetGlassSettings,
  setGlassSettings,
  type GlassParams,
} from "@/lib/glassSettings";

import styles from "./GlassTuner.module.css";

/**
 * Live controls for the liquid glass on the contact card and the open
 * testimonial. Development only — app/page.tsx imports it through a
 * `dynamic()` that is only reached when NODE_ENV is "development", so the whole
 * module is absent from a production build.
 *
 * The library it drives is liquid-glass-js (eamonliu/liquid-glass-js); these
 * are its own parameters, with its own documented ranges. The nav's glass is
 * not connected to this on purpose: it is a different surface with different
 * numbers, and tuning the two together would mean tuning neither.
 *
 * Local state here is only what the sliders render from; the values that matter
 * live in lib/glassSettings.ts, which the surfaces subscribe to directly.
 */
export default function GlassTuner() {
  const [params, setParams] = useState<GlassParams>(getGlassSettings);
  /* Open on a desktop, where there is room beside the page; folded away on a
     narrow one, where it would cover the thing being tuned. ssr:false means
     window is always there on the first render. */
  const [open, setOpen] = useState(() => window.innerWidth >= 900);
  const [copied, setCopied] = useState(false);

  const change = (patch: Partial<GlassParams>) => {
    setGlassSettings(patch);
    setParams(getGlassSettings());
    setCopied(false);
  };

  const reset = () => {
    resetGlassSettings();
    setParams(getGlassSettings());
    setCopied(false);
  };

  /** Emits exactly what GLASS_DEFAULTS expects, ready to paste over it. */
  const copy = async () => {
    const body = [
      ...GLASS_CONTROLS.map((c) => `  ${c.key}: ${params[c.key]},`),
      `  tintColor: ${JSON.stringify(params.tintColor)},`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(`{\n${body}\n}`);
      setCopied(true);
    } catch {
      /* Clipboard needs a secure context and permission. Falling back to the
         console is enough for a dev tool — the values are still gettable. */
      console.log(`GLASS_DEFAULTS = {\n${body}\n}`);
      setCopied(true);
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Liquid glass · dev</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "hide" : "show"}
        </button>
      </div>

      {open && (
        <>
          <div className={styles.body}>
            {GLASS_CONTROLS.map((control) => (
              <label key={control.key} className={styles.row}>
                <span className={styles.label}>
                  <span className={styles.name}>{control.label}</span>
                  <span className={styles.value}>{params[control.key]}</span>
                </span>
                <span className={styles.hint}>{control.hint}</span>
                <input
                  className={styles.slider}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={params[control.key]}
                  onChange={(event) =>
                    change({ [control.key]: Number(event.target.value) })
                  }
                />
              </label>
            ))}

            <label className={styles.row}>
              <span className={styles.label}>
                <span className={styles.name}>Tint colour</span>
                <span className={styles.value}>{params.tintColor}</span>
              </span>
              <span className={styles.colorRow}>
                <input
                  className={styles.color}
                  type="color"
                  value={params.tintColor}
                  onChange={(event) => change({ tintColor: event.target.value })}
                />
                <span className={styles.hint}>Tint hue</span>
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              onClick={copy}
              data-done={copied ? "true" : undefined}
            >
              {copied ? "copied" : "copy settings"}
            </button>
            <button type="button" className={styles.action} onClick={reset}>
              reset
            </button>
          </div>
          <p className={styles.note}>
            Paste over GLASS_DEFAULTS in lib/glassSettings.ts to keep.
          </p>
        </>
      )}
    </aside>
  );
}
