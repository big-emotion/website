// The effect's own self-contained copy (mirrors effects.ts's rationale for
// title/description: this module and its own render are the only consumers).
//
// `reset` IS a `font-display` slot — it renders as a button in BBH Hegarty, whose cmap
// is ASCII-only (DEC-023). It shipped as "Réinitialiser" and the É fell back to another
// face mid-word. "Relancer" is the fix: correct French, no accent to lose, and closer to
// what the button does to a toy you throw. Everything else here is body copy and keeps
// its accents.

import type { Locale } from "@/i18n/locales";
import type { TiltPermissionCardCopy } from "./tilt-permission-card";

export type PoidsLourdCopy = {
  /** `font-display` slot — ASCII only. */
  reset: string;
  ariaLabel: string;
  /** The mouse-only slow-motion hold, spelled out because it is not discoverable. Zoom
   *  used to be listed here too; it now lives with the on-screen controls that own it. */
  gestures: string;
  fallback: string;
  tilt: TiltPermissionCardCopy;
};

export const copy: Record<Locale, PoidsLourdCopy> = {
  fr: {
    reset: "Relancer",
    ariaLabel: "Logo chromé à saisir, glisser et lancer contre les bords élastiques",
    gestures: "Clic droit maintenu : ralenti",
    fallback: "Cette expérience nécessite un navigateur compatible WebGL, animations activées.",
    tilt: {
      title: "Incliner pour jouer",
      body: "Autorise l'inclinaison pour ajouter un peu de gravité au geste.",
      enable: "Activer",
      dismiss: "Non merci",
    },
  },
  en: {
    reset: "Reset",
    ariaLabel: "Chrome logo to grab, drag and throw against the elastic walls",
    gestures: "Hold right-click: slow motion",
    fallback: "This experience needs a WebGL-capable browser with animations enabled.",
    tilt: {
      title: "Tilt to play",
      body: "Allow tilt to add a bit of gravity to the gesture.",
      enable: "Enable",
      dismiss: "No thanks",
    },
  },
};
