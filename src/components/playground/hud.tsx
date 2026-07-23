"use client";

import { useState, type ReactNode } from "react";
import { shareEffect, type ShareOutcome } from "./share";

type ShareCopy = {
  button: string;
  sharedToast: string;
  copiedToast: string;
  failedToast: string;
};

/**
 * The chrome frame every effect page mounts (PG-18): the effect's own h1, a link back
 * to the gallery, the native-share/clipboard control with its toast, and two slots —
 * `children` — for the counter chip (story 6) and the challenge badge (story 7),
 * neither of which exists yet. A cancelled native share leaves the toast empty rather
 * than announcing anything, so dismissing the OS sheet doesn't read as an error.
 */
export function EffectHud({
  title,
  backHref,
  shareUrl,
  copy,
  children,
}: {
  title: string;
  backHref: string;
  shareUrl: string;
  copy: { back: string; share: ShareCopy };
  children?: ReactNode;
}) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  async function handleShare() {
    const result = await shareEffect({ url: shareUrl, title });
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
    <div className="bg-brutal text-ink">
      <div className="flex items-center justify-between px-5 py-6 md:px-8">
        <a href={backHref} className="font-display text-sm uppercase tracking-wide">
          {copy.back}
        </a>

        <div className="flex items-center gap-3">
          {children}
          <button
            type="button"
            onClick={handleShare}
            className="font-display bg-ink px-4 py-2 text-sm uppercase tracking-wide text-lemon transition-opacity hover:opacity-80"
          >
            {copy.share.button}
          </button>
        </div>
      </div>

      <h1 className="px-5 font-display text-[clamp(2.25rem,8vw,6rem)] md:px-8">{title}</h1>

      <p role="status" aria-live="polite" className="sr-only">
        {toast}
      </p>
    </div>
  );
}
