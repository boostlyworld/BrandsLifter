"use client";

import { useCallback, useState } from "react";

import { Nav } from "@/components/nav/Nav";
import { About } from "@/components/sections/About";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Testimonials } from "@/components/sections/Testimonials";
import { Stage } from "@/components/stage/Stage";
import type { SectionId } from "@/lib/scrollProgress";

/**
 * The whole site.
 *
 * Two layers, and the order below is the whole architecture:
 *   · <Stage> is fixed behind everything — the five painted scenes and the
 *     balloon. It never scrolls, which is what makes the balloon look like it
 *     is travelling rather than the page hopping between pictures.
 *   · <main> holds the five sections, which scroll normally over the top of it.
 *
 * The only state that crosses between them is which scene is currently framed,
 * and the only thing that needs it is the nav, which has to recolour itself to
 * stay legible over five very different paintings.
 */
export default function Home() {
  const [scene, setScene] = useState<SectionId>("home");

  /* Stable identity: Stage takes this as a dependency and should not tear its
     ScrollTrigger down and rebuild it on every render. */
  const handleSceneChange = useCallback((id: SectionId) => setScene(id), []);

  return (
    <>
      <a className="skipLink" href="#main">
        Skip to content
      </a>

      <Nav scene={scene} />
      <Stage onSceneChange={handleSceneChange} />

      <main id="main">
        <Hero />
        <About />
        <Services />
        <Testimonials />
      </main>

      <Footer />
    </>
  );
}
