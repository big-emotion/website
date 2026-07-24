"use client";

import { useSyncExternalStore } from "react";
import { CHALLENGE_UNLOCKED_EVENT, isChallengeUnlocked } from "./challenges";

function subscribe(onChange: () => void) {
  window.addEventListener(CHALLENGE_UNLOCKED_EVENT, onChange);
  return () => window.removeEventListener(CHALLENGE_UNLOCKED_EVENT, onChange);
}

// Assume locked on the server so hydration never flashes a badge before the real,
// client-only localStorage check runs — same rationale as scene-canvas.tsx's
// reduced-motion snapshot.
function getServerSnapshot() {
  return false;
}

/**
 * The hidden-challenge badge slot in `EffectHud` (SWBE-217/REQ-043): renders nothing
 * so the challenge stays a secret, then appears once this browser has unlocked it —
 * either from a past visit or live, via the same `CHALLENGE_UNLOCKED_EVENT`
 * `ChallengeCelebration` reacts to. `label` is undefined for an effect with no
 * registered badge; that's treated the same as locked.
 */
export function BadgeChip({ effectId, label }: { effectId: string; label?: string }) {
  const unlocked = useSyncExternalStore(
    subscribe,
    () => isChallengeUnlocked(effectId),
    getServerSnapshot,
  );

  if (!unlocked || !label) return null;

  return (
    <p className="font-display bg-lemon text-ink px-3 py-1 text-sm uppercase tracking-wide">
      {label}
    </p>
  );
}
