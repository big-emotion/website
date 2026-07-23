// The Playground's typed effect registry (REQ-037, ARCH-019): the single dependency
// entry point a living-space effect plugs into. Adding an effect means appending one
// entry here — nothing else in the gallery route, nav, per-effect page frame or
// studio rig changes shape (REQ-038's "registry-driven growth").
//
// v1 (SWBE-211) ships the shell only: zero effects, zero extra JS (DEC-030 budget).
// Stories 3-5 each add one entry whose `component` is `lazy(() => import(...))`,
// called once here at module scope (never inside a render function, which is why
// `EffectStage` takes the already-built component rather than a loader to call
// itself) — so the effect's chunk is only fetched once `EffectStage` mounts it.
//
// `title`/`description` are per-locale here rather than in site.ts: an effect is one
// self-contained registration, and its own page frame (SWBE-212) is the only consumer
// of either field. `title` lands in a `font-display` slot (the page's h1 and the OG
// card) — BBH Hegarty is ASCII-only (DEC-023), so keep it unaccented in both locales.

import type { ComponentType, LazyExoticComponent } from "react";
import type { Locale } from "@/i18n/locales";

export type PlaygroundEffect = {
  /** Stable identifier, also used as the React key in the gallery grid. */
  id: string;
  /** URL segment under /playground/[slug]. */
  slug: string;
  /** Renders in a `font-display` slot — keep unaccented (DEC-023). */
  title: Record<Locale, string>;
  /** Feeds the page lead and the OG card description. */
  description: Record<Locale, string>;
  /** `lazy(() => import("./some-effect"))` — built once at registration. */
  component: LazyExoticComponent<ComponentType>;
};

export const playgroundEffects: readonly PlaygroundEffect[] = [];
