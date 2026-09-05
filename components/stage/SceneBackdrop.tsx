import Image from "next/image";

import { SCENES } from "./scenes";
import styles from "./SceneBackdrop.module.css";

/**
 * The five painted scenes, stacked. Their opacities are driven from
 * Stage.tsx via CSS custom properties — this component holds no state and
 * never re-renders on scroll.
 *
 * Not a client component: it is five <img> tags and a gradient.
 */
export function SceneBackdrop({ id }: { id?: string }) {
  return (
    <div className={styles.backdrop} id={id} aria-hidden="true">
      {SCENES.map((scene, index) => (
        <div
          key={scene.id}
          className={styles.layer}
          data-scene-layer
          style={
            {
              "--layer-o": `var(${scene.cssVar})`,
              "--layer-pos": scene.position,
              "--layer-pos-mobile": scene.positionMobile,
            } as React.CSSProperties
          }
        >
          <Image
            src={scene.src}
            alt=""
            fill
            sizes="100vw"
            className={styles.image}
            /* Only the hero is above the fold; the rest can wait. */
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            quality={82}
          />
          <div className={styles.wash} style={{ background: scene.wash }} />
        </div>
      ))}
    </div>
  );
}
