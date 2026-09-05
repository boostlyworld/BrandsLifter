/**
 * One-time asset prep. Run with: npm run assets
 *
 * Reads the painterly source art from Scenes/try1/ (left untouched) and writes
 * web-ready copies into public/. Safe to re-run.
 *
 * Two jobs:
 *  1. Crop the balloon sprite down to its opaque bounding box. The source PNG is
 *     1376x768 with the balloon occupying only x 486-890, y 86-652 -- the rest is
 *     transparent padding. react-three-fiber maps the texture onto a plane, so that
 *     padding would otherwise force us to guess offsets when positioning it.
 *  2. Copy + rename the five scene backgrounds to names that say what they are.
 */
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "Scenes", "try1");
const OUT = path.join(ROOT, "public");

/** Opaque bounding box of Baloon.png, measured, plus ~10px of safety margin
 *  so anti-aliased edge pixels are not clipped. */
const BALLOON_CROP = { left: 476, top: 76, width: 424, height: 586 };

/** source filename -> public/scenes/<name>.png */
const SCENES = {
  "bg-tree.png": "hero-tree.png",
  "Generated Image July 30, 2026 - 6_15PM (2).png": "about-mountains.png",
  "Generated Image July 30, 2026 - 6_15PM (1).png": "services-clouds.png",
  "Generated Image July 30, 2026 - 6_15PM.png": "testimonials-rays.png",
  "Generated Image July 30, 2026 - 6_13PM.png": "footer-night.png",
};

await mkdir(path.join(OUT, "scenes"), { recursive: true });

await sharp(path.join(SRC, "Baloon.png"))
  .extract(BALLOON_CROP)
  .png()
  .toFile(path.join(OUT, "balloon.png"));
console.log(`balloon.png  ${BALLOON_CROP.width}x${BALLOON_CROP.height}`);

for (const [from, to] of Object.entries(SCENES)) {
  await copyFile(path.join(SRC, from), path.join(OUT, "scenes", to));
  console.log(`scenes/${to}`);
}
