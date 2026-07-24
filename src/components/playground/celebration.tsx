"use client";

import { useEffect, useState } from "react";
import { CHALLENGE_UNLOCKED_EVENT, type ChallengeUnlockedDetail } from "./challenges";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CONFETTI_COUNT = 24;
const CONFETTI_COLORS = ["var(--color-lemon)", "var(--color-tangerine)", "var(--color-lyon)"];

/**
 * The celebration for a hidden-challenge unlock (SWBE-217/REQ-043): an accessible
 * toast plus a confetti burst, shown once per unlock event for this effect. Under
 * `prefers-reduced-motion` the toast still announces the unlock, but no confetti
 * renders — the message lands, nothing moves.
 */
export function ChallengeCelebration({
  effectId,
  message,
}: {
  effectId: string;
  message?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    function onUnlocked(event: Event) {
      const detail = (event as CustomEvent<ChallengeUnlockedDetail>).detail;
      if (detail?.effectId !== effectId) return;
      setReducedMotion(window.matchMedia(MOTION_QUERY).matches);
      setVisible(true);
    }

    window.addEventListener(CHALLENGE_UNLOCKED_EVENT, onUnlocked);
    return () => window.removeEventListener(CHALLENGE_UNLOCKED_EVENT, onUnlocked);
  }, [effectId]);

  if (!visible || !message) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-5 py-8 md:px-8">
      {!reducedMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
            <span
              key={index}
              className="challenge-confetti"
              style={{
                left: `${(index / CONFETTI_COUNT) * 100}%`,
                animationDelay: `${(index % 6) * 0.12}s`,
                backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
              }}
            />
          ))}
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className="font-display bg-ink text-lemon px-5 py-3 text-sm uppercase tracking-wide"
      >
        {message}
      </p>
    </div>
  );
}
