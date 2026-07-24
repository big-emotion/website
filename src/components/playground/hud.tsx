"use client";

import { useState, type ReactNode } from "react";
import { BackLink } from "@/components/back-link";
import { isChallengeUnlocked } from "./challenges";
import { resolveShareText, shareEffect, type ShareOutcome } from "./share";

type ShareCopy = {
  button: string;
  sharedToast: string;
  copiedToast: string;
  failedToast: string;
};

/**
 * The chrome frame every effect page mounts (PG-07/PG-08): an ink bar carrying the back
 * link, the effect's own h1 and the badge slots, then the stage, then the share action.
 *
 * Two things the first cut got wrong. The bar started under the fixed site header — the
 * header is rendered by the layout, outside this tree, so nothing tells it to make room
 * and the back link printed straight over the logo. And the share button has moved out of
 * that bar down to the thumb zone below the stage, where it no longer competes with the
 * header's own controls for the top-right corner.
 *
 * Share-variant switching (SWBE-217/REQ-043): once this browser has unlocked `effectId`'s
 * hidden challenge, sharing brags with `unlockedShareText` instead of just the title —
 * see `resolveShareText` in `share.ts`. A cancelled native share leaves the toast empty
 * rather than announcing anything, so dismissing the OS sheet doesn't read as an error.
 */
export function EffectHud({
  title,
  backHref,
  shareUrl,
  copy,
  effectId,
  unlockedShareText,
  stage,
  children,
}: {
  title: string;
  backHref: string;
  shareUrl: string;
  copy: { back: string; share: ShareCopy };
  effectId?: string;
  unlockedShareText?: string;
  /** The effect itself, framed between the title bar and the share action. */
  stage?: ReactNode;
  /** Badge row beside the title — the counter chip and the challenge badge. */
  children?: ReactNode;
}) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  async function handleShare() {
    const unlocked = effectId !== undefined && isChallengeUnlocked(effectId);
    const text = resolveShareText(unlockedShareText, unlocked);
    const result = await shareEffect(text ? { url: shareUrl, title, text } : { url: shareUrl, title });
    setOutcome(result);
  }

  const toast =
    outcome === "shared"
      ? copy.share.sharedToast
      : outcome === "copied"
        ? copy.share.copiedToast
        : outcome === "failed"
          ? copy.share.failedToast
          : "";

  return (
    <>
      {/* The header's clearance stays on the page surface rather than on the ink band:
          the accent ledger tells the fixed header to draw itself in ink on Playground
          routes (right for the grey gallery), so an ink band reaching under it would
          hide the logo on black. The band starts where the header ends. */}
      <div className="px-5 pt-28 md:px-8 md:pt-36">
        <div className="bg-ink px-5 py-6 text-paper md:px-8">
          <BackLink href={backHref} label={copy.back} />

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[clamp(2.25rem,8vw,6rem)] leading-none">{title}</h1>
            <div className="flex flex-wrap items-center gap-3">{children}</div>
          </div>
        </div>
      </div>

      {stage}

      {/* Thumb zone: the primary action sits under the stage, within reach on mobile and
          clear of both the site header above and the effect's own in-stage controls. */}
      <div className="px-5 pt-6 pb-16 md:px-8 md:pb-24">
        <button
          type="button"
          onClick={handleShare}
          className="font-display min-h-11 w-full border-2 border-ink bg-lemon px-6 text-sm uppercase tracking-wide text-ink transition-opacity hover:opacity-80 md:w-auto"
        >
          {copy.share.button}
        </button>

        <p role="status" aria-live="polite" className="sr-only">
          {toast}
        </p>
      </div>
    </>
  );
}
