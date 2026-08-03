// The effect's own self-contained copy (same rationale as the other effects: this
// module and its own render are the only consumers). `reset` is a `font-display`
// slot — ASCII only (DEC-023) — everything else is body copy and keeps its accents.

import type { Locale } from "@/i18n/locales";

export type AttrapeMoiCopy = {
  /** `font-display` slot — ASCII only. */
  reset: string;
  ariaLabel: string;
  /** sr-only keyboard instructions the stage points at via aria-describedby. */
  instructions: string;
  /** Accessible name of the ball button — the toy's own invitation. */
  ball: string;
  fallback: string;
};

export const copy: Record<Locale, AttrapeMoiCopy> = {
  fr: {
    reset: "Relancer",
    ariaLabel: "Logo en scène avec une balle rebondissante à attraper",
    instructions:
      "Flèches : faire pivoter le logo. Entrée : relancer la balle. Tab jusqu'à la balle puis Entrée : l'attraper. La balle se laisse aussi glisser à la souris.",
    ball: "Attrape-moi",
    fallback: "Cette expérience nécessite un navigateur compatible WebGL, animations activées.",
  },
  en: {
    reset: "Reset",
    ariaLabel: "Staged logo with a bouncing ball to catch",
    instructions:
      "Arrow keys: rotate the logo. Enter: relaunch the ball. Tab to the ball, then Enter to catch it. The ball can also be dragged.",
    ball: "Catch me",
    fallback: "This experience needs a WebGL-capable browser with animations enabled.",
  },
};
