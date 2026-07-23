// The effect's own self-contained copy (mirrors effects.ts's rationale for
// title/description: this module and its own render are the only consumers).
// Not a `font-display` slot, so accents are fine here (DEC-023 only constrains the
// registry's title/description).

import type { Locale } from "@/i18n/locales";
import type { TiltPermissionCardCopy } from "./tilt-permission-card";

export type PoidsLourdCopy = {
  reset: string;
  ariaLabel: string;
  fallback: string;
  tilt: TiltPermissionCardCopy;
};

export const copy: Record<Locale, PoidsLourdCopy> = {
  fr: {
    reset: "Réinitialiser",
    ariaLabel: "Logo chromé à saisir, glisser et lancer contre les bords élastiques",
    fallback:
      "Cette expérience nécessite un navigateur compatible WebGL, animations activées.",
    tilt: {
      title: "Incliner pour jouer",
      body: "Autorisez l'inclinaison pour ajouter un peu de gravité au geste.",
      enable: "Activer",
      dismiss: "Non merci",
    },
  },
  en: {
    reset: "Reset",
    ariaLabel: "Chrome logo to grab, drag and throw against the elastic walls",
    fallback: "This experience needs a WebGL-capable browser with animations enabled.",
    tilt: {
      title: "Tilt to play",
      body: "Allow tilt to add a bit of gravity to the gesture.",
      enable: "Enable",
      dismiss: "No thanks",
    },
  },
};
