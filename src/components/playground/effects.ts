// The Playground's typed effect registry (REQ-037, ARCH-019): the single dependency
// entry point a living-space effect plugs into. Adding an effect means appending one
// entry here — nothing else in the gallery route, nav, per-effect page frame or
// studio rig changes shape (REQ-038's "registry-driven growth").
//
// v1 (SWBE-211) shipped the shell only: zero effects, zero extra JS (DEC-030 budget).
// Each following story adds one entry whose `component` is `lazy(() => import(...))`,
// called once here at module scope (never inside a render function, which is why
// `EffectStage` takes the already-built component rather than a loader to call
// itself) — so the effect's chunk is only fetched once `EffectStage` mounts it.
//
// `title`/`description` are per-locale here rather than in site.ts: an effect is one
// self-contained registration, and its own page frame (SWBE-212) is the only consumer
// of either field. `title` lands in a `font-display` slot (the page's h1 and the OG
// card) — BBH Hegarty is ASCII-only (DEC-023), so keep it unaccented in both locales.

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Locale } from "@/i18n/locales";
import type { PreviewMotion } from "./preview/runtime";

export type PlaygroundEffect = {
  /** Stable identifier, also used as the React key in the gallery grid. */
  id: string;
  /** URL segment under /playground/[slug]. */
  slug: string;
  /** Renders in a `font-display` slot — keep unaccented (DEC-023). */
  title: Record<Locale, string>;
  /** Feeds the page lead and the OG card description. */
  description: Record<Locale, string>;
  /** Which sample of itself the effect plays inside its gallery card on hover. The
   *  preview runtime is dynamically imported, so naming a motion here costs the gallery
   *  nothing until a visitor actually hovers a card. */
  preview: PreviewMotion;
  /** `lazy(() => import("./some-effect"))` — built once at registration. */
  component: LazyExoticComponent<ComponentType>;
};

export const playgroundEffects: readonly PlaygroundEffect[] = [
  {
    id: "lumiere",
    slug: "lumiere",
    title: { fr: "LUMIERE", en: "LUMIERE" },
    description: {
      fr: "Fais pivoter le chrome sous la lumière du studio et zoome pour en inspecter chaque reflet.",
      en: "Spin the chrome under the studio light and zoom in to inspect every reflection.",
    },
    preview: "orient",
    component: lazy(() => import("./effects/lumiere")),
  },
  {
    id: "poids-lourd",
    slug: "poids-lourd",
    title: { fr: "Poids Lourd", en: "Heavyweight" },
    description: {
      fr: "Saisissez, glissez et lancez le logo chromé contre des murs élastiques.",
      en: "Grab, drag and throw the chrome logo against elastic walls.",
    },
    preview: "drop",
    component: lazy(() => import("./effects/poids-lourd")),
  },
];
