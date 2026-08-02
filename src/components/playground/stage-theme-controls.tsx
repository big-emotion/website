"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import {
  allowedLogoColors,
  STAGE_COLORS,
  stageColorToken,
  withBackdrop,
  type StageColor,
  type StageTheme,
} from "./stage-theme";

// Same self-contained copy convention as zoom-controls: this component is the only
// consumer. The toggle renders in the display face — ASCII only (DEC-023). Colour
// names are the charter's own token names, shared by both locales.
const COLOR_NAMES: Record<StageColor, string> = {
  lemon: "Lemon",
  tangerine: "Tangerine",
  lyon: "Lyon",
  brutal: "Brutal",
  ink: "Ink",
  paper: "Paper",
};

const copy: Record<Locale, { toggle: string; backdrop: string; logo: string }> = {
  fr: { toggle: "Couleurs", backdrop: "Fond du stage", logo: "Couleur du logo" },
  en: { toggle: "Colors", backdrop: "Stage backdrop", logo: "Logo color" },
};

type StageThemeControlsProps = {
  locale: Locale;
  theme: StageTheme;
  onThemeChange: (theme: StageTheme) => void;
};

/**
 * The two-row colour picker every effect mounts over its stage: backdrop first, then
 * the logo colours that backdrop allows (`stage-theme.ts` owns the pairing rules).
 * Collapsed behind a toggle so the stage chrome stays quiet until asked.
 */
export function StageThemeControls({ locale, theme, onThemeChange }: StageThemeControlsProps) {
  const [open, setOpen] = useState(false);
  const strings = copy[locale];

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="font-display min-h-11 bg-ink px-4 text-sm uppercase tracking-wide text-lemon transition-opacity hover:opacity-80"
      >
        {strings.toggle}
      </button>
      {open ? (
        <div className="flex flex-col gap-3 bg-ink p-3 text-paper">
          <SwatchRow
            label={strings.backdrop}
            colors={[...STAGE_COLORS]}
            selected={theme.backdrop}
            onPick={(color) => onThemeChange(withBackdrop(theme, color))}
          />
          <SwatchRow
            label={strings.logo}
            colors={allowedLogoColors(theme.backdrop)}
            selected={theme.logo}
            onPick={(color) => onThemeChange({ ...theme, logo: color })}
          />
        </div>
      ) : null}
    </div>
  );
}

function SwatchRow({
  label,
  colors,
  selected,
  onPick,
}: {
  label: string;
  colors: StageColor[];
  selected: StageColor;
  onPick: (color: StageColor) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <p aria-hidden="true" className="text-xs uppercase tracking-wide opacity-70">
        {label}
      </p>
      <div className="flex gap-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={COLOR_NAMES[color]}
            aria-pressed={color === selected}
            onClick={() => onPick(color)}
            // The token variable, not the hex: the swatch is DOM, so it reads the
            // palette straight from globals.css like every other surface.
            style={{ backgroundColor: stageColorToken(color) }}
            className="size-11 rounded-full border-2 border-paper/40 transition-transform hover:scale-105 aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-paper"
          />
        ))}
      </div>
    </div>
  );
}
