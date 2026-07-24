"use client";

import dynamic from "next/dynamic";
import { Logo } from "@/components/logo";
import { HAS_HERO_MODEL } from "./model-gate";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((mod) => mod.SceneCanvas), {
  ssr: false,
});

/** Hero mount point gated on `HAS_HERO_MODEL` (DEC-027). While the gate is off this
 *  renders the static wordmark synchronously — no loading state, no flash — and never
 *  imports Three.js/GSAP/Lenis. Once a real model ships and the gate flips on, the
 *  runtime is fetched via `next/dynamic` so it still never lands in the landing bundle
 *  for anyone visiting while the gate is off. */
export function SceneMount() {
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

  return <SceneCanvas />;
}
