// The Playground's hidden-challenge state (SWBE-217/REQ-043): exactly one secret
// challenge per effect, discovered through play — detection physics live in each
// effect's own story, out of scope here — and remembered client-side only. A badge
// unlock is `localStorage` on this browser, never a server write (DEC-016 in spirit:
// v1 stays account-free).

const STORAGE_KEY = "playground:unlocked-challenges";

/** Dispatched on `window` once per effect the first time it unlocks, so `BadgeChip`
 *  and `ChallengeCelebration` can react live without polling — same pattern as
 *  `report-interaction.ts`'s interaction event. Never fires again for a repeat visit. */
export const CHALLENGE_UNLOCKED_EVENT = "playground:challenge-unlocked";

export type ChallengeUnlockedDetail = { effectId: string };

function readUnlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id): id is string => typeof id === "string"))
      : new Set();
  } catch {
    // Corrupted or inaccessible storage reads as "nothing unlocked yet" rather than throwing.
    return new Set();
  }
}

function writeUnlocked(unlocked: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(unlocked)));
  } catch {
    // Storage full or disabled (private browsing): the unlock just doesn't persist.
  }
}

export function isChallengeUnlocked(effectId: string): boolean {
  return readUnlocked().has(effectId);
}

export function getUnlockedChallenges(): string[] {
  return Array.from(readUnlocked());
}

/**
 * Marks `effectId`'s hidden challenge unlocked. Idempotent: returns whether this call
 * is the one that newly unlocked it — `false` if it was already unlocked — and only
 * dispatches `CHALLENGE_UNLOCKED_EVENT` on that first call, so a badge never
 * re-celebrates on a later visit or a duplicate detection.
 */
export function unlockChallenge(effectId: string): boolean {
  const unlocked = readUnlocked();
  if (unlocked.has(effectId)) return false;

  unlocked.add(effectId);
  writeUnlocked(unlocked);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ChallengeUnlockedDetail>(CHALLENGE_UNLOCKED_EVENT, { detail: { effectId } }),
    );
  }

  return true;
}
