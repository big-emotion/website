"use client";

// Both 3D effects shipped their zoom behind "hold a mouse button and turn the wheel".
// That gesture does not exist on a Mac trackpad — a two-finger scroll needs both fingers,
// so there is no third one left to hold the click with — and the wheel it does send goes
// to the page, which scrolls the stage out from under the visitor. This overlay is the
// zoom that always works: two buttons, reachable by mouse, finger and keyboard alike.
//
// Copy lives here rather than in messages/{fr,en}.json because the control is a
// Playground affordance with exactly one consumer shape — the same reason poids-lourd
// keeps its own copy.ts. Body copy, so accents are fine: nothing here is font-display.

import type { Locale } from "@/i18n/locales";

/** Which way a press moves the camera. "in" always means closer to the logo, whatever
 *  sign the underlying camera distance happens to use. */
export type ZoomDirection = "in" | "out";

type ZoomControlsCopy = {
  zoomIn: string;
  zoomOut: string;
  /** Names the pointer-device shortcuts. Pointer-only wording, so it is hidden on the
   *  viewports that have neither a trackpad nor a wheel. */
  gestureHint: string;
};

const copy: Record<Locale, ZoomControlsCopy> = {
  fr: {
    zoomIn: "Zoomer sur le logo",
    zoomOut: "Dézoomer",
    gestureHint: "Zoom : pince le trackpad ou Ctrl + molette",
  },
  en: {
    zoomIn: "Zoom in on the logo",
    zoomOut: "Zoom out",
    gestureHint: "Zoom: pinch the trackpad or Ctrl + scroll",
  },
};

const BUTTON_CLASS =
  "flex min-h-11 min-w-11 items-center justify-center bg-ink text-lg leading-none text-lemon transition-opacity hover:opacity-80";

export function ZoomControls({
  locale,
  onZoom,
}: {
  locale: Locale;
  onZoom: (direction: ZoomDirection) => void;
}) {
  const strings = copy[locale];

  return (
    <div className="absolute bottom-5 left-5 flex items-center gap-2 md:left-8">
      <button
        type="button"
        onClick={() => onZoom("out")}
        aria-label={strings.zoomOut}
        className={BUTTON_CLASS}
      >
        &minus;
      </button>
      <button
        type="button"
        onClick={() => onZoom("in")}
        aria-label={strings.zoomIn}
        className={BUTTON_CLASS}
      >
        +
      </button>
      <p className="hidden text-xs uppercase tracking-wide text-ink/70 md:block">
        {strings.gestureHint}
      </p>
    </div>
  );
}
