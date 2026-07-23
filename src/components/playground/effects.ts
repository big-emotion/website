// The Playground's typed effect registry (REQ-037, ARCH-019): the single dependency
// entry point a living-space effect plugs into. Adding an effect means appending one
// entry here — nothing else in the gallery route, nav or studio rig changes shape.
//
// v1 (SWBE-211) ships the shell only: zero effects, zero extra JS (DEC-030 budget).
// Stories 3-5 each add one entry whose `component` is `lazy(() => import(...))`,
// called once here at module scope (never inside a render function, which is why
// `EffectStage` takes the already-built component rather than a loader to call
// itself) — so the effect's chunk is only fetched once `EffectStage` mounts it.

import type { ComponentType, LazyExoticComponent } from "react";

export type PlaygroundEffect = {
  /** Stable identifier, also used as the React key in the gallery grid. */
  id: string;
  /** URL segment under /playground/[slug] (out of scope here — ships with story 2). */
  slug: string;
  /** `lazy(() => import("./some-effect"))` — built once at registration. */
  component: LazyExoticComponent<ComponentType>;
};

export const playgroundEffects: readonly PlaygroundEffect[] = [];
