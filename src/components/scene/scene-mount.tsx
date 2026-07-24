"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { HAS_HERO_MODEL } from "./model-gate";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((mod) => mod.SceneCanvas), {
  ssr: false,
});

/** Home-only owner of the intro lifecycle and the `HAS_HERO_MODEL` gate (DEC-027).
 *  The lemon veil is server-rendered above the page, so the dynamic Three.js import
 *  cannot expose the header or copy before it mounts. Once mounted, SceneCanvas sits
 *  above that veil through the complete logo reveal, then both move out of the page's
 *  way together. */
export function SceneMount() {
  const [introActive, setIntroActive] = useState(HAS_HERO_MODEL);
  const completeIntro = useCallback(() => setIntroActive(false), []);

  // Next.js and browsers both preserve scroll in some navigation/reload cases. The
  // homepage choreography always starts at state zero, so own that rule while this
  // route is mounted and restore the visitor's browser preference on the way out.
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const resetOnPageShow = () => window.scrollTo(0, 0);
    window.addEventListener("pageshow", resetOnPageShow);

    return () => {
      window.removeEventListener("pageshow", resetOnPageShow);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  // Keep wheel/touch input from moving the transparent panels beneath the intro.
  useEffect(() => {
    if (!introActive) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [introActive]);

  if (!HAS_HERO_MODEL) {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="scene-stage fixed inset-0" />
        <div
          data-testid="scene-fallback"
          className="fixed inset-0 flex items-center justify-center"
        >
          <Logo className="w-[70vw] opacity-90" />
        </div>
      </div>
    );
  }

  return (
    <>
      {introActive && (
        <div
          aria-hidden="true"
          data-testid="scene-intro-veil"
          className="pointer-events-none fixed inset-0 z-[100] bg-lemon"
        />
      )}
      <SceneCanvas introActive={introActive} onIntroComplete={completeIntro} />
    </>
  );
}
