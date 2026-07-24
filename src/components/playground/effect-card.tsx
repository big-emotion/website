"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { CardPreview } from "./card-preview";
import type { PreviewMotion } from "./preview/runtime";

export interface EffectCardProps {
  /** Locale-agnostic path (e.g. "/playground/poids-lourd") — `Link` adds the prefix. */
  href: string;
  /** Registry title. Lands in a `font-display` slot, so it is authored ASCII-only. */
  title: string;
  /** The registry's one-line description, set in the body face — accents welcome. */
  hook: string;
  playLabel: string;
  /** Which sample of the effect the card plays while it is hovered or focused. */
  preview: PreviewMotion;
}

/**
 * One tile in the gallery grid (PG-03). The preview stars the brand lockup itself rather
 * than a thumbnail: all three effects act on that one mark, so a photo of it would say
 * less than the mark does.
 *
 * The whole tile is the link, and the "Jouer" pill is `aria-hidden` — announcing it would
 * give the three cards the same accessible name and strand a screen-reader user choosing
 * between them (WCAG 2.4.4). The pill still carries the 44px target for everyone else.
 *
 * Hovering or focusing the tile plays a live sample of the effect over that lockup. The
 * card is a client component only for that: it owns the hover/focus state and hands it to
 * `CardPreview`, which is what decides whether any 3D is worth loading at all.
 */
export function EffectCard({ href, title, hook, playLabel, preview }: EffectCardProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <article
      className="group relative border-2 border-ink bg-paper transition-transform duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1.5 focus-within:-translate-y-1.5"
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      // React's onFocus/onBlur ride focusin/focusout, so focusing the title link inside
      // the card counts as focusing the card — keyboard gets the same preview as hover.
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
    >
      <div
        data-testid="effect-card-preview"
        aria-hidden="true"
        className="aspect-[4/3] border-b-2 border-ink bg-brutal"
      >
        <CardPreview motion={preview} active={playing}>
          <div className="flex h-full w-full items-center justify-center">
            <Logo className="w-[70%] text-ink transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:-rotate-3 group-hover:scale-105" />
          </div>
        </CardPreview>
      </div>

      <div className="p-5">
        <h2 className="font-display text-[clamp(1.5rem,6vw,2rem)] uppercase leading-none text-ink">
          {/* The overlay pseudo-element makes the whole tile the target (PG-03) while the
              accessible name stays the effect alone — wrapping the card in the anchor
              would fold the hook into every link's name and blur the three apart. */}
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {title}
          </Link>
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">{hook}</p>
        <span
          aria-hidden="true"
          className="font-display mt-5 inline-flex min-h-11 items-center border-2 border-ink bg-lemon px-5 text-sm uppercase tracking-wide text-ink"
        >
          {playLabel}
        </span>
      </div>
    </article>
  );
}
