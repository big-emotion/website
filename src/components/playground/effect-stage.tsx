"use client";

import { Suspense, type ReactNode } from "react";
import type { PlaygroundEffect } from "./effects";

/**
 * The lazy boundary an effect page (story 2, out of scope here) mounts to render one
 * `PlaygroundEffect`. `effect.component` is already `lazy(() => import(...))`, built
 * once at registry scope (see effects.ts) — this just gives it somewhere to suspend,
 * so its chunk is fetched on mount and never pulled into the gallery or any marketing
 * page's bundle (DEC-030's 0 KB-until-opened budget).
 */
export function EffectStage({ effect, fallback }: { effect: PlaygroundEffect; fallback: ReactNode }) {
  const Effect = effect.component;

  return (
    <Suspense fallback={fallback}>
      <Effect />
    </Suspense>
  );
}
